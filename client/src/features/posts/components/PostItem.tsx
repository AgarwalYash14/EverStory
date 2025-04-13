import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
    Heart,
    MessageCircle,
    Share2,
    Bookmark,
    MoreHorizontal,
    Lock,
    Globe,
} from 'lucide-react'
import {
    Post,
    usePostComments,
    useAddComment,
    useLikePost,
} from '../../../services/postsService'
import { useQueryClient } from '@tanstack/react-query'

interface PostItemProps {
    post: Post
    currentUser: any
    imageBaseUrl: string
}

const PostItem = ({ post, currentUser, imageBaseUrl }: PostItemProps) => {
    const [expanded, setExpanded] = useState(false)
    const [newComment, setNewComment] = useState('')
    const { data: comments } = usePostComments(post.id)
    const likeMutation = useLikePost()
    const addCommentMutation = useAddComment()
    const queryClient = useQueryClient()

    // Get pending states for improved UI feedback
    const pendingLikes =
        (queryClient.getQueryData(['likes', 'pending']) as Record<
            string,
            boolean
        >) || {}
    const pendingComments =
        (queryClient.getQueryData(['comments', 'pending']) as Record<
            string,
            boolean
        >) || {}

    // Check if this post has pending operations
    const isLikePending = pendingLikes[post.id]
    const isCommentPending = pendingComments[post.id]
    const hasNewComment = post.has_new_comment

    const timeAgo = formatDistanceToNow(new Date(post.created_at), {
        addSuffix: true,
    })

    const handleLikePost = () => {
        if (!currentUser) return
        likeMutation.mutate(post.id)
    }

    const handleAddComment = () => {
        if (!newComment.trim()) return

        addCommentMutation.mutate(
            { postId: post.id, content: newComment },
            {
                onSuccess: () => {
                    setNewComment('')
                },
            }
        )
    }

    // Helper function to construct the correct image URL with responsive options
    const getImageUrl = (url: string, size?: string) => {
        // Handle Cloudinary URLs with responsive transformations
        if (url.startsWith('http') && url.includes('cloudinary.com')) {
            // If it's a Cloudinary URL, we can add transformations
            // Format: https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/image.jpg

            // Extract the base parts and create a responsive URL
            const parts = url.split('/upload/')

            if (parts.length === 2) {
                // For smaller screens, serve smaller images
                if (size === 'thumbnail') {
                    // Create a small thumbnail version
                    return `${parts[0]}/upload/w_200,h_200,c_fill/${parts[1]}`
                } else if (size === 'medium') {
                    // Medium size for feed
                    return `${parts[0]}/upload/w_600,c_scale/${parts[1]}`
                } else if (size === 'large') {
                    // Full size with optimization
                    return `${parts[0]}/upload/w_1200,c_limit,q_auto/${parts[1]}`
                }

                // Add progressive loading
                return `${parts[0]}/upload/f_auto,q_auto,fl_progressive/${parts[1]}`
            }

            return url
        }

        // For paths that start with /uploads/ - these are locally stored images
        if (url.startsWith('/uploads/')) {
            // The FastAPI image service is serving static files from /uploads
            // We need to construct the full URL to the API server running on port 8080
            return `http://localhost:8080${url}`
        }

        // For private posts or other URL formats, make sure we have proper access
        // Add authorization token if needed
        if (
            currentUser?.token &&
            (post.is_private || url.includes('/private/'))
        ) {
            const apiBase = imageBaseUrl || 'http://localhost:8080'
            const separator = url.startsWith('/') ? '' : '/'
            return `${apiBase}${separator}${url}?token=${currentUser.token}`
        }

        // Fallback
        return `${imageBaseUrl}${url}`
    }

    return (
        <div className="border-border-light dark:border-border-dark inline-block w-full break-inside-avoid overflow-hidden rounded-4xl border bg-white dark:bg-black">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                    <div className="from-primary to-secondary flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br">
                        <span className="font-bold text-white">
                            {post.username.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="ml-3">
                        <p className="text-neutral-dark text-sm font-medium dark:text-white">
                            {post.username}
                        </p>
                        <p className="text-neutral-medium text-xs">{timeAgo}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {post.is_private ? (
                        <Lock size={20} className="text-neutral-medium" />
                    ) : (
                        <Globe size={20} className="text-neutral-medium" />
                    )}
                    <button className="text-neutral-medium hover:bg-neutral-light hover:text-neutral-dark dark:hover:bg-neutral-dark rounded-full p-2 dark:hover:text-white">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>

            <div className="overflow-hidden">
                {/* Responsive image with art direction using picture element */}
                <picture>
                    {/* Small screens - thumbnail */}
                    <source
                        media="(max-width: 480px)"
                        srcSet={getImageUrl(post.image_url, 'thumbnail')}
                    />
                    {/* Medium screens - regular size */}
                    <source
                        media="(max-width: 1024px)"
                        srcSet={getImageUrl(post.image_url, 'medium')}
                    />
                    {/* Large screens - higher quality */}
                    <source
                        media="(min-width: 1025px)"
                        srcSet={getImageUrl(post.image_url, 'large')}
                    />
                    {/* Fallback image */}
                    <img
                        src={getImageUrl(post.image_url)}
                        alt={post.caption || 'Post image'}
                        className="w-full rounded-3xl object-cover"
                        loading="lazy"
                        sizes="(max-width: 480px) 100vw, (max-width: 1024px) 600px, 1200px"
                        decoding="async"
                    />
                </picture>
            </div>

            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex space-x-4">
                        <button
                            className={`flex items-center gap-1 transition-colors ${
                                post.user_has_liked || isLikePending
                                    ? 'text-red-500 hover:text-red-600'
                                    : 'text-neutral-medium hover:text-primary dark:hover:text-primary-light'
                            } ${isLikePending ? 'animate-pulse' : ''}`}
                            onClick={handleLikePost}
                            disabled={isLikePending}
                            aria-label={
                                post.user_has_liked
                                    ? 'Unlike post'
                                    : 'Like post'
                            }
                        >
                            <Heart
                                size={20}
                                fill={
                                    post.user_has_liked
                                        ? 'currentColor'
                                        : 'none'
                                }
                            />
                            <span
                                className={`text-sm font-medium ${isLikePending ? 'animate-pulse' : ''}`}
                            >
                                {post.likes_count || 0}
                            </span>
                        </button>
                        <button
                            className={`text-neutral-medium hover:text-primary dark:hover:text-primary-light flex items-center gap-1 transition-colors ${
                                hasNewComment
                                    ? 'text-primary animate-pulse'
                                    : ''
                            }`}
                            onClick={() => setExpanded(!expanded)}
                            aria-label="View comments"
                        >
                            <MessageCircle size={20} />
                            <span
                                className={`text-sm font-medium ${hasNewComment ? 'animate-pulse' : ''}`}
                            >
                                {comments?.length || post.comments_count || 0}
                            </span>
                        </button>
                        <button
                            className="text-neutral-medium hover:text-primary dark:hover:text-primary-light transition-colors"
                            aria-label="Share post"
                        >
                            <Share2 size={20} />
                        </button>
                    </div>
                    <button
                        className="text-neutral-medium hover:text-primary dark:hover:text-primary-light transition-colors"
                        aria-label="Save post"
                    >
                        <Bookmark size={20} />
                    </button>
                </div>

                {post.caption && (
                    <p className="text-neutral-dark dark:text-neutral-medium line-clamp-2 pt-4 text-sm text-ellipsis">
                        {post.caption}
                    </p>
                )}

                {/* Comments section */}
                {comments && comments.length > 0 && (
                    <div className="border-border-light dark:border-border-dark mt-3 border-t pt-3">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-neutral-medium hover:text-primary dark:hover:text-primary-light text-xs"
                        >
                            View all {comments.length} comments
                        </button>

                        {expanded && (
                            <div className="mt-2 max-h-40 overflow-y-auto">
                                {comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="mt-2 flex items-start"
                                    >
                                        <div className="bg-neutral-light dark:bg-neutral-dark mr-2 h-6 w-6 flex-shrink-0 overflow-hidden rounded-full">
                                            <div className="flex h-full w-full items-center justify-center text-[10px] font-medium">
                                                {comment.username
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs">
                                                <span className="text-neutral-dark font-medium dark:text-white">
                                                    {comment.username}
                                                </span>
                                                <span
                                                    className={`text-neutral-medium text-ellipsis ${(comment as any).optimistic ? 'opacity-60' : ''}`}
                                                >
                                                    {' '}
                                                    {comment.content}
                                                </span>
                                            </p>
                                            <p className="text-neutral-medium mt-1 text-[10px]">
                                                {formatDistanceToNow(
                                                    new Date(
                                                        comment.created_at
                                                    ),
                                                    {
                                                        addSuffix: true,
                                                    }
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Comment input */}
                        <div className="mt-3 flex items-center">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="text-neutral-dark dark:text-neutral-medium w-full bg-transparent text-xs outline-none"
                                disabled={isCommentPending}
                            />
                            <button
                                onClick={handleAddComment}
                                className={`ml-2 text-xs font-medium ${
                                    isCommentPending
                                        ? 'text-neutral-medium animate-pulse'
                                        : 'text-primary dark:text-primary-light'
                                }`}
                                disabled={
                                    !newComment.trim() || isCommentPending
                                }
                            >
                                {isCommentPending ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PostItem
