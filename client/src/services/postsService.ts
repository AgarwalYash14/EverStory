import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { postsApi, fetchData, postData, deleteData, putData, postFormData } from './api';
import {
    setUploadProgress,
    createPost as createPostAction,
    toggleLike as toggleLikeAction,
    addComment as addCommentAction,
    fetchPosts as fetchPostsAction
} from '../features/posts/redux/postsSlice';
import { RootState, AppDispatch } from '../redux/store';
import { queryInvalidator } from './queryInvalidator';

// Types
export interface Post {
    id: number;
    user_id: number;
    username: string;
    image_url: string;
    caption?: string;
    likes_count: number;
    comments_count?: number;
    is_private: boolean;
    created_at: string;
    updated_at?: string;
    user_has_liked?: boolean;
    visible_to_current_user?: boolean;
}

export interface Comment {
    id: number;
    post_id: number;
    user_id: number;
    username: string;
    content: string;
    created_at: string;
}

export interface PostsResponse {
    items: Post[];
    total: number;
    page: number;
    size: number;
    pages: number;
    posts?: Post[];
    hasMore?: boolean;
}

export interface CreatePostData {
    caption?: string;
    is_private: boolean;
    image: File;
}

export interface UpdatePostData {
    caption?: string;
    is_private?: boolean;
}

// Get posts with infinite scrolling and optimized fetching
export const useInfinitePosts = (searchQuery?: string) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    return useInfiniteQuery({
        queryKey: ['posts', 'feed', { search: searchQuery, userId: user?.id }],
        queryFn: async ({ pageParam = 1 }) => {
            const currentPage = pageParam as number;
            const params = new URLSearchParams({
                page: currentPage.toString(),
                size: '10',
            });

            if (searchQuery) {
                params.append('search', searchQuery);
            }

            // Also dispatch to Redux for state tracking
            dispatch(fetchPostsAction({
                page: currentPage,
                limit: 10,
                searchTerm: searchQuery || ''
            }));

            const response = await fetchData<PostsResponse>(
                postsApi,
                `?${params.toString()}`
            );

            // Filter posts based on privacy settings
            const filteredPosts = response?.items?.filter((post: Post) => {
                if (!user) return !post.is_private;
                if (post.user_id === parseInt(user.id as string, 10)) return true;
                if (!post.is_private) return true;
                return post.visible_to_current_user === true;
            }) || [];

            // Format response for consistency
            if (response.posts) {
                return {
                    items: filteredPosts,
                    total: filteredPosts.length * (currentPage + (response.hasMore ? 1 : 0)),
                    page: currentPage,
                    size: 10,
                    pages: response.hasMore ? currentPage + 1 : currentPage
                };
            }

            return {
                ...response,
                items: filteredPosts
            };
        },
        getNextPageParam: (lastPage: PostsResponse) => {
            if (lastPage.page < lastPage.pages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        staleTime: 1000 * 60, // 1 minute
    });
};

// Get single post by ID with optimized caching
export const usePost = (postId: number) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();

    return useQuery({
        queryKey: ['posts', postId, { userId: user?.id }],
        queryFn: async () => {
            const post = await fetchData<Post>(postsApi, `/${postId}`);

            // Keep Redux in sync with React Query
            dispatch({ type: 'posts/setCurrentPost', payload: post });

            // Handle privacy checks
            if (post.is_private) {
                if (!user) {
                    throw new Error("You don't have permission to view this post");
                }
                if (post.user_id === parseInt(user.id as string, 10)) {
                    return post;
                }
                if (!post.visible_to_current_user) {
                    throw new Error("You don't have permission to view this post");
                }
            }

            return post;
        },
        enabled: !!postId,
    });
};

// Create a post with optimistic updates
export const useCreatePost = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();

    return useMutation({
        mutationFn: async (postData: CreatePostData) => {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('image', postData.image);

            if (postData.caption) {
                formData.append('caption', postData.caption);
            }

            formData.append('is_private', String(postData.is_private));

            try {
                const response = await postsApi.post('/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent: ProgressEvent) => {
                        const total = progressEvent.total || 0;
                        if (total > 0) {
                            const progress = Math.round((progressEvent.loaded * 100) / total);
                            dispatch(setUploadProgress(progress));
                        }
                    },
                    withCredentials: true
                });

                return response.data;
            } catch (error) {
                console.error('Error during post creation:', error);
                throw error;
            }
        },
        onSuccess: (newPost) => {
            // Use our centralized invalidation strategy
            queryInvalidator.invalidatePosts();

            // Dispatch to Redux
            dispatch(createPostAction({
                caption: newPost.caption || '',
                image: new File([], ''), // Placeholder
                isPrivate: newPost.is_private
            }));
        },
        onError: (error) => {
            console.error('Error in createPost mutation:', error);
        }
    });
};

// Update a post with optimized cache handling
export const useUpdatePost = (postId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdatePostData) =>
            putData<Post, UpdatePostData>(postsApi, `/${postId}`, data),
        onSuccess: (updatedPost) => {
            // Update specific post in cache
            queryClient.setQueryData(['posts', postId], updatedPost);

            // Smart invalidation using our service
            queryInvalidator.invalidatePosts(postId);
        },
    });
};

