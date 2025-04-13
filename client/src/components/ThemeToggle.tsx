import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

const ThemeToggle = () => {
    // Initialize theme from localStorage or system preference
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme')

            if (savedTheme) {
                return savedTheme
            }

            // Check system preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark'
            }
        }

        return 'light'
    })

    // Update theme when it changes
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }

        // Save the theme preference to localStorage
        localStorage.setItem('theme', theme)
    }, [theme])

    // Toggle between light and dark themes
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
    }

    return (
        <button
            onClick={toggleTheme}
            className="text-neutral-medium hover:bg-neutral-light hover:text-neutral-dark dark:text-neutral-medium dark:hover:bg-neutral-dark dark:hover:text-neutral-light rounded-md p-2"
            aria-label={
                theme === 'light'
                    ? 'Switch to dark mode'
                    : 'Switch to light mode'
            }
        >
            {theme === 'light' ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5" />
            )}
        </button>
    )
}

export default ThemeToggle
