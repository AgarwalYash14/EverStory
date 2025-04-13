import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { friendsApi } from '../../../services/api';

export interface Friendship {
    id: number;
    requester_id: number;
    addressee_id: number;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    updated_at: string;
    requester_username?: string;
    addressee_username?: string;
}

interface FriendsState {
    friendships: Friendship[];
    pendingRequests: Friendship[];
    sentRequests: Friendship[];
    loading: boolean;
    error: string | null;
}

const initialState: FriendsState = {
    friendships: [],
    pendingRequests: [],
    sentRequests: [],
    loading: false,
    error: null,
};

// Async thunks
export const fetchFriendships = createAsyncThunk(
    'friends/fetchFriendships',
    async (_, { rejectWithValue }) => {
        try {
            const response = await friendsApi.get<Friendship[]>('');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch friendships');
        }
    }
);

export const fetchPendingRequests = createAsyncThunk(
    'friends/fetchPendingRequests',
    async (_, { rejectWithValue }) => {
        try {
            const response = await friendsApi.get<Friendship[]>('pending');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch pending requests');
        }
    }
);

export const fetchFriendRequests = createAsyncThunk(
    'friends/fetchFriendRequests',
    async (_, { rejectWithValue }) => {
        try {
            const response = await friendsApi.get<{
                sentRequests: Friendship[];
                receivedRequests: Friendship[];
            }>('/requests');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch friend requests');
        }
    }
);

export const sendFriendRequest = createAsyncThunk(
    'friends/sendFriendRequest',
    async (addressee_id: number, { rejectWithValue }) => {
        try {
            const response = await friendsApi.post<Friendship>('', { addressee_id });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to send friend request');
        }
    }
);

export const respondToFriendRequest = createAsyncThunk(
    'friends/respondToFriendRequest',
    async ({
        friendshipId,
        status
    }: {
        friendshipId: number;
        status: 'accepted' | 'rejected';
    }, { rejectWithValue }) => {
        try {
            const response = await friendsApi.patch<Friendship>(
                `/${friendshipId}`,
                { status }
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to respond to friend request');
        }
    }
);

export const deleteFriendship = createAsyncThunk(
    'friends/deleteFriendship',
    async (friendshipId: number, { rejectWithValue }) => {
        try {
            await friendsApi.delete(`/${friendshipId}`);
            return friendshipId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to delete friendship');
        }
    }
);

const friendsSlice = createSlice({
    name: 'friends',
    initialState,
    reducers: {
        resetFriendsError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch friendships
            .addCase(fetchFriendships.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFriendships.fulfilled, (state, action: PayloadAction<Friendship[]>) => {
                state.loading = false;
                state.friendships = action.payload.filter(f => f.status === 'accepted');

                // Store pending sent requests separately (without referencing currentUserId)
                const sentRequests = action.payload.filter(
                    f => f.status === 'pending'
                );
                state.sentRequests = sentRequests;
            })
            .addCase(fetchFriendships.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Fetch pending requests
            .addCase(fetchPendingRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPendingRequests.fulfilled, (state, action: PayloadAction<Friendship[]>) => {
                state.loading = false;
                state.pendingRequests = action.payload;
            })
            .addCase(fetchPendingRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Fetch friend requests
            .addCase(fetchFriendRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFriendRequests.fulfilled, (state, action: PayloadAction<{
                sentRequests: Friendship[];
                receivedRequests: Friendship[];
            }>) => {
                state.loading = false;
                state.sentRequests = action.payload.sentRequests;
                state.pendingRequests = action.payload.receivedRequests;
            })
            .addCase(fetchFriendRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Send friend request
            .addCase(sendFriendRequest.fulfilled, (state, action: PayloadAction<Friendship>) => {
                state.sentRequests = [...state.sentRequests, action.payload];
            })
            .addCase(sendFriendRequest.rejected, (state, action) => {
                state.error = action.payload as string;
            })

            // Respond to friend request
            .addCase(respondToFriendRequest.fulfilled, (state, action: PayloadAction<Friendship>) => {
                const friendship = action.payload;

                // Remove from pending requests
                state.pendingRequests = state.pendingRequests.filter(req => req.id !== friendship.id);

                // If accepted, add to friendships
                if (friendship.status === 'accepted') {
                    state.friendships = [...state.friendships, friendship];
                }
            })
            .addCase(respondToFriendRequest.rejected, (state, action) => {
                state.error = action.payload as string;
            })

            // Delete friendship
            .addCase(deleteFriendship.fulfilled, (state, action: PayloadAction<number>) => {
                const friendshipId = action.payload;
                state.friendships = state.friendships.filter(f => f.id !== friendshipId);
                state.sentRequests = state.sentRequests.filter(f => f.id !== friendshipId);
                state.pendingRequests = state.pendingRequests.filter(f => f.id !== friendshipId);
            })
            .addCase(deleteFriendship.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { resetFriendsError } = friendsSlice.actions;
export default friendsSlice.reducer;