import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './redux/slices/authSlice';

// Pages
import Login from './components/auth/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AttendanceDashboard from './pages/admin/AttendanceDashboard';
import RegionCampusManagement from './pages/admin/RegionCampusManagement';
import LeaderDashboard from './pages/leader/Dashboard';
import MemberDashboard from './pages/member/Dashboard';
import CompleteRegistration from './pages/member/CompleteRegistration';
import PrivateRoute from './routes/PrivateRoute';
import Index from './pages/Index';
import InterestForm from './pages/InterestForm';
import Events from './pages/Events';
import About from './pages/About';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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