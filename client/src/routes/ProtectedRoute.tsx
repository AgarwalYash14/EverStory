import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'

type ProtectedRouteProps = {
    requireAuth?: boolean
    redirectTo?: string
}

/**
 * A route wrapper that checks for authentication status
 * If requireAuth is true, it will redirect unauthenticated users to redirectTo path
 * If requireAuth is false, it will redirect authenticated users to redirectTo path
 */
const ProtectedRoute = ({
    requireAuth = true,
    redirectTo = requireAuth ? '/login' : '/',
}: ProtectedRouteProps) => {
    const location = useLocation()
    const { isAuthenticated } = useSelector((state: RootState) => state.auth)

    // If requireAuth is true and user is not authenticated, redirect to login
    if (requireAuth && !isAuthenticated) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />
    }

    // If requireAuth is false and user is authenticated, redirect to home
    if (!requireAuth && isAuthenticated) {
        return <Navigate to={redirectTo} replace />
    }

    // Otherwise, render the protected component
    return <Outlet />
}

export default ProtectedRoute
