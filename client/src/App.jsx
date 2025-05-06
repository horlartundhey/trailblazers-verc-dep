import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './redux/store';
import { getCurrentUser } from './redux/slices/authSlice';

// Pages
import Login from './components/auth/Login';
import AdminDashboard from './pages/admin/Dashboard';
import LeaderDashboard from './pages/leader/Dashboard';
import MemberDashboard from './pages/member/Dashboard';
import CompleteRegistration from './pages/member/CompleteRegistration';
import PrivateRoute from './routes/PrivateRoute';
import Index from './pages/Index';
import RegisterMember from './pages/RegisterMember';
import { setStore } from './utils/api';

// Initialize the API with the Redux store
setStore(store);

// Set up application with Redux
const AppContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, token, loading } = useSelector(state => state.auth);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (token && !isAuthenticated && !loading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, isAuthenticated, loading]);

  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      setIsRedirecting(true);
      console.log('App.jsx: Redirecting user:', user);
      
      // Add a slight delay to ensure state propagation
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
      }, 100); // 100ms delay
    }
  }, [isAuthenticated, user, loading, navigate]);
  
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
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterMember />} />
      
      {/* Protected routes with role-based access */}
      <Route element={<PrivateRoute allowedRoles={['Admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
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
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default App;