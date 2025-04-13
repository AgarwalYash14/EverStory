import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar'
import { useState } from 'react'

declare global {
    interface Window {}
}

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="dark:bg-neutral-darkest mx-auto flex min-h-screen max-w-7xl">
            {/*  for navigation - sticky */}
            <div className="sticky top-0 flex max-h-screen overflow-hidden">
                <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
            </div>

            {/* Main content area - scrollable */}
            <div className="flex-1 overflow-hidden">
                <main className="p-4">
                    <Outlet />
                </main>
            </div>

            {/* Mobile sidebar toggle */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="bg-primary text-neutral-lightest fixed right-4 bottom-4 z-10 rounded-full p-3 shadow-lg md:hidden"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>
        </div>
    )
}

export default Layout