// Delete a post with cache cleanup
export const useDeletePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: number) => deleteData<void>(postsApi, `/${postId}`),
        onSuccess: (_, postId) => {
            // Remove from cache immediately
            queryClient.removeQueries({ queryKey: ['posts', postId] });

            // Update post feed with smart invalidation
            queryClient.invalidateQueries({
                queryKey: ['posts', 'feed'],
                exact: false,
                refetchType: 'active'
            });
        },
    });
};

// Like a post with optimistic update
export const useLikePost = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    return useMutation({
        mutationFn: (postId: number) =>
            postData<void, null>(postsApi, `/${postId}/like`, null),
        onMutate: async (postId) => {
            // Cancel outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: ['posts', postId] });
            await queryClient.cancelQueries({ queryKey: ['posts', 'feed'] });

            // Apply optimistic update
            if (user) {
                queryInvalidator.optimisticLikeUpdate(postId, true, user.id);
            }

            // Dispatch to Redux
            dispatch(toggleLikeAction({ postId: postId.toString() }));

            return { previousPostIds: [postId] };
        },
        onError: (err, postId, context) => {
            // Revert optimistic update on error
            if (user && context?.previousPostIds) {
                context.previousPostIds.forEach(id => {
                    queryInvalidator.optimisticLikeUpdate(id, false, user.id);
                });
            }
        },
        onSettled: (_, error, postId) => {
            // Ensure data consistency regardless of mutation outcome
            if (error) {
                queryInvalidator.invalidatePosts(postId);
            }
        },
    });
};

// Unlike a post with optimistic update
export const useUnlikePost = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    return useMutation({
        mutationFn: (postId: number) => deleteData<void>(postsApi, `/${postId}/like`),
        onMutate: async (postId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['posts', postId] });
            await queryClient.cancelQueries({ queryKey: ['posts', 'feed'] });

            // Apply optimistic update
            if (user) {
                queryInvalidator.optimisticLikeUpdate(postId, false, user.id);
            }

            // Dispatch to Redux
            dispatch(toggleLikeAction({ postId: postId.toString() }));

            return { previousPostIds: [postId] };
        },
        onError: (err, postId, context) => {
            // Revert optimistic update on error
            if (user && context?.previousPostIds) {
                context.previousPostIds.forEach(id => {
                    queryInvalidator.optimisticLikeUpdate(id, true, user.id);
                });
            }
        },
        onSettled: (_, error, postId) => {
            if (error) {
                queryInvalidator.invalidatePosts(postId);
            }
        },
    });
};

// Get post comments with optimized fetching
export const usePostComments = (postId: number) => {
    const dispatch = useDispatch<AppDispatch>();

    return useQuery({
        queryKey: ['posts', postId, 'comments'],
        queryFn: async () => {
            const comments = await fetchData<Comment[]>(postsApi, `/${postId}/comments`);

            // Sync with Redux store
            if (comments) {
                dispatch({
                    type: 'posts/setPostComments',
                    payload: { postId: postId.toString(), comments }
                });
            }

            return comments;
        },
        enabled: !!postId,
        staleTime: 1000 * 30, // 30 seconds
    });
};

// Add a comment with optimistic update
export const useAddComment = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    return useMutation({
        mutationFn: ({ postId, content }: { postId: number; content: string }) =>
            postData<Comment, { content: string }>(
                postsApi,
                `/${postId}/comments`,
                { content }
            ),
        onMutate: async ({ postId, content }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: ['posts', postId, 'comments']
            });

            // Create optimistic comment
            if (user) {
                const optimisticComment = {
                    id: Date.now(), // Temporary ID
                    post_id: postId,
                    user_id: parseInt(user.id as string),
                    username: user.username,
                    content,
                    created_at: new Date().toISOString(),
                    // Add temporary flag for UI treatment
                    optimistic: true
                };

                // Apply optimistic update
                queryInvalidator.optimisticCommentUpdate(postId, optimisticComment);

                return { optimisticComment };
            }
            return {};
        },
        onSuccess: (newComment, { postId }) => {
            // Update comments in cache
            queryClient.setQueryData<Comment[]>(
                ['posts', postId, 'comments'],
                (oldData = []) => {
                    // Remove any optimistic version and add the real comment
                    const filteredData = oldData.filter(comment =>
                        !(comment as any).optimistic
                    );
                    return [...filteredData, newComment];
                }
            );

            // Dispatch to Redux
            dispatch(addCommentAction({
                postId: postId.toString(),
                content: newComment.content
            }));
        },
        onError: (err, { postId }, context) => {
            // Revert optimistic update on error
            if (context?.optimisticComment) {
                queryClient.setQueryData<Comment[]>(
                    ['posts', postId, 'comments'],
                    (oldData = []) => {
                        return oldData.filter(
                            comment => comment.id !== (context.optimisticComment as any).id
                        );
                    }
                );
            }
        },
        onSettled: (_, error, { postId }) => {
            // Ensure data consistency regardless of mutation outcome
            if (error) {
                queryClient.invalidateQueries({
                    queryKey: ['posts', postId, 'comments']
                });
                queryClient.invalidateQueries({
                    queryKey: ['posts', postId]
                });
            }
        },
    });
};

/**
 * Service for optimizing images before posting
 */
export const useOptimizeImage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('image', file);

            return postFormData<any>(postsApi, '/optimize-image', formData);
        },
    });
};