import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom'; // Dùng Outlet nếu bạn bọc Route lồng nhau
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner'; // Import Spinner nếu có

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  // 1. QUAN TRỌNG: Nếu đang load user từ session thì chưa được quyết định gì cả
  // Phải hiện màn hình chờ (hoặc null) để React không tự động chuyển hướng
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {/* Nếu chưa có component LoadingSpinner thì dùng tạm text này */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 2. Nếu load xong mà vẫn không có user -> Chưa đăng nhập -> Về Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Kiểm tra quyền (Role)
  // Logic: Nếu route có yêu cầu roles cụ thể, thì phải check xem role user (viết hoa) có nằm trong đó không
  if (roles && roles.length > 0) {
    const userRole = user.role ? user.role.toUpperCase() : '';
    
    // --- THÊM LOG ĐỂ KIỂM TRA ---
    console.log("Check Role:", { 
       required: roles, 
       current: userRole, 
       isMatch: roles.includes(userRole) 
    });

    if (!roles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
}

  // 4. Nếu thỏa mãn tất cả -> Cho phép truy cập
  return children ? children : <Outlet />;
};

export default ProtectedRoute;