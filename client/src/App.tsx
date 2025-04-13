import './App.css'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import AppRoutes from './routes/AppRoutes'
import { AppDispatch, RootState } from './redux/store'
import { authApi } from './services/api'
import { login } from './features/auth/redux/authSlice'
import { initializeSocket, closeSocket } from './services/websocketService'
import { queryInvalidator } from './services/queryInvalidator'

function App() {
    const dispatch = useDispatch<AppDispatch>()
    const { user, token, isAuthenticated } = useSelector(
        (state: RootState) => state.auth
    )
    const queryClient = useQueryClient()

    // Initialize Query Invalidator with query client
    useEffect(() => {
        queryInvalidator.initialize(queryClient)
    }, [queryClient])

    // Initialize authentication check
    useEffect(() => {
        // Check if user is authenticated by making a request using the cookie
        const checkAuth = async () => {
            try {
                // Fix: Remove the duplicated '/auth' prefix since it's already in the base URL
                const response = await authApi.get('/user')
                if (response.status === 200) {
                    // If request succeeds, user is authenticated
                    dispatch(login({ user: response.data }))
                }
            } catch (error) {
                // If request fails, user is not authenticated (no valid cookie)
                console.log('Not authenticated')
            }
        }

        checkAuth()
    }, [dispatch])

    // Handle WebSocket connection based on auth state
    useEffect(() => {
        if (token && isAuthenticated) {
            // Initialize WebSocket connection when user authenticates
            initializeSocket(token)
        } else {
            // Close WebSocket connection when user logs out
            closeSocket()
        }

        // Clean up WebSocket connection when component unmounts
        return () => {
            closeSocket()
        }
    }, [token, isAuthenticated])

    return (
        <div className="App">
            <AppRoutes />
        </div>
    )
}

export default App
