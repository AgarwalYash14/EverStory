import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { User } from 'lucide-react'
import { useUserProfile, useUserPosts } from '../../../services/profileService'
import UserProfileActions from '../../friends/components/UserProfileActions'
import PostCard from '../../posts/components/PostCard'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../../redux/store'
import { fetchFriendships } from '../../friends/redux/friendsSlice'
import { useFriendshipStatus } from '../../friends/hooks/useFriendshipStatus'

const UserProfile: React.FC = () => {
    const { userId } = useParams<{ userId: string }>()
    const { user: currentUser } = useSelector((state: RootState) => state.auth)
    const dispatch = useDispatch()

    // Fetch friendships when component mounts
    useEffect(() => {
        dispatch(fetchFriendships())
    }, [dispatch])

    // Handle case where userId is not defined, default to current user
    const profileUserId = userId || currentUser?.id?.toString()

    if (!profileUserId) {
        return <div className="p-10 text-center">User not found</div>
    }

    // Check friendship status with this user
    const { isFriend } = useFriendshipStatus(Number(profileUserId))

    const {
        data: userProfile,
        isLoading: profileLoading,
        isError: profileError,
    } = useUserProfile(profileUserId)

    const {
        data: userPosts,
        isLoading: postsLoading,
        isError: postsError,
    } = useUserPosts(profileUserId)

    const isOwnProfile = currentUser?.id === Number(profileUserId)

    if (profileLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-500">Loading profile...</p>
            </div>
        )
    }

    if (profileError || !userProfile) {
        return (
            <div className="mx-auto mt-10 max-w-3xl rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                <h3 className="font-medium">Error</h3>
                <p>
                    Unable to load user profile. The user may not exist or you
                    don't have permission to view this profile.
                </p>
            </div>
        )
    }

    // Filter posts based on privacy and friendship status
    const visiblePosts = userPosts?.items?.filter((post) => {
        // Show all posts if it's the user's own profile
        if (isOwnProfile) return true

        // Show only public posts or private posts if they are friends
        return !post.is_private || (post.is_private && isFriend)
    })

    return (
        <div className="mx-auto max-w-4xl p-4">
            {/* Profile Header */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                    {/* Profile Image */}
                    <div className="flex-shrink-0">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-100 p-4">
                            {userProfile.profile_image ? (
                                <img
                                    src={userProfile.profile_image}
                                    alt={userProfile.username}
                                    className="h-full w-full rounded-full object-cover"
                                />
                            ) : (
                                <User className="h-12 w-12 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-grow text-center md:text-left">
                        <h1 className="text-2xl font-bold">
                            {userProfile.username}
                        </h1>
                        {userProfile.bio && (
                            <p className="mt-2 text-gray-600 dark:text-gray-300">
                                {userProfile.bio}
                            </p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                            Member since{' '}
                            {new Date(
                                userProfile.created_at
                            ).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Friend/Follow Action Button */}
                    <div className="mt-4 md:mt-0">
                        {!isOwnProfile && (
                            <UserProfileActions
                                userId={Number(profileUserId)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* User Posts */}
            <h2 className="mb-4 text-xl font-semibold">Posts</h2>

            {postsLoading ? (
                <div className="p-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-500">Loading posts...</p>
                </div>
            ) : postsError ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                    <p>Failed to load posts. Please try again later.</p>
                </div>
            ) : visiblePosts?.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {visiblePosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="rounded-lg bg-gray-50 p-10 text-center dark:bg-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">
                        {isOwnProfile
                            ? "You haven't posted anything yet."
                            : `${userProfile.username} hasn't posted anything yet${!isFriend ? ' or their posts are private' : ''}.`}
                    </p>
                </div>
            )}
        </div>
    )
}

export default UserProfile
