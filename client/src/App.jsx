import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './redux/slices/authSlice';
import PrivateRoute from './routes/PrivateRoute';

// Index is the default landing route — keep it eager so the most common
// visit doesn't pay a lazy-chunk round trip. Everything else loads on demand.
import Index from './pages/Index';

const Login = lazy(() => import('./components/auth/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AttendanceDashboard = lazy(() => import('./pages/admin/AttendanceDashboard'));
const RegionCampusManagement = lazy(() => import('./pages/admin/RegionCampusManagement'));
const LeaderDashboard = lazy(() => import('./pages/leader/Dashboard'));
const MemberDashboard = lazy(() => import('./pages/member/Dashboard'));
const CompleteRegistration = lazy(() => import('./pages/member/CompleteRegistration'));
const InterestForm = lazy(() => import('./pages/InterestForm'));
const Events = lazy(() => import('./pages/Events'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Gallery = lazy(() => import('./pages/Gallery'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const RouteFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

// Set up application with Redux
const AppContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, token, loading } = useSelector(state => state.auth);
  console.log('AppContent auth state:', { isAuthenticated, user, token, loading });
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (token && !isAuthenticated && !loading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, isAuthenticated, loading]);

  useEffect(() => {
    // Only auto-redirect immediately after login when on the login page
    if (location.pathname === '/login' && isAuthenticated && user && !loading) {
      setIsRedirecting(true);
      console.log('App.jsx: Redirecting user after login:', user);
      setTimeout(() => {
        switch (user.role) {
          case 'Admin':
            navigate('/admin/dashboard', { replace: true });
            break;
          case 'Leader':
            navigate('/leader/dashboard', { replace: true });
            break;
          case 'Member':
            if (user.registrationStatus === 'Pending') {
              navigate('/complete-registration', { replace: true });
            } else {
              navigate('/member/dashboard', { replace: true });
            }
            break;
          default:
            navigate('/', { replace: true });
        }
        setIsRedirecting(false);
      }, 100);
    }
  }, [location.pathname, isAuthenticated, user, loading, navigate]);
  
  if (isRedirecting) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-4 text-gray-700">Redirecting...</span>
      </div>
    );
  }
  
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/events" element={<Events />} />
      <Route path="/about" element={<About />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/register" element={<Navigate to="/interest" replace />} />
      <Route path="/interest" element={<InterestForm />} />
      
      {/* Protected routes with role-based access */}
      <Route element={<PrivateRoute allowedRoles={['Admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/region-campus" element={<RegionCampusManagement />} />
      </Route>
      
      <Route element={<PrivateRoute allowedRoles={['Leader']} />}>
        <Route path="/leader/dashboard" element={<LeaderDashboard />} />
      </Route>
      
      <Route element={<PrivateRoute allowedRoles={['Member']} />}>
        <Route path="/member/dashboard" element={<MemberDashboard />} />
        <Route path="/complete-registration" element={<CompleteRegistration />} />
      </Route>
      
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;