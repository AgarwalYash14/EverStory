import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFriendships } from '../redux/friendsSlice';
import { RootState } from '../../../redux/store';

export function useFriendshipStatus(userId: number | null) {
    const [isLoading, setIsLoading] = useState(true);
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const { friendships, sentRequests } = useSelector((state: RootState) => state.friends);

    // Convert userId to number to ensure consistent comparison
    const userIdNum = userId !== null ? Number(userId) : null;

    useEffect(() => {
        if (userIdNum) {
            dispatch(fetchFriendships())
                .then(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [dispatch, userIdNum]);

    const friendshipStatus = useMemo(() => {
        if (!userIdNum || !user) return { isFriend: false, isPending: false };

        if (Number(user.id) === userIdNum) {
            // User is viewing their own content
            return { isFriend: true, isPending: false, isSelf: true };
        }

        // Check if they're friends (accepted status)
        const existingFriendship = friendships.find(f =>
            (f.requester_id === userIdNum || f.addressee_id === userIdNum) &&
            f.status === 'accepted'
        );

        // Check for pending sent request
        const pendingSentRequest = sentRequests.find(f => f.addressee_id === userIdNum);

        // Check for pending received request
        const pendingReceivedRequest = friendships.find(f =>
            f.requester_id === userIdNum &&
            f.status === 'pending' &&
            f.addressee_id === Number(user.id)
        );

        return {
            isFriend: !!existingFriendship,
            isPending: !!(pendingSentRequest || pendingReceivedRequest),
            isSelf: false,
            friendship: existingFriendship || pendingReceivedRequest,
            sentRequest: pendingSentRequest
        };
    }, [friendships, sentRequests, userIdNum, user]);

    return {
        ...friendshipStatus,
        isLoading
    };
}