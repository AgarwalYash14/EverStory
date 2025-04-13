import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../redux/store';

// Define types
interface User {
    id: string;
    username: string;
    email: string;
    role?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// Initial state - no token needed since we're using cookies
const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

// Async thunks for authentication
export const login = createAsyncThunk(
    'auth/login',
    async ({ user }: { user: User }, { rejectWithValue }) => {
        // The actual login process is handled in authService.ts
        // We just need to store the user data in Redux
        return { user };
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (
        { username, email, password }: { username: string; email: string; password: string },
        { rejectWithValue }
    ) => {
        // This is handled by the useRegister hook in authService.ts
        return { success: true };
    }
);

export const loadUser = createAsyncThunk(
    'auth/loadUser',
    async ({ user }: { user: User }, { rejectWithValue }) => {
        // Just pass the user from the service to the reducer
        return { user };
    }
);

// Auth slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login cases
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action: PayloadAction<{ user: User }>) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Register cases
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Load user cases
            .addCase(loadUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loadUser.fulfilled, (state, action: PayloadAction<{ user: User }>) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
            })
            .addCase(loadUser.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.error = action.payload as string;
            });
    },
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;