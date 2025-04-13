import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLogin } from '../../../services/authService'

const Login = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const navigate = useNavigate()
    const location = useLocation()
    const loginMutation = useLogin()

    // Get the redirect path from location state or default to home
    const from = (location.state as any)?.from?.pathname || '/'

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')

        if (!username || !password) {
            setError('Username and password are required')
            return
        }

        try {
            await loginMutation.mutateAsync({ username, password })

            // Navigate to the page the user was trying to access, or home
            navigate(from, { replace: true })
        } catch (err: any) {
            console.error('Login error:', err)

            // Handle different error formats
            let errorMessage = 'Login failed. Please check your credentials.'

            if (err.response?.data) {
                const responseData = err.response.data

                // Handle validation errors (422 responses)
                if (responseData.detail && Array.isArray(responseData.detail)) {
                    // For Pydantic validation errors
                    errorMessage = responseData.detail
                        .map((error: any) => error.msg || JSON.stringify(error))
                        .join(', ')
                } else if (typeof responseData.detail === 'object') {
                    // For object-type errors
                    errorMessage = JSON.stringify(responseData.detail)
                } else if (responseData.detail) {
                    // For simple string messages
                    errorMessage = responseData.detail
                } else if (typeof responseData === 'string') {
                    // For plain string responses
                    errorMessage = responseData
                }
            }

            setError(errorMessage)
        }
    }

    return (
        <div className="bg-neutral-light dark:bg-neutral-darkest flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <div className="flex min-h-full w-full flex-col items-center justify-center px-6 pb-12 dark:bg-black">
                    <a
                        href="#"
                        className="text-primary dark:text-primary-light font-Satisfy text-5xl no-underline"
                    >
                        EverStory
                    </a>
                </div>
                <div className="mt-6 text-center">
                    <h2 className="text-neutral-darkest dark:text-neutral-lightest text-xl">
                        LOGIN
                    </h2>
                    <h2 className="text-neutral-darkest dark:text-neutral-lightest text-2xl">
                        YOUR ACCOUNT
                    </h2>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
                {error && (
                    <div className="border-error bg-error/10 text-error mb-4 rounded border px-4 py-3">
                        <p>{error}</p>
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label
                            htmlFor="username"
                            className="text-neutral-darkest dark:text-neutral-lightest block text-sm leading-6 font-medium"
                        >
                            Username
                        </label>
                        <div className="mt-2">
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                className="text-neutral-darkest ring-border-light placeholder:text-neutral-medium focus:ring-primary dark:text-neutral-lightest dark:ring-border-dark block w-full rounded-md border-0 px-3 py-1.5 ring-1 outline-0 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="password"
                                className="text-neutral-darkest dark:text-neutral-lightest block text-sm leading-6 font-medium"
                            >
                                Password
                            </label>
                        </div>
                        <div className="mt-2">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="text-neutral-darkest ring-border-light placeholder:text-neutral-medium focus:ring-primary dark:text-neutral-lightest dark:ring-border-dark block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 outline-0 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="bg-primary text-neutral-lightest hover:bg-primary-dark focus-visible:outline-primary disabled:bg-neutral-medium flex w-full justify-center rounded-md px-3 py-3 text-sm uppercase shadow-sm focus-visible:outline focus-visible:outline-offset-2"
                        >
                            {loginMutation.isPending
                                ? 'Signing in...'
                                : 'Sign in'}
                        </button>
                    </div>
                </form>

                <p className="text-neutral-medium mt-5 text-center text-sm">
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="text-primary hover:text-primary-dark leading-6 font-semibold"
                    >
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login
