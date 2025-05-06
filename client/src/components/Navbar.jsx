import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <nav className="bg-indigo-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand/Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link 
              to="/" 
              className="text-xl font-bold tracking-tight hover:text-indigo-200 transition-colors"
            >
              Trailblazers Nation
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/about" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 hover:text-white transition-colors"
            >
              About
            </Link>
            <Link 
              to="/events" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 hover:text-white transition-colors"
            >
              Events
            </Link>
            <Link 
              to="/gallery" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 hover:text-white transition-colors"
            >
              Gallery
            </Link>
            <Link 
              to="/contact" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 hover:text-white transition-colors"
            >
              Contact
            </Link>
            
            {isAuthenticated ? (
              <Link 
                to={user.role === 'Admin' ? '/admin/dashboard' : 
                    user.role === 'Leader' ? '/leader/dashboard' : 
                    '/member/dashboard'}
                className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-indigo-700 focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-indigo-900">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/about" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/events" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Events
            </Link>
            <Link 
              to="/gallery" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Gallery
            </Link>
            <Link 
              to="/contact" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            
            {isAuthenticated ? (
              <Link 
                to={user.role === 'Admin' ? '/admin/dashboard' : 
                    user.role === 'Leader' ? '/leader/dashboard' : 
                    '/member/dashboard'}
                className="block px-3 py-2 rounded-md text-base font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/memberegister" 
                  className="block px-3 py-2 rounded-md text-base font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;