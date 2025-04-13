import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import FriendsList from './FriendsList'
import FriendRequests from './FriendRequests'
import { RootState } from '../../../redux/store'
import { fetchPendingRequests } from '../redux/friendsSlice'

const FriendsIndex: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>(
        'friends'
    )
    const dispatch = useDispatch()
    const { pendingRequests, loading } = useSelector(
        (state: RootState) => state.friends
    )

    useEffect(() => {
        // Fetch pending requests when component mounts
        dispatch(fetchPendingRequests())
    }, [dispatch])

    const requestCount = pendingRequests?.length || 0

    return (
        <div className="mx-auto max-w-3xl p-4">
            <h1 className="mb-6 text-3xl font-bold">Friends</h1>

            {/* Tabs */}
            <div className="mb-6 flex border-b border-gray-200">
                <button
                    className={`px-4 py-2 font-medium ${
                        activeTab === 'friends'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('friends')}
                >
                    Friends
                </button>
                <button
                    className={`flex items-center px-4 py-2 font-medium ${
                        activeTab === 'requests'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('requests')}
                >
                    Friend Requests
                    {requestCount > 0 && (
                        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {requestCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="py-4 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                </div>
            )}

            {/* Content based on active tab */}
            <div className="mt-4">
                {activeTab === 'friends' ? <FriendsList /> : <FriendRequests />}
            </div>
        </div>
    )
}

export default FriendsIndex
