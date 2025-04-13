import React, { ReactNode, Suspense } from 'react'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

// Loading fallback components
interface LoadingFallbackProps {
    size?: 'sm' | 'md' | 'lg'
    fullHeight?: boolean
}

export const LoadingFallback = ({
    size = 'md',
    fullHeight = false,
}: LoadingFallbackProps) => {
    const sizeClass = {
        sm: 'h-6 w-6',
        md: 'h-10 w-10',
        lg: 'h-16 w-16',
    }[size]

    return (
        <div
            className={`flex items-center justify-center ${fullHeight ? 'h-full min-h-[300px]' : 'py-4'}`}
        >
            <div
                className={`border-primary animate-spin rounded-full border-b-2 ${sizeClass}`}
            />
        </div>
    )
}

// Error fallback component
interface ErrorFallbackProps {
    error: Error
    resetErrorBoundary: () => void
}

export const ErrorFallback = ({
    error,
    resetErrorBoundary,
}: ErrorFallbackProps) => (
    <div className="flex flex-col items-center justify-center p-4">
        <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <p className="font-medium">Something went wrong</p>
            <p className="mt-1 text-sm">{error.message}</p>
            <button
                onClick={resetErrorBoundary}
                className="bg-primary hover:bg-primary-dark focus:ring-primary mt-2 rounded px-3 py-1 font-bold text-white"
            >
                Try again
            </button>
        </div>
    </div>
)

// Types
interface QueryProviderProps {
    children: ReactNode
    loadingFallback?: ReactNode
    errorFallback?: (props: ErrorFallbackProps) => ReactNode
}

/**
 * A component that wraps React Query with ErrorBoundary and Suspense
 * for optimized loading states and error handling.
 */
export const QueryProvider = ({
    children,
    loadingFallback = <LoadingFallback fullHeight />,
    errorFallback = ErrorFallback,
}: QueryProviderProps) => {
    const { reset } = useQueryErrorResetBoundary()

    return (
        <ErrorBoundary onReset={reset} fallbackRender={errorFallback}>
            <Suspense fallback={loadingFallback}>{children}</Suspense>
        </ErrorBoundary>
    )
}
