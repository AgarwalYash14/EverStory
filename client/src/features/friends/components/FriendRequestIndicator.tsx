import React, { useEffect } from 'react'
import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPendingRequests } from '../redux/friendsSlice'
import { RootState } from '../../../redux/store'

const FriendRequestIndicator: React.FC = () => {
    const dispatch = useDispatch()
    const { pendingRequests } = useSelector((state: RootState) => state.friends)

    useEffect(() => {
        dispatch(fetchPendingRequests())
    }, [dispatch])

    const requestCount = pendingRequests?.length || 0

    return (
        <Link
            to="/friends/requests"
            className="relative flex items-center text-gray-700 transition-colors hover:text-blue-500"
        >
            <Users className="h-5 w-5" />
            {requestCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {requestCount}
                </span>
            )}
        </Link>
    )
}

export default FriendRequestIndicator
