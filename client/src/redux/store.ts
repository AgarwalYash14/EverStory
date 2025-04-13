import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/redux/authSlice';
import postsReducer from '../features/posts/redux/postsSlice';
import friendsReducer from '../features/friends/redux/friendsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        posts: postsReducer,
        friends: friendsReducer,
    },
    // Add middleware here if needed
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;