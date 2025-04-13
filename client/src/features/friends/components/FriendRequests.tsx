import React, { useEffect } from 'react'
import { Check, X, User } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState } from '../../../redux/store'
import {
    fetchPendingRequests,
    respondToFriendRequest,
} from '../redux/friendsSlice'

const FriendRequests: React.FC = () => {
    const dispatch = useDispatch()
    const { pendingRequests, loading, error } = useSelector(
        (state: RootState) => state.friends
    )

    useEffect(() => {
        dispatch(fetchPendingRequests())
    }, [dispatch])

    const handleAccept = (friendshipId: number) => {
        dispatch(respondToFriendRequest({ friendshipId, status: 'accepted' }))
    }

    const handleReject = (friendshipId: number) => {
        dispatch(respondToFriendRequest({ friendshipId, status: 'rejected' }))
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-500">Loading friend requests...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                <h3 className="font-medium">Error</h3>
                <p>Failed to load friend requests. Please try again later.</p>
                <p className="text-sm">{error}</p>
            </div>
        )
    }

    return (
        <div className="friend-requests-container space-y-4">
            <h2 className="text-2xl font-bold">Friend Requests</h2>

            {!pendingRequests || pendingRequests.length === 0 ? (
                <p className="py-5 text-center text-gray-500">
                    You don't have any pending friend requests.
                </p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {pendingRequests.map((request) => (
                        <li
                            key={request.id}
                            className="flex items-center justify-between py-4"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="rounded-full bg-gray-100 p-2">
                                    <User className="h-6 w-6 text-gray-500" />
                                </div>
                                <div>
                                    <Link
                                        to={`/profile/${request.requester_id}`}
                                        className="font-medium hover:text-blue-500"
                                    >
                                        {request.requester_username ||
                                            `User ${request.requester_id}`}
                                    </Link>
                                    <p className="text-sm text-gray-500">
                                        Sent you a friend request
                                    </p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    className="inline-flex items-center rounded-md bg-blue-500 px-3 py-1.5 text-white transition-colors hover:bg-blue-600"
                                    onClick={() => handleAccept(request.id)}
                                >
                                    <Check className="mr-1 h-4 w-4" />
                                    Accept
                                </button>
                                <button
                                    className="inline-flex items-center rounded-md bg-gray-200 px-3 py-1.5 text-gray-700 transition-colors hover:bg-gray-300"
                                    onClick={() => handleReject(request.id)}
                                >
                                    <X className="mr-1 h-4 w-4" />
                                    Reject
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default FriendRequests
