import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

const Navbar = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 50));

  const dashboardPath =
    user?.role === 'Admin' ? '/admin/dashboard' :
    user?.role === 'Leader' ? '/leader/dashboard' :
    '/member/dashboard';

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        animate={{
          backgroundColor: scrolled ? 'rgba(255,255,255,1)' : 'rgba(15,10,60,0.45)',
          boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.08)' : 'none',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Brand */}
            <Link to="/">
              <motion.span
                className={`text-xl font-bold tracking-tight transition-colors duration-300 ${scrolled ? 'text-indigo-900' : 'text-white'}`}
                whileHover={{ scale: 1.02 }}
              >
                Trailblazers Nation
              </motion.span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1">
              {['About', 'Events', 'Gallery', 'Contact Us'].map((label) => {
                const to = label === 'Contact Us' ? '/contact' : `/${label.toLowerCase()}`;
                return (
                  <Link
                    key={label}
                    to={to}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${
                      scrolled ? 'text-gray-700 hover:text-indigo-700' : 'text-white/90 hover:text-white'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}

              {isAuthenticated ? (
                <Link
                  to={dashboardPath}
                  className="ml-2 px-5 py-2 text-sm font-semibold bg-indigo-700 text-white rounded-full hover:bg-indigo-600 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                      scrolled ? 'text-indigo-700 hover:text-indigo-900' : 'text-white/90 hover:text-white'
                    }`}
                  >
                    Login
                  </Link>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to="/register"
                      className={`ml-1 px-5 py-2.5 text-sm font-semibold rounded-full transition-colors ${
                        scrolled
                          ? 'bg-indigo-700 text-white hover:bg-indigo-600'
                          : 'bg-white text-indigo-900 hover:bg-white/90'
                      }`}
                    >
                      Become a Member
                    </Link>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-md transition-colors duration-300 ${
                scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={mobileMenuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-lg md:hidden ${
          mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div className="px-4 py-3 space-y-1">
          {['About', 'Events', 'Gallery', 'Contact Us'].map((label) => {
            const to = label === 'Contact Us' ? '/contact' : `/${label.toLowerCase()}`;
            return (
              <Link
                key={label}
                to={to}
                className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
          <div className="pt-2 pb-1 border-t border-gray-100 space-y-1">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="block px-3 py-2.5 text-base font-medium bg-indigo-700 text-white rounded-full text-center hover:bg-indigo-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2.5 text-base font-medium text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2.5 text-base font-semibold bg-indigo-700 text-white rounded-full text-center hover:bg-indigo-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Become a Member
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Navbar;
