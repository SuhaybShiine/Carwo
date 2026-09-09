import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

export function ProtectedRoute({ children }) {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function AdminRoute({ children }) {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  if (!authService.isAdmin()) {
    return <Navigate to="/" replace />;
  }
  return children;
}