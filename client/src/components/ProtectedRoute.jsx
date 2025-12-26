import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  // 1. QUAN TRỌNG: Nếu đang load user từ session thì chưa được quyết định gì cả
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 2. Nếu load xong mà vẫn không có user -> Chưa đăng nhập -> Về Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Kiểm tra quyền (Role)
  if (roles && roles.length > 0) {
    const userRole = user.role ? user.role.toUpperCase() : '';
    if (!roles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
}

  // 4. Nếu thỏa mãn tất cả -> Cho phép truy cập
  return children ? children : <Outlet />;
};

export default ProtectedRoute;