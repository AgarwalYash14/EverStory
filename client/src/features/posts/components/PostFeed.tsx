import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useInfinitePosts } from '../../../services/postsService'
import { useCurrentUser } from '../../../services/authService'
import { useSocket } from '../../../services/websocketService'
import {
    QueryProvider,
    LoadingFallback,
} from '../../../components/query/QueryProvider'
import PostItem from './PostItem'
import { RootState } from '../../../redux/store'

// For local development, rely on the Vite proxy to handle image requests
const IMAGE_SERVICE_BASE_URL = '' // Empty string since we'll use relative URLs with the proxy

// Declare global type for window object
declare global {
    interface Window {
        setPostFeedSearch?: (query: string) => void
    }
}

// Main content component that will be wrapped with Suspense
const PostContent = ({ searchQuery }: { searchQuery: string }) => {
    const { token } = useSelector((state: RootState) => state.auth)
    const masonryRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadingTriggerRef = useRef<HTMLDivElement>(null)

    const { data: currentUser } = useCurrentUser()

    // Initialize WebSocket connection if token exists
    const { isConnected } = useSocket(token)

    // Fetch posts with React Query's useInfiniteQuery - this will be Suspense-enabled
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
        useInfinitePosts(searchQuery)

    // Force a refetch when component mounts or WebSocket connects/reconnects
    useEffect(() => {
        refetch()
    }, [refetch, isConnected])

    // Set up intersection observer for infinite scrolling
    useEffect(() => {
        // Clean up existing observer
        if (observerRef.current) {
            observerRef.current.disconnect()
        }

        // Create new observer for infinite scrolling
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage()
                }
            },
            { threshold: 0.5 }
        )

        // Observe loading trigger element if it exists
        if (loadingTriggerRef.current) {
            observerRef.current.observe(loadingTriggerRef.current)
        }

        // Cleanup on unmount
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage])

    // Flatten all posts from all pages into a single array
    const posts = data?.pages?.flatMap((page) => page.items || []) || []

    // If no posts found after loading
    if (posts.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center">
                <p className="text-neutral-medium mb-4">
                    {searchQuery
                        ? 'No posts found matching your search'
                        : 'No posts yet'}
                </p>
            </div>
        )
    }

    return (
        <>
            {/* <div className="mb-8 flex space-x-4 overflow-x-auto pb-2">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div
                            className={`h-16 w-16 rounded-full bg-white p-[1px]`}
                        >
                            <div className="h-full w-full rounded-full bg-white p-[2px] dark:bg-black">
                                <div className="bg-neutral-light dark:bg-neutral-dark h-full w-full overflow-hidden rounded-full">
                                    {i === 0 ? (
                                        <div className="from-primary to-secondary flex h-full w-full items-center justify-center bg-gradient-to-br text-lg font-bold text-white">
                                            +
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        <span className="dark:text-primary-light mt-1 text-xs">
                            {i === 0 ? 'Add Story' : `User ${i}`}
                        </span>
                    </div>
                ))}
            </div> */}

            {/* Pinterest-style masonry layout */}
            <div
                ref={masonryRef}
                className="columns-1 gap-4 space-y-6 sm:columns-2 lg:columns-3"
            >
                {posts.map((post) => (
                    <div key={post.id} className="mb-4 break-inside-avoid">
                        <PostItem
                            post={post}
                            currentUser={currentUser}
                            imageBaseUrl={IMAGE_SERVICE_BASE_URL}
                        />
                    </div>
                ))}
            </div>

            {/* Loading indicator at the bottom */}
            <div className="flex justify-center py-4" ref={loadingTriggerRef}>
                {isFetchingNextPage && <LoadingFallback size="sm" />}
            </div>

            {/* WebSocket status indicator (for development) */}
            {import.meta.env.DEV && (
                <div className="bg-opacity-70 fixed bottom-4 left-4 rounded bg-black px-2 py-1 text-xs text-white">
                    WebSocket:{' '}
                    {isConnected ? '✅ Connected' : '❌ Disconnected'}
                </div>
            )}
        </>
    )
}

// Main PostFeed component that handles search and wraps the content in QueryProvider
const PostFeed = () => {
    const [searchQuery, setSearchQuery] = useState('')

    // Debounced search handler
    const debouncedSearch = useCallback((query: string) => {
        setSearchQuery(query)
    }, [])

    // Register global search handler
    useEffect(() => {
        window.setPostFeedSearch = debouncedSearch
        return () => {
            // Cleanup when component unmounts
            window.setPostFeedSearch = undefined
        }
    }, [debouncedSearch])

    return (
        <div className="h-full w-full">
            <QueryProvider
                loadingFallback={
                    <div className="flex h-64 items-center justify-center">
                        <LoadingFallback size="lg" />
                    </div>
                }
            >
                <PostContent searchQuery={searchQuery} />
            </QueryProvider>
        </div>
    )
}

export default PostFeed
