import { useState, ChangeEvent, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
    onSearch: (query: string) => void
    debounceTime?: number
}

const SearchBar = ({ onSearch, debounceTime = 500 }: SearchBarProps) => {
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [])

    // Debounce the query updates
    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

        timerRef.current = setTimeout(() => {
            setDebouncedQuery(query)
            onSearch(query)
        }, debounceTime)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [query, debounceTime, onSearch])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value)
    }

    return (
        <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
                <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
            <input
                type="text"
                value={query}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 ps-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                placeholder="Search posts..."
            />
        </div>
    )
}

export default SearchBar
