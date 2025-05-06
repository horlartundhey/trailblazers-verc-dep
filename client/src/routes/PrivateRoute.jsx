import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useSelector(state => state.auth);
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    console.log('PrivateRoute: Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('PrivateRoute: Role not allowed, redirecting to /login', { userRole: user?.role, allowedRoles });
    return <Navigate to="/login" replace />;
  }
  
  // If all checks pass, render the child routes
  return <Outlet />;
};

export default PrivateRoute;