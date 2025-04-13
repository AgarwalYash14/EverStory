import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle } from 'lucide-react'
import { Post } from '../../../services/postsService'
import {
    useLikePost,
    useUnlikePost,
    usePostComments,
    useAddComment,
} from '../../../services/postsService'
import { useCurrentUser } from '../../../services/authService'
import { useFriendshipStatus } from '../../friends/hooks/useFriendshipStatus'
import PrivacyIndicator from './PrivacyIndicator'

// For local development, when images are served through FastAPI's static file server
const IMAGE_SERVICE_BASE_URL = 'http://localhost:8080'

// Helper function to construct the correct image URL
const getImageUrl = (url: string) => {
    // If it's a full URL (Cloudinary), use it directly
    if (url.startsWith('http')) {
        return url
    }

    // The issue: image paths like /api/posts/uploads/file.jpg need to be adjusted
    // because the static files in FastAPI are mounted at /uploads, not /api/posts/uploads
    if (url.startsWith('/api/posts/uploads/')) {
        // Extract just the filename and use the correct path
        const filename = url.split('/').pop()
        return `${IMAGE_SERVICE_BASE_URL}/uploads/${filename}`
    }

    // For local storage URLs that start with /uploads/
    if (url.startsWith('/uploads/')) {
        // Use direct access to the static files server
        return `${IMAGE_SERVICE_BASE_URL}${url}`
    }

    // Fallback
    return `${IMAGE_SERVICE_BASE_URL}${url}`
}

interface PostCardProps {
    post: Post
}

const PostCard = ({ post }: PostCardProps) => {
    const { data: currentUser } = useCurrentUser()
    const [showComments, setShowComments] = useState(false)
    const [newComment, setNewComment] = useState('')

    // Check friendship status to determine post visibility using our Redux-based hook
    const { isFriend, isLoading: friendshipLoading } = useFriendshipStatus(
        post.user_id
    )

    // Query hooks for post interactions
    const { data: comments } = usePostComments(post.id)
    const likeMutation = useLikePost()
    const unlikeMutation = useUnlikePost()
    const addCommentMutation = useAddComment()

    // Check if this is the current user's post
    const isOwnPost = currentUser?.id === post.user_id

    // Check if post should be visible based on privacy settings
    const isVisible = !post.is_private || isOwnPost || isFriend

    if (friendshipLoading) {
        return (
            <div className="bg-bg-card-light dark:bg-bg-card-dark mb-4 rounded-lg p-4 shadow-md">
                <div className="flex items-center justify-center py-4">
                    <div className="h-6 w-6 animate-pulse rounded-full bg-gray-300"></div>
                    <p className="ml-2 text-gray-500">Loading post...</p>
                </div>
            </div>
        )
    }

    if (!isVisible) {
        return (
            <div className="bg-bg-card-light dark:bg-bg-card-dark mb-4 rounded-lg p-4 shadow-md">
                <div className="flex items-center justify-center py-8">
                    <PrivacyIndicator
                        isPrivate={true}
                        className="mr-2 h-8 w-8"
                    />
                    <p className="text-neutral-medium dark:text-neutral-medium">
                        This is a private post. Only friends can view it.
                    </p>
                </div>
            </div>
        )
    }

    // Handle like/unlike
    const handleLikeToggle = () => {
        if (!currentUser) return

        // In a real app, you would track if the user has already liked the post
        // For simplicity, we're just toggling based on whether the action would succeed
        likeMutation.mutate(post.id)
    }

    // Handle comment submission
    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        addCommentMutation.mutate(
            {
                postId: post.id,
                content: newComment,
            },
            {
                onSuccess: () => {
                    setNewComment('')
                },
            }
        )
    }

    return (
        <div className="bg-bg-card-light dark:bg-bg-card-dark mb-4 rounded-lg p-4 shadow-md">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="bg-neutral-light dark:bg-neutral-dark h-10 w-10 overflow-hidden rounded-full">
                        {/* User avatar placeholder - could be a real image in production */}
                        <div className="text-neutral-dark dark:text-neutral-light flex h-full w-full items-center justify-center">
                            {post.username.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div className="ml-2">
                        <div className="font-medium">{post.username}</div>
                        <div className="text-neutral-medium dark:text-neutral-medium text-xs">
                            {formatDistanceToNow(new Date(post.created_at), {
                                addSuffix: true,
                            })}
                            <span className="ml-2 inline-flex items-center">
                                <PrivacyIndicator
                                    isPrivate={post.is_private}
                                    showTooltip={true}
                                    className="ml-1"
                                />
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Post image */}
            <div className="mb-2 overflow-hidden rounded-lg">
                <img
                    src={getImageUrl(post.image_url)}
                    alt={post.caption || 'Post image'}
                    className="h-64 w-full object-cover"
                />
            </div>

            {/* Caption */}
            {post.caption && (
                <div className="text-neutral-dark dark:text-neutral-light mb-2">
                    {post.caption}
                </div>
            )}

            {/* Actions */}
            <div className="border-border-light dark:border-border-dark mt-2 flex items-center border-t pt-2">
                <button
                    className="text-neutral-medium hover:text-error dark:text-neutral-medium dark:hover:text-error mr-4 flex items-center"
                    onClick={handleLikeToggle}
                >
                    <Heart
                        className={`mr-1 h-5 w-5 ${post.user_has_liked ? 'fill-error text-error' : ''}`}
                    />
                    {post.likes_count}
                </button>
                <button
                    className="text-neutral-medium hover:text-primary dark:text-neutral-medium dark:hover:text-primary-light flex items-center"
                    onClick={() => setShowComments(!showComments)}
                >
                    <MessageCircle className="mr-1 h-5 w-5" />
                    {comments?.length || 0}
                </button>
            </div>

            {/* Comments section */}
            {showComments && (
                <div className="mt-4">
                    <h3 className="mb-2 text-sm font-medium">Comments</h3>

                    <div className="mb-2 max-h-40 overflow-y-auto">
                        {comments && comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.id} className="mb-2 text-sm">
                                    <span className="font-medium">
                                        {comment.username}
                                    </span>
                                    <span className="ml-2">
                                        {comment.content}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-neutral-medium dark:text-neutral-medium text-sm">
                                No comments yet.
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleCommentSubmit} className="mt-2 flex">
                        <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="border-border-light bg-neutral-light focus:border-primary dark:border-border-dark dark:bg-neutral-dark dark:text-neutral-lightest flex-1 rounded-l-lg border p-2 text-sm focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="bg-primary text-neutral-lightest hover:bg-primary-dark disabled:bg-neutral-medium dark:disabled:bg-neutral-dark rounded-r-lg px-4 py-2 disabled:cursor-not-allowed"
                        >
                            Post
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}

export default PostCard
