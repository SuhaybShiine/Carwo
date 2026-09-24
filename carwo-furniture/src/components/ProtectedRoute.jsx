import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

// ============================================================
// PROTECTED ROUTE — User iyo Admin
// ============================================================
export function ProtectedRoute({ children }) {
  const isLoggedIn = authService.isLoggedIn();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ============================================================
// ADMIN ROUTE — Admin kaliya
// ============================================================
export function AdminRoute({ children }) {
  const isLoggedIn = authService.isLoggedIn();
  const isAdmin = authService.isAdmin();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}