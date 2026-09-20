import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // หากยังไม่ได้ Login หรือไม่ใช่ Staff/Admin ให้ redirect กลับหน้า Home
  if (!user || user.role !== 'STAFF') {
    return <Navigate to="/" replace />;
  }

  return children;
}