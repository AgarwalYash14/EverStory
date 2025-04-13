import { QueryClient } from '@tanstack/react-query';

/**
 * Service for centralized query invalidation strategies to optimize 
 * when and how to refresh data across components.
 */
class QueryInvalidator {
    private static instance: QueryInvalidator;
    private queryClient: QueryClient | null = null;

    private constructor() { }

    static getInstance(): QueryInvalidator {
        if (!QueryInvalidator.instance) {
            QueryInvalidator.instance = new QueryInvalidator();
        }
        return QueryInvalidator.instance;
    }

    /**
     * Initialize the invalidator with a QueryClient instance
     */
    initialize(queryClient: QueryClient) {
        this.queryClient = queryClient;
        return this;
    }

    /**
     * Invalidate all auth-related queries
     */
    invalidateAuth() {
        if (!this.queryClient) return;
        this.queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        this.queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }

    /**
     * Invalidate all posts with precise filtering
     * @param postId Optional specific post to invalidate
     */
    invalidatePosts(postId?: string | number) {
        if (!this.queryClient) return;

        if (postId) {
            // Invalidate a specific post and its comments
            this.queryClient.invalidateQueries({
                queryKey: ['posts', postId],
                refetchType: 'active', // Only refetch if being viewed
            });
            this.queryClient.invalidateQueries({
                queryKey: ['posts', postId, 'comments'],
                refetchType: 'active',
            });
        } else {
            // Invalidate the post feed with smart refetching
            this.queryClient.invalidateQueries({
                queryKey: ['posts', 'feed'],
                refetchType: 'all', // Always refetch feed data
            });
        }

        // Tag-based invalidation for post lists
        this.queryClient.invalidateQueries({
            predicate: (query) =>
                query.queryKey[0] === 'posts' &&
                query.queryKey.length > 1,
        });
    }

    /**
     * Invalidate friendship-related queries
     * @param userId Optional specific user relationship to invalidate
     */
    invalidateFriendships(userId?: string | number) {
        if (!this.queryClient) return;

        if (userId) {
            // Invalidate specific friendship status
            this.queryClient.invalidateQueries({
                queryKey: ['friendships', 'status', userId],
            });
        } else {
            // Invalidate all friendship data
            this.queryClient.invalidateQueries({
                queryKey: ['friendships'],
            });
            this.queryClient.invalidateQueries({
                queryKey: ['friendRequests'],
            });
        }
    }

    /**
     * Optimistically update a post's like status
     */
    optimisticLikeUpdate(postId: string | number, liked: boolean, currentUserId: string | number) {
        if (!this.queryClient) return;

        // Update the specific post
        this.queryClient.setQueryData(['posts', postId], (oldData: any) => {
            if (!oldData) return oldData;

            return {
                ...oldData,
                likes_count: liked
                    ? oldData.likes_count + 1
                    : Math.max(0, oldData.likes_count - 1),
                user_has_liked: liked
            };
        });

        // Update the post in the feed with improved handling for different page structures
        this.queryClient.setQueriesData(
            { queryKey: ['posts', 'feed'] },
            (oldData: any) => {
                if (!oldData?.pages?.length) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        items: page.items?.map((post: any) =>
                            post.id === postId
                                ? {
                                    ...post,
                                    likes_count: liked
                                        ? post.likes_count + 1
                                        : Math.max(0, post.likes_count - 1),
                                    user_has_liked: liked
                                }
                                : post
                        )
                    }))
                };
            }
        );

        // Add loading spinner indication for improved UX
        const likeInProgress = { [postId]: true };
        this.queryClient.setQueryData(['likes', 'pending'], likeInProgress);

        // Clear loading state after a short delay to simulate completion
        setTimeout(() => {
            this.queryClient.setQueryData(['likes', 'pending'], {});
        }, 500);
    }

    /**
     * Optimistically update a post with a new comment
     */
    optimisticCommentUpdate(postId: string | number, comment: any) {
        if (!this.queryClient) return;

        // Update comment list with the optimistic comment
        this.queryClient.setQueryData(['posts', postId, 'comments'], (oldData: any[] = []) => {
            return [...oldData, comment];
        });

        // Update comment count in post data
        this.queryClient.setQueryData(['posts', postId], (oldData: any) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                comments_count: (oldData.comments_count || 0) + 1
            };
        });

        // Update the post in the feed to show updated comment count
        this.queryClient.setQueriesData(
            { queryKey: ['posts', 'feed'] },
            (oldData: any) => {
                if (!oldData?.pages?.length) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        items: page.items?.map((post: any) =>
                            post.id === postId
                                ? {
                                    ...post,
                                    comments_count: (post.comments_count || 0) + 1,
                                    // Add a temporary indicator that there's a new comment
                                    has_new_comment: true
                                }
                                : post
                        )
                    }))
                };
            }
        );

        // Add indication for comment in progress
        const commentInProgress = { [postId]: true };
        this.queryClient.setQueryData(['comments', 'pending'], commentInProgress);

        // Clear loading state after a short delay to simulate completion
        setTimeout(() => {
            this.queryClient.setQueryData(['comments', 'pending'], {});
            // Clear the new comment indicator after 2 seconds
            setTimeout(() => {
                this.queryClient.setQueriesData(
                    { queryKey: ['posts', 'feed'] },
                    (oldData: any) => {
                        if (!oldData?.pages?.length) return oldData;

                        return {
                            ...oldData,
                            pages: oldData.pages.map((page: any) => ({
                                ...page,
                                items: page.items?.map((post: any) =>
                                    post.id === postId
                                        ? { ...post, has_new_comment: false }
                                        : post
                                )
                            }))
                        };
                    }
                );
            }, 2000);
        }, 500);
    }

    /**
     * Global invalidation strategy for when user data changes
     * Used after profile updates, settings changes, etc.
     */
    invalidateUserData() {
        if (!this.queryClient) return;
        this.invalidateAuth();

        // Selective refetching so we don't overwhelm the API
        setTimeout(() => {
            this.queryClient?.invalidateQueries({
                queryKey: ['posts', 'feed'],
                refetchType: 'all'
            });
        }, 300);

        setTimeout(() => {
            this.queryClient?.invalidateQueries({
                queryKey: ['friendships'],
                refetchType: 'inactive'
            });
        }, 600);
    }
}

export const queryInvalidator = QueryInvalidator.getInstance();
export default queryInvalidator;