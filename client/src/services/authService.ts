import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authApi, fetchData, postData } from './api';
import { login as loginAction, logout, loadUser as loadUserAction } from '../features/auth/redux/authSlice';
import { AppDispatch } from '../redux/store';

// Types
export interface User {
    id: string; // Changed to string to match with Redux store
    username: string;
    email: string;
    profile_image?: string;
    bio?: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    profile_image?: string;
    bio?: string;
    created_at: string;
}

export interface UserSearchResult {
    users: UserResponse[];
    total: number;
}

// Login hook with React Query and Redux
export const useLogin = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (credentials: LoginCredentials) => {
            try {
                // Create URLSearchParams to match the OAuth2 password flow expected by the backend
                const data = new URLSearchParams();
                data.append('username', credentials.username);
                data.append('password', credentials.password);
                data.append('grant_type', 'password');

                // Fixed endpoint path - removed duplicate /auth
                const response = await authApi.post('/login', data, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    withCredentials: true
                });

                // Return auth response data - token is stored in cookie
                return response.data;
            } catch (error: unknown) {
                console.error('Login error:', error instanceof Error ? error.message : error);
                throw error;
            }
        },
        onSuccess: async (authResponse) => {
            try {
                // Fetch user data after successful login - fixed path
                const userData = await fetchData<UserResponse>(authApi, '/user');

                // Transform response to match our Redux store format
                const user = {
                    id: String(userData.id),
                    username: userData.username,
                    email: userData.email,
                    profile_image: userData.profile_image,
                    bio: userData.bio
                };

                // Update query cache with user data
                queryClient.setQueryData(['currentUser'], userData);

                // Dispatch to Redux store
                dispatch(loginAction({
                    user: user
                }));

                // Prefetch core data the user will need
                queryClient.prefetchQuery({ queryKey: ['friendships'] });
                queryClient.prefetchQuery({ queryKey: ['posts', 'feed'] });

                // Navigate to home page or dashboard after successful login
                navigate('/');
            } catch (error: unknown) {
                console.error('Failed to fetch user data after login', error instanceof Error ? error.message : error);
                // Don't throw error here to prevent login from appearing failed
                // Instead, handle the error gracefully
            }
        },
    });
};

// Register hook with React Query
export const useRegister = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (userData: RegisterData) =>
            // Fixed endpoint path - removed duplicate /auth
            postData<AuthResponse, RegisterData>(authApi, '/register', userData),
        onSuccess: () => {
            // After successful registration, navigate to login
            navigate('/login', {
                state: { message: 'Registration successful! Please sign in with your new account.' }
            });
        }
    });
};

// Get current user hook with React Query and Redux
export const useCurrentUser = () => {
    const dispatch = useDispatch<AppDispatch>();

    return useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            try {
                // Fixed endpoint to match backend route structure
                const userData = await fetchData<UserResponse>(authApi, '/user');

                // Dispatch user data to Redux store using loadUser action
                dispatch(loadUserAction({
                    user: {
                        id: String(userData.id), // Convert to string to match Redux store type
                        username: userData.username,
                        email: userData.email,
                        role: 'user' // Assuming default role
                    }
                }));

                return userData;
            } catch (error) {
                // Clear auth state if unauthorized
                dispatch(logout());
                throw error;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
    });
};

// Search for users by username
export const useSearchUsers = (query: string) => {
    return useQuery({
        queryKey: ['userSearch', query],
        queryFn: async () => {
            if (!query || query.trim().length < 2) {
                return { users: [], total: 0 };
            }

            const params = new URLSearchParams({
                query: query,
                limit: '10'
            });

            return fetchData<UserSearchResult>(authApi, `/users/search?${params.toString()}`);
        },
        staleTime: 1000 * 60, // 1 minute
        enabled: !!query && query.trim().length >= 2, // Only run if query has at least 2 characters
    });
};

// Logout hook with React Query and Redux
export const useLogout = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();

    return useMutation({
        mutationFn: async () => {
            try {
                // The cookie will be cleared by the server
                await authApi.post('/logout');
            } catch (error: unknown) {
                console.error('Logout error:', error instanceof Error ? error.message : error);
            }
            return true;
        },
        onSuccess: () => {
            // Invalidate and remove user data from cache
            queryClient.removeQueries({ queryKey: ['auth', 'user'] });

            // Dispatch logout action to Redux
            dispatch(logout());
        },
    });
};

// Check if user is authenticated - make a simple request to check cookie validity
export const isAuthenticated = async (): Promise<boolean> => {
    try {
        // Fixed endpoint path - removed duplicate /auth
        await authApi.get('/user');
        return true;
    } catch (_error) {
        return false;
    }
};

// For synchronous checks (like route protection)
export const isAuthenticatedSync = (): boolean => {
    try {
        // Get query client instance - must be used inside React component
        const queryClient = useQueryClient();
        const userData = queryClient.getQueryData(['auth', 'user']);
        return !!userData;
    } catch (_error) {
        // If we're outside React context, we can't access the query client
        return false;
    }
};