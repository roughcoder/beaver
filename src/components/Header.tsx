import { Link, useNavigate } from '@tanstack/react-router'
import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth } from 'convex/react'

import { useState } from 'react'
import {
  Home,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { signOut } = useAuthActions()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/' })
  }

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-gray-800 text-white shadow-lg">
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-xl font-semibold">
            <Link to="/">
              <img
                src="/tanstack-word-logo-white.svg"
                alt="TanStack Logo"
                className="h-10"
              />
            </Link>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && isAuthenticated && (
            <>
              <Link
                to="/app"
                className="px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                App
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                aria-label="Sign out"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </>
          )}
          {!isLoading && !isAuthenticated && (
            <>
              <Link
                to="/sign-in"
                className="px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>
        </nav>
      </aside>
    </>
  )
}
