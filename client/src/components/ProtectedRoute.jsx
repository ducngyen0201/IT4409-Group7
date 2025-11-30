import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Component này nhận vào:
// - children: Trang cần bảo vệ (ví dụ: TeacherDashboard)
// - roles: Mảng các role được phép truy cập (ví dụ: ['TEACHER', 'ADMIN'])
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Đang tải...</div>;

  // 1. Nếu chưa đăng nhập -> Về trang Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Nếu có quy định role, mà user không có role đó -> Về trang chủ
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // 3. Hợp lệ -> Cho vào
  return children;
};

export default ProtectedRoute;