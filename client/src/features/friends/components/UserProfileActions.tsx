import React, { useState, useEffect } from 'react'
import { UserPlus, UserMinus, Check, Clock } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../redux/store'
import {
    fetchFriendships,
    sendFriendRequest,
    deleteFriendship,
} from '../redux/friendsSlice'

interface UserProfileActionsProps {
    userId: number
}

const UserProfileActions: React.FC<UserProfileActionsProps> = ({ userId }) => {
    const [isHovered, setIsHovered] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const dispatch = useDispatch()
    const { user } = useSelector((state: RootState) => state.auth)
    const { friendships, sentRequests, loading } = useSelector(
        (state: RootState) => state.friends
    )

    // Don't show follow/unfollow buttons on own profile
    if (user?.id === userId.toString()) {
        return null
    }

    useEffect(() => {
        dispatch(fetchFriendships())
            .then(() => setIsLoading(false))
            .catch(() => setIsLoading(false))
    }, [dispatch])

    // Check friendship status
    const friendship = friendships.find(
        (f) =>
            (f.requester_id === userId || f.addressee_id === userId) &&
            f.status === 'accepted'
    )

    // Check for pending sent request
    const pendingSentRequest = sentRequests.find(
        (f) => f.addressee_id === userId
    )

    // Check for pending received request
    const pendingReceivedRequest = friendships.find(
        (f) =>
            f.requester_id === userId &&
            f.status === 'pending' &&
            f.addressee_id === Number(user?.id)
    )

    const handleSendRequest = () => {
        dispatch(sendFriendRequest(userId))
    }

    const handleUnfriend = () => {
        if (friendship?.id) {
            dispatch(deleteFriendship(friendship.id))
        }

        if (pendingSentRequest?.id) {
            dispatch(deleteFriendship(pendingSentRequest.id))
        }
    }

    if (loading || isLoading) {
        return (
            <button
                className="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-gray-700"
                disabled
            >
                <div className="mr-2 h-4 w-4 animate-pulse rounded-full bg-gray-400"></div>
                Loading...
            </button>
        )
    }

    // No relationship yet
    if (!friendship && !pendingSentRequest && !pendingReceivedRequest) {
        return (
            <button
                className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                onClick={handleSendRequest}
            >
                <UserPlus className="mr-2 h-5 w-5" />
                Add Friend
            </button>
        )
    }

    // Pending friendship (sent request)
    if (pendingSentRequest) {
        return (
            <button
                className="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
                onClick={handleUnfriend}
            >
                <Clock className="mr-2 h-5 w-5" />
                Cancel Request
            </button>
        )
    }

    // Pending friendship (received request)
    if (pendingReceivedRequest) {
        return (
            <div className="space-x-2">
                <span className="text-gray-500">
                    <Clock className="mr-1 inline h-4 w-4" />
                    Friend Request Received
                </span>
            </div>
        )
    }

    // Accepted friendship
    if (friendship?.status === 'accepted') {
        return (
            <button
                className="inline-flex items-center rounded-md bg-green-50 px-4 py-2 text-green-700 transition-colors hover:bg-green-100"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleUnfriend}
            >
                {isHovered ? (
                    <>
                        <UserMinus className="mr-2 h-5 w-5" />
                        Unfriend
                    </>
                ) : (
                    <>
                        <Check className="mr-2 h-5 w-5" />
                        Friends
                    </>
                )}
            </button>
        )
    }

    // Rejected friendship, show add friend button again
    return (
        <button
            className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            onClick={handleSendRequest}
        >
            <UserPlus className="mr-2 h-5 w-5" />
            Add Friend
        </button>
    )
}

export default UserProfileActions
