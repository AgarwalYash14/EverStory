import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from './api';
import { queryInvalidator } from './queryInvalidator';

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

export interface FriendshipCreate {
    addressee_id: number;
}

export interface FriendshipStatusUpdate {
    status: 'accepted' | 'rejected';
}

// Get all user friendships
export const useFriendships = () => {
    return useQuery({
        queryKey: ['friendships'],
        queryFn: async () => {
            const response = await friendsApi.get<Friendship[]>('');
            return response.data;
        },
    });
};

// Get pending friend requests
export const usePendingFriendRequests = () => {
    return useQuery({
        queryKey: ['friendRequests', 'pending'],
        queryFn: async () => {
            // Fix: Use the correct endpoint structure
            const response = await friendsApi.get<Friendship[]>('pending');
            return response.data;
        },
    });
};

// Get all friend requests (sent and received)
export const useFriendRequests = () => {
    return useQuery({
        queryKey: ['friendRequests'],
        queryFn: async () => {
            console.log('Fetching friend requests from:', '/requests');
            try {
                const response = await friendsApi.get<{
                    sentRequests: Friendship[];
                    receivedRequests: Friendship[];
                }>('/requests');
                console.log('Received Response from:', '/requests', response.status);
                return response.data;
            } catch (error) {
                console.error('Error fetching friend requests:', error);
                throw error;
            }
        },
    });
};

// Send a friend request
export const useSendFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (addressee_id: number) => {
            const response = await friendsApi.post<Friendship>('', { addressee_id });
            return response.data;
        },
        onSuccess: () => {
            // Call invalidateFriendships without parameters instead of passing queryClient
            queryInvalidator.invalidateFriendships();
        },
    });
};

// Respond to a friend request (accept or reject)
export const useRespondToFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            friendshipId,
            status
        }: {
            friendshipId: number;
            status: 'accepted' | 'rejected';
        }) => {
            const response = await friendsApi.patch<Friendship>(
                `/${friendshipId}`,
                { status }
            );
            return response.data;
        },
        onSuccess: () => {
            // Call invalidateFriendships without parameters instead of passing queryClient
            queryInvalidator.invalidateFriendships();
        },
    });
};

// Delete a friendship (unfriend)
export const useDeleteFriendship = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (friendshipId: number) => {
            await friendsApi.delete(`/${friendshipId}`);
        },
        onSuccess: () => {
            // Call invalidateFriendships without parameters instead of passing queryClient
            queryInvalidator.invalidateFriendships();
        },
    });
};

// Check friendship status with another user
export const useFriendshipStatus = (userId: number) => {
    return useQuery({
        queryKey: ['friendshipStatus', userId],
        queryFn: async () => {
            const response = await friendsApi.get<Friendship[]>('');
            const friendships = response.data;

            // Find any friendship with the specified user
            const friendship = friendships.find(f =>
                (f.requester_id === userId || f.addressee_id === userId)
            );

            if (!friendship) {
                return { status: 'none', friendship: null };
            }

            return { status: friendship.status, friendship };
        },
        enabled: Boolean(userId),
    });
};

// A simplified hook to just check if two users are friends (with memoization)
export const useCheckFriendship = (userId: number) => {
    const { data, isLoading } = useFriendshipStatus(userId);

    const isFriend = Boolean(data?.status === 'accepted');
    const isPending = Boolean(data?.status === 'pending');

    return {
        isFriend,
        isPending,
        isLoading,
        relationship: data?.status || 'none',
        friendship: data?.friendship
    };
};