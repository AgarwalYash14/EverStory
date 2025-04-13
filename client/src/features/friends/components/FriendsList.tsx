import React, { useEffect } from 'react'
import { User, UserX } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState } from '../../../redux/store'
import { fetchFriendships, deleteFriendship } from '../redux/friendsSlice'

const FriendsList: React.FC = () => {
    const dispatch = useDispatch()
    const { user } = useSelector((state: RootState) => state.auth)
    const { friendships, loading, error } = useSelector(
        (state: RootState) => state.friends
    )

    useEffect(() => {
        dispatch(fetchFriendships())
    }, [dispatch])

    const handleUnfriend = (friendshipId: number) => {
        dispatch(deleteFriendship(friendshipId))
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-500">Loading your friends...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                <h3 className="font-medium">Error</h3>
                <p>Failed to load friends. Please try again later.</p>
                <p className="text-sm">{error}</p>
            </div>
        )
    }

    // Filter to accepted friendships only and format each friendship to display the other user's info
    const acceptedFriendships = friendships.filter(
        (f) => f.status === 'accepted'
    )

    const formattedFriends = acceptedFriendships.map((friendship) => {
        // Convert user.id to number for consistent comparison
        const currentUserId = Number(user?.id)
        const isRequester = friendship.requester_id === currentUserId
        const friendId = isRequester
            ? friendship.addressee_id
            : friendship.requester_id
        const friendUsername = isRequester
            ? friendship.addressee_username
            : friendship.requester_username

        return {
            id: friendship.id,
            userId: friendId,
            username: friendUsername || `User ${friendId}`,
        }
    })

    return (
        <div className="friends-list-container space-y-4">
            <h2 className="text-2xl font-bold">Your Friends</h2>

            {formattedFriends.length === 0 ? (
                <p className="py-5 text-center text-gray-500">
                    You don't have any friends yet. Start connecting with
                    others!
                </p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {formattedFriends.map((friend) => (
                        <li
                            key={friend.id}
                            className="flex items-center justify-between py-4"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="rounded-full bg-gray-100 p-2">
                                    <User className="h-6 w-6 text-gray-500" />
                                </div>
                                <Link
                                    to={`/profile/${friend.userId}`}
                                    className="font-medium hover:text-blue-500"
                                >
                                    {friend.username}
                                </Link>
                            </div>
                            <button
                                className="inline-flex items-center rounded-md bg-red-50 px-3 py-1.5 text-red-700 transition-colors hover:bg-red-100"
                                onClick={() => handleUnfriend(friend.id)}
                            >
                                <UserX className="mr-1 h-4 w-4" />
                                Unfriend
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default FriendsList
