import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '../../../services/authService'

const Register = () => {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')

    const navigate = useNavigate()
    const registerMutation = useRegister()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')

        // Basic validation
        if (!username || !email || !password) {
            setError('All fields are required')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long')
            return
        }

        // Email validation with regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address')
            return
        }

        try {
            await registerMutation.mutateAsync({
                username,
                email,
                password,
            })

            // Show success message and redirect to login
            navigate('/login', {
                state: {
                    message:
                        'Registration successful! Please sign in with your new account.',
                },
            })
        } catch (err: any) {
            if (err.response?.status === 400 && err.response?.data?.detail) {
                setError(err.response.data.detail)
            } else {
                setError('Registration failed. Please try again.')
                console.error('Registration error:', err)
            }
        }
    }

    return (
        <div className="bg-neutral-light dark:bg-neutral-darkest flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <div className="flex min-h-full w-full flex-col items-center justify-center bg-white px-6 pt-12 dark:bg-black">
                    <a
                        href="#"
                        className="text-primary dark:text-primary-light font-Satisfy text-5xl no-underline"
                    >
                        EverStory
                    </a>
                </div>
                <div className="mt-6 text-center">
                    <h2 className="text-neutral-darkest dark:text-neutral-lightest text-xl">
                        CREATE
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
                                className="text-neutral-darkest ring-border-light placeholder:text-neutral-medium focus:ring-primary dark:text-neutral-lightest dark:ring-border-dark block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 outline-0 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="text-neutral-darkest dark:text-neutral-lightest block text-sm leading-6 font-medium"
                        >
                            Email address
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="text-neutral-darkest ring-border-light placeholder:text-neutral-medium focus:ring-primary dark:text-neutral-lightest dark:ring-border-dark block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 outline-0 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="text-neutral-darkest dark:text-neutral-lightest block text-sm leading-6 font-medium"
                        >
                            Password
                        </label>
                        <div className="mt-2">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="text-neutral-darkest ring-border-light placeholder:text-neutral-medium focus:ring-primary dark:text-neutral-lightest dark:ring-border-dark block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 outline-0 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="text-neutral-darkest dark:text-neutral-lightest block text-sm leading-6 font-medium"
                        >
                            Confirm Password
                        </label>
                        <div className="mt-2">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Confirm your password"
                                className="text-neutral-darkest ring-border-light placeholder:text-neutral-medium focus:ring-primary dark:text-neutral-lightest dark:ring-border-dark block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 outline-0 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={registerMutation.isPending}
                            className="bg-primary text-neutral-lightest hover:bg-primary-dark focus-visible:outline-primary disabled:bg-neutral-medium flex w-full justify-center rounded-md px-3 py-3 text-sm uppercase shadow-sm focus-visible:outline focus-visible:outline-offset-2"
                        >
                            {registerMutation.isPending
                                ? 'Creating account...'
                                : 'Register'}
                        </button>
                    </div>
                </form>

                <p className="text-neutral-medium mt-5 text-center text-sm">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="text-primary hover:text-primary-dark leading-6 font-semibold"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Register
