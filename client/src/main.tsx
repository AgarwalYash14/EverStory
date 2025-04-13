import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import {
    QueryClient,
    QueryClientProvider,
    QueryCache,
    MutationCache,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { store } from './redux/store'
import App from './App'
import './index.css'

// Create a cache with optimized error handling
const queryCache = new QueryCache({
    onError: (error, query) => {
        // Only log errors that weren't explicitly rejected by the query
        if (query.state.data !== undefined) {
            console.error(`Something went wrong: ${error.message}`)
        }
    },
})

// Add mutation cache with global error handling
const mutationCache = new MutationCache({
    onError: (error) => {
        console.error(`Mutation error: ${error.message}`)
    },
})

// Create an optimized client for React Query
const queryClient = new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: {
        queries: {
            // Set up for Suspense mode
            suspense: true,
            // Other optimizations
            refetchOnWindowFocus: false,
            refetchOnReconnect: 'always',
            staleTime: 1000 * 60 * 5, // 5 minutes
            cacheTime: 1000 * 60 * 30, // 30 minutes
            retry: (failureCount, error) => {
                // Custom retry logic
                if (error instanceof Error && error.message.includes('401')) {
                    // Don't retry auth errors
                    return false
                }
                return failureCount < 2 // retry twice
            },
            retryDelay: (attemptIndex) =>
                Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        },
        mutations: {
            // Reduced retry for mutations
            retry: 1,
            retryDelay: 1000,
        },
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <App />
                </Router>
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </Provider>
    </React.StrictMode>
)
