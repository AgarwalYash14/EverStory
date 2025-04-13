import { useQuery } from '@tanstack/react-query';
import { authApi, postsApi } from './api';

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    bio?: string;
    profile_image?: string;
    created_at: string;
    updated_at: string;
}

// Get user profile by ID
export const useUserProfile = (userId: number | string) => {
    return useQuery({
        queryKey: ['userProfile', userId],
        queryFn: async () => {
            const response = await authApi.get<UserProfile>(`/auth-service/api/users/${userId}`);
            return response.data;
        },
        enabled: Boolean(userId),
    });
};

// Get posts by user ID
export const useUserPosts = (userId: number | string) => {
    return useQuery({
        queryKey: ['userPosts', userId],
        queryFn: async () => {
            const response = await postsApi.get(`/image-service/api/posts/user/${userId}`);
            return response.data;
        },
        enabled: Boolean(userId),
    });
};