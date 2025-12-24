import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { isDark, toggleDarkMode } = useDarkMode()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    if (path === '/tools') {
      // Highlight Tools when on /tools or any tool category page
      const toolPaths = ['/tools', '/gis-tools', '/dev-tools', '/productivity-tools', '/marketing-tools']
      return toolPaths.some(toolPath => location.pathname.startsWith(toolPath))
    }
    return location.pathname.startsWith(path)
  }

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/tools', label: 'Tools' },
  ]

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={isDark ? "/logo-w8-bg.png" : "/logo.png"} 
              alt="Devimuth Logo" 
              className="h-8 w-auto"
            />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Devimuth
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={toggleDarkMode}
              className="ml-1 p-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-1.5 text-gray-700 dark:text-gray-300"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-gray-700 dark:text-gray-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 space-y-1 border-t border-gray-200 dark:border-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-medium ${
                  isActive(link.path)
                    ? 'text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}

