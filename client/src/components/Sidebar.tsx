import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    Home,
    Users,
    X,
    Plus,
    User,
    Settings,
    LogOut,
    Search,
    FileText,
} from 'lucide-react'
import { debounce } from 'lodash'
import {
    useCurrentUser,
    useLogout,
    useSearchUsers,
} from '../services/authService'
// import { usePendingFriendRequests } from '../services/friendsService'
import ThemeToggle from './ThemeToggle'

interface SidebarProps {
    open: boolean
    setOpen: (open: boolean) => void
    onSearch?: (query: string) => void
}

const Sidebar = ({ open, setOpen, onSearch }: SidebarProps) => {
    // Visual state for instant feedback
    const [inputValue, setInputValue] = useState('')
    const [postInputValue, setPostInputValue] = useState('')

    // Actual search state that triggers API calls (delayed)
    const [searchQuery, setSearchQuery] = useState('')
    const [postSearchQuery, setPostSearchQuery] = useState('')
    const [showResults, setShowResults] = useState(false)
    const [isSearching, setIsSearching] = useState(false)

    const searchInputRef = useRef<HTMLInputElement>(null)
    const searchResultsRef = useRef<HTMLDivElement>(null)

    const { data: user } = useCurrentUser()
    // const { data: pendingRequests } = usePendingFriendRequests()
    const location = useLocation()
    const navigate = useNavigate()
    const logout = useLogout()

    // Debounced search function for users - more delay for API calls
    const debouncedSearch = useCallback(
        debounce((query: string) => {
            setIsSearching(true)
            setSearchQuery(query)
            if (query.trim().length >= 2) {
                setShowResults(true)
            } else {
                setShowResults(false)
            }
            // Add slight delay before removing searching state
            setTimeout(() => setIsSearching(false), 300)
        }, 600),
        []
    )

    // Debounced search function for posts
    const debouncedPostSearch = useCallback(
        debounce((query: string) => {
            setPostSearchQuery(query)
            // Use the window global to communicate with PostFeed
            if (typeof window.setPostFeedSearch === 'function') {
                window.setPostFeedSearch(query)
            }
        }, 600),
        []
    )

    // Use the user search query
    const { data: searchResults, isLoading } = useSearchUsers(searchQuery)

    const handleLogout = async () => {
        await logout.mutateAsync()
        navigate('/login')
    }

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchResultsRef.current &&
                !searchResultsRef.current.contains(event.target as Node) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node)
            ) {
                setShowResults(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Count of pending friend requests
    // const pendingCount = pendingRequests?.length || 0

    const navigation = [
        { name: 'Feed', href: '/', icon: Home },
        // { name: 'Friends', href: '/friends', icon: Users, count: pendingCount },
        { name: 'Create Post', href: '/posts/new', icon: Plus },
        // { name: 'Profile', href: '/profile', icon: User },
        // { name: 'Settings', href: '/settings', icon: Settings },
    ]

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value
        setInputValue(newQuery)
        debouncedSearch(newQuery)
    }

    const handlePostSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value
        setPostInputValue(newQuery)
        debouncedPostSearch(newQuery)
    }

    // Handle click on a search result - navigate to profile
    const handleUserClick = (userId: number) => {
        setShowResults(false)
        setInputValue('')
        setSearchQuery('')
        navigate(`/profile/${userId}`)
    }

    // Determine if we're on the feed page where post search is relevant
    const isOnFeedPage = location.pathname === '/'

    return (
        <>
            {/* Backdrop for mobile */}
            {open && (
                <div
                    className="bg-neutral-darkest bg-opacity-50 fixed inset-0 z-20 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`bg-bg-light dark:bg-bg-dark max-h-screen md:relative md:z-auto ${
                    open
                        ? 'fixed inset-y-0 left-0 z-30 translate-x-0 transform transition-transform duration-300 ease-in-out'
                        : 'fixed inset-y-0 left-0 z-30 -translate-x-full transform transition-transform duration-300 ease-in-out md:translate-x-0'
                }`}
            >
                <div className="border-border-light dark:border-border-dark flex h-full flex-col overflow-y-auto border-r">
                    {/* Logo - Consistent across mobile and desktop */}
                    <div className="px-4 py-8">
                        <Link to="/" className="flex items-center">
                            <span className="font-Satisfy text-primary dark:text-primary-light text-4xl">
                                EverStory
                            </span>
                        </Link>
                    </div>

                    {/* Close button (mobile only) */}
                    <div className="flex items-center justify-end px-4 md:hidden">
                        <button
                            onClick={() => setOpen(false)}
                            className="text-neutral-medium hover:bg-neutral-light hover:text-neutral-dark dark:text-neutral-medium dark:hover:bg-neutral-dark dark:hover:text-neutral-light rounded-md p-2"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Post Search bar - Only show on feed page */}
                    {isOnFeedPage && (
                        <div className="px-4 py-3">
                            <div
                                className="relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <FileText className="text-neutral-medium h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    value={postInputValue}
                                    onChange={handlePostSearch}
                                    placeholder="Search posts..."
                                    className="border-neutral-light text-neutral-dark focus:ring-primary dark:border-neutral-dark dark:text-neutral-light w-full rounded border py-2 pr-4 pl-10 text-sm focus:ring-1 focus:outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* User Search bar */}
                    {/* <div className="border-border-light dark:border-border-dark border-b px-4 py-3">
                        <div
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="text-neutral-medium h-4 w-4" />
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={inputValue}
                                onChange={handleSearch}
                                placeholder="Search accounts..."
                                className="border-neutral-light text-neutral-dark focus:ring-primary dark:border-neutral-dark dark:text-neutral-light w-full rounded border py-2 pr-4 pl-10 text-sm focus:ring-1 focus:outline-none"
                                onFocus={() => {
                                    if (searchQuery.trim().length >= 2) {
                                        setShowResults(true)
                                    }
                                }}
                            />
                            {showResults && (
                                <div
                                    ref={searchResultsRef}
                                    className="absolute right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                                >
                                    {isLoading || isSearching ? (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                            Searching...
                                        </div>
                                    ) : searchResults?.users &&
                                      searchResults.users.length > 0 ? (
                                        <div>
                                            {searchResults.users.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className="flex cursor-pointer items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    onClick={() =>
                                                        handleUserClick(user.id)
                                                    }
                                                >
                                                    <div className="mr-2 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                                                        {user.profile_image ? (
                                                            <img
                                                                src={
                                                                    user.profile_image
                                                                }
                                                                alt={
                                                                    user.username
                                                                }
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-medium">
                                                                {user.username
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                                                            {user.username}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : inputValue.length >= 2 ? (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                            No users found
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                            Type at least 2 characters to search
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div> */}

                    {/* Navigation */}
                    <nav className="mt-5 flex-1 space-y-1 px-2">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setOpen(false)}
                                    className={`group flex items-center rounded-md px-3 py-3 text-sm font-medium ${
                                        isActive
                                            ? 'text-primary dark:text-primary-light'
                                            : 'text-neutral-dark dark:text-neutral-medium'
                                    }`}
                                >
                                    <item.icon
                                        className={`mr-3 h-5 w-5 ${
                                            isActive
                                                ? 'text-primary dark:text-primary-light'
                                                : 'text-neutral-medium dark:text-neutral-medium'
                                        }`}
                                    />
                                    {item.name}

                                    {/* Badge for notifications */}
                                    {item.count > 0 && (
                                        <span className="bg-error/20 text-error dark:bg-error/30 dark:text-error ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                                            {item.count}
                                        </span>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="bg-neutral-light dark:bg-neutral-dark me-4 mt-3 flex items-center justify-between rounded-full ps-4 pe-2">
                        <h1 className="text-neutral-dark dark:text-neutral-light text-sm">
                            Change Theme
                        </h1>
                        <ThemeToggle />
                    </div>

                    {/* User info */}
                    <div className="flex flex-shrink-0 items-center justify-between py-5">
                        <div className="flex items-center gap-2">
                            <div className="bg-neutral-light dark:bg-neutral-dark h-10 w-10 overflow-hidden rounded-full">
                                {user?.profile_image ? (
                                    <img
                                        src={user.profile_image}
                                        alt={user.username}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <span className="text-neutral-dark dark:text-neutral-light text-lg">
                                            {user?.username
                                                ?.charAt(0)
                                                .toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-neutral-darkest dark:text-neutral-lightest text-sm leading-[1]">
                                    {user?.username}
                                </h2>
                                <p className="text-neutral-medium dark:text-neutral-medium text-xs">
                                    @{user?.username?.toLowerCase()}
                                </p>
                            </div>
                        </div>
                        {/* Logout button */}
                        <button
                            onClick={handleLogout}
                            className="group text-neutral-dark hover:bg-neutral-light dark:text-neutral-light dark:hover:bg-neutral-dark me-3 rounded-full px-3 py-3 text-sm font-medium"
                        >
                            <LogOut className="text-neutral-medium dark:text-neutral-medium h-4 w-4" />
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto p-4 pt-0">
                        <p className="text-neutral-medium dark:text-neutral-medium text-center text-xs">
                            &copy; 2025 EverStory. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Sidebar
