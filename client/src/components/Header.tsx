import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Menu,
    Bell,
    Plus,
    LogOut,
    User,
    Settings,
    Menu as MenuIcon,
} from 'lucide-react'
import { useCurrentUser, useLogout } from '../services/authService'
import ThemeToggle from './ThemeToggle'
import FriendRequestIndicator from '../features/friends/components/FriendRequestIndicator'

interface HeaderProps {
    onMenuClick: () => void
}

const Header = ({ onMenuClick }: HeaderProps) => {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const { data: user } = useCurrentUser()
    const logout = useLogout()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout.mutateAsync()
        navigate('/login')
    }

    return (
        <header className="border-border-light dark:border-border-dark dark:bg-bg-dark border-b shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
                {/* Left side - Mobile menu button and logo */}
                <div className="flex items-center">
                    <button
                        onClick={onMenuClick}
                        className="text-neutral-medium hover:bg-neutral-light hover:text-neutral-dark dark:text-neutral-medium dark:hover:bg-neutral-dark dark:hover:text-neutral-light mr-2 rounded-md p-2 md:hidden"
                    >
                        <MenuIcon className="h-6 w-6" />
                    </button>

                    <Link to="/" className="flex items-center">
                        <span className="text-primary dark:text-primary-light font-Satisfy text-xl">
                            EverStory
                        </span>
                    </Link>
                </div>

                {/* Right side - Actions and user menu */}
                <div className="flex items-center space-x-4">
                    {/* Create new post button */}
                    <Link
                        to="/posts/new"
                        className="bg-primary text-neutral-lightest hover:bg-primary-dark hidden items-center rounded-full p-1.5 px-3 text-sm sm:flex"
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        <span>Post</span>
                    </Link>

                    {/* Simplified create button for mobile */}
                    <Link
                        to="/posts/new"
                        className="bg-primary text-neutral-lightest hover:bg-primary-dark rounded-full p-2 sm:hidden"
                    >
                        <Plus className="h-5 w-5" />
                    </Link>

                    {/* Friend Request Indicator */}
                    <FriendRequestIndicator />

                    {/* Theme toggle */}
                    <ThemeToggle />

                    {/* User dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="text-neutral-dark hover:text-neutral-darkest dark:text-neutral-light dark:hover:text-neutral-lightest flex items-center focus:outline-none"
                        >
                            <div className="bg-neutral-light dark:bg-neutral-dark flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
                                {user?.profile_image ? (
                                    <img
                                        src={user.profile_image}
                                        alt={user.username}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-neutral-dark dark:text-neutral-light font-bold">
                                        {user?.username
                                            ?.charAt(0)
                                            .toUpperCase() || 'U'}
                                    </span>
                                )}
                            </div>
                        </button>

                        {/* Dropdown menu */}
                        {dropdownOpen && (
                            <div
                                className="ring-opacity-5 bg-bg-light dark:bg-bg-dark absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md py-1 shadow-lg ring-1 ring-black focus:outline-none"
                                onBlur={() => setDropdownOpen(false)}
                            >
                                <div className="border-border-light dark:border-border-dark border-b px-4 py-2">
                                    <p className="text-neutral-darkest dark:text-neutral-lightest text-sm font-medium">
                                        {user?.username}
                                    </p>
                                    <p className="text-neutral-medium dark:text-neutral-medium text-xs">
                                        {user?.email}
                                    </p>
                                </div>

                                <Link
                                    to="/profile"
                                    className="text-neutral-dark hover:bg-neutral-light dark:text-neutral-light dark:hover:bg-neutral-dark flex items-center px-4 py-2 text-sm"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </Link>

                                <Link
                                    to="/friends"
                                    className="text-neutral-dark hover:bg-neutral-light dark:text-neutral-light dark:hover:bg-neutral-dark flex items-center px-4 py-2 text-sm"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    Friends
                                </Link>

                                <Link
                                    to="/settings"
                                    className="text-neutral-dark hover:bg-neutral-light dark:text-neutral-light dark:hover:bg-neutral-dark flex items-center px-4 py-2 text-sm"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>

                                <button
                                    onClick={() => {
                                        setDropdownOpen(false)
                                        handleLogout()
                                    }}
                                    className="text-neutral-dark hover:bg-neutral-light dark:text-neutral-light dark:hover:bg-neutral-dark flex w-full items-center px-4 py-2 text-sm"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
