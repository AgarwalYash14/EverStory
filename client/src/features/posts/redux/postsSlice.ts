import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../redux/store';

// Define types
export interface Post {
    id: string;
    userId: string;
    username: string;
    imageUrl: string;
    caption: string;
    isPrivate: boolean;
    createdAt: string;
    likes: number;
    comments: Comment[];
    userHasLiked?: boolean;
}

interface Comment {
    id: string;
    userId: string;
    username: string;
    content: string;
    createdAt: string;
}

interface PostsState {
    posts: Post[];
    currentPost: Post | null;
    isLoading: boolean;
    hasMore: boolean;
    page: number;
    searchTerm: string;
    error: string | null;
    uploadProgress: number;
    isUploading: boolean;
}

// Initial state
const initialState: PostsState = {
    posts: [],
    currentPost: null,
    isLoading: false,
    hasMore: true,
    page: 1,
    searchTerm: '',
    error: null,
    uploadProgress: 0,
    isUploading: false,
};

// Async thunks for posts
export const fetchPosts = createAsyncThunk(
    'posts/fetchPosts',
    async ({ page, limit = 10, searchTerm = '' }: { page: number; limit?: number; searchTerm?: string }, { rejectWithValue, getState }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) {
                return rejectWithValue('No token found');
            }

            const response = await fetch(
                `http://localhost:8001/api/posts?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                return rejectWithValue(data.message || 'Failed to fetch posts');
            }

            return { posts: data.posts, hasMore: data.hasMore };
        } catch (error) {
            return rejectWithValue('Failed to fetch posts');
        }
    }
);

export const createPost = createAsyncThunk(
    'posts/createPost',
    async (
        { caption, image, isPrivate }: { caption: string; image: File; isPrivate: boolean },
        { rejectWithValue, getState, dispatch }
    ) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) {
                return rejectWithValue('No token found');
            }

            const formData = new FormData();
            formData.append('caption', caption);
            formData.append('image', image);
            formData.append('isPrivate', String(isPrivate));

            const xhr = new XMLHttpRequest();

            // Setup progress tracking
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    dispatch(setUploadProgress(progress));
                }
            });

            const response = await new Promise((resolve, reject) => {
                xhr.open('POST', 'http://localhost:8001/api/posts');
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(xhr.statusText);
                    }
                };

                xhr.onerror = () => reject(xhr.statusText);
                xhr.send(formData);
            });

            return response;
        } catch (error) {
            return rejectWithValue('Failed to create post');
        }
    }
);

export const toggleLike = createAsyncThunk(
    'posts/toggleLike',
    async ({ postId }: { postId: string }, { rejectWithValue, getState }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) {
                return rejectWithValue('No token found');
            }

            const response = await fetch(`http://localhost:8001/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                return rejectWithValue(data.message || 'Failed to toggle like');
            }

            return { postId, liked: data.liked, likesCount: data.likesCount };
        } catch (error) {
            return rejectWithValue('Failed to toggle like');
        }
    }
);

export const addComment = createAsyncThunk(
    'posts/addComment',
    async (
        { postId, content }: { postId: string; content: string },
        { rejectWithValue, getState }
    ) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) {
                return rejectWithValue('No token found');
            }

            const response = await fetch(`http://localhost:8001/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content }),
            });

            const data = await response.json();

            if (!response.ok) {
                return rejectWithValue(data.message || 'Failed to add comment');
            }

            return { postId, comment: data.comment };
        } catch (error) {
            return rejectWithValue('Failed to add comment');
        }
    }
);

// Posts slice
const postsSlice = createSlice({
    name: 'posts',
    initialState,
    reducers: {
        setUploadProgress(state, action: PayloadAction<number>) {
            state.uploadProgress = action.payload;
        },
        setSearchTerm(state, action: PayloadAction<string>) {
            state.searchTerm = action.payload;
            state.page = 1;
            state.posts = [];
            state.hasMore = true;
        },
        resetPosts(state) {
            state.posts = [];
            state.page = 1;
            state.hasMore = true;
        },
        clearPostsError(state) {
            state.error = null;
        },
        setCurrentPost(state, action: PayloadAction<Post>) {
            state.currentPost = action.payload;
        },
        setPostComments(state, action: PayloadAction<{ postId: string, comments: Comment[] }>) {
            const { postId, comments } = action.payload;
            // Update comments for the current post if it's loaded
            if (state.currentPost && state.currentPost.id === postId) {
                state.currentPost.comments = comments;
            }
            // Also update in the post list if it exists there
            const post = state.posts.find(p => p.id === postId);
            if (post) {
                post.comments = comments;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch posts cases
            .addCase(fetchPosts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchPosts.fulfilled, (state, action: PayloadAction<{ posts: Post[]; hasMore: boolean }>) => {
                state.isLoading = false;
                state.posts = [...state.posts, ...action.payload.posts];
                state.hasMore = action.payload.hasMore;
                state.page += 1;
            })
            .addCase(fetchPosts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Create post cases
            .addCase(createPost.pending, (state) => {
                state.isUploading = true;
                state.error = null;
            })
            .addCase(createPost.fulfilled, (state, action: PayloadAction<{ post: Post }>) => {
                state.isUploading = false;
                state.uploadProgress = 0;
                state.posts = [action.payload.post, ...state.posts];
            })
            .addCase(createPost.rejected, (state, action) => {
                state.isUploading = false;
                state.uploadProgress = 0;
                state.error = action.payload as string;
            })

            // Toggle like cases
            .addCase(toggleLike.fulfilled, (state, action: PayloadAction<{ postId: string; liked: boolean; likesCount: number }>) => {
                const { postId, liked, likesCount } = action.payload;
                const post = state.posts.find(p => p.id === postId);
                if (post) {
                    post.userHasLiked = liked;
                    post.likes = likesCount;
                }
            })

            // Add comment cases
            .addCase(addComment.fulfilled, (state, action: PayloadAction<{ postId: string; comment: Comment }>) => {
                const { postId, comment } = action.payload;
                const post = state.posts.find(p => p.id === postId);
                if (post) {
                    post.comments = [...post.comments, comment];
                }
            });
    },
});

export const { setUploadProgress, setSearchTerm, resetPosts, clearPostsError, setCurrentPost, setPostComments } = postsSlice.actions;

export default postsSlice.reducer;