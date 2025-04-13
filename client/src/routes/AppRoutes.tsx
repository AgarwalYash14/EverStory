import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import ProtectedRoute from './ProtectedRoute'
import Login from '../features/auth/components/Login'
import Register from '../features/auth/components/Register'
import PostFeed from '../features/posts/components/PostFeed'
import CreatePost from '../features/posts/components/CreatePost'
import FriendsIndex from '../features/friends/components/FriendsIndex'
import FriendsList from '../features/friends/components/FriendsList'
import FriendRequests from '../features/friends/components/FriendRequests'
import UserProfile from '../features/profile/components/UserProfile'

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public routes - accessible without authentication */}
            <Route element={<ProtectedRoute requireAuth={false} />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute requireAuth={true} />}>
                <Route element={<Layout />}>
                    {/* Main feed */}
                    <Route path="/" element={<PostFeed />} />

                    {/* Post management */}
                    <Route path="/posts/new" element={<CreatePost />} />

                    {/* Friend management */}
                    <Route path="/friends" element={<FriendsIndex />} />
                    <Route path="/friends/list" element={<FriendsList />} />
                    <Route
                        path="/friends/requests"
                        element={<FriendRequests />}
                    />

                    {/* User profiles */}
                    <Route path="/profile/:userId" element={<UserProfile />} />
                    <Route path="/profile" element={<UserProfile />} />

                    {/* Fallback for any other protected routes */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Route>

            {/* Global fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}

export default AppRoutes
