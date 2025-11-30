import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="bg-white shadow-md">
      <div className="container px-4 mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-indigo-600">
            E-Learning
          </Link>

          {/* Menu bên phải */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-indigo-600">
              Trang chủ
            </Link>

            {user ? (
              // --- ĐÃ ĐĂNG NHẬP ---
              <>
                {/* Menu riêng cho Giáo viên */}
                {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                  <Link to="/teacher/courses" className="font-medium text-indigo-600">
                    Quản lý khóa học
                  </Link>
                )}
                
                {/* Menu riêng cho Học sinh */}
                {user.role === 'STUDENT' && (
                  <Link to="/my-courses" className="text-gray-700 hover:text-indigo-600">
                    Khóa học của tôi
                  </Link>
                )}

                <div className="flex items-center space-x-2 border-l pl-4 ml-4">
                  <span className="text-sm font-semibold text-gray-800">
                    Chào, {user.full_name}
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              // --- CHƯA ĐĂNG NHẬP ---
              <>
                <Link to="/login" className="text-gray-700 hover:text-indigo-600">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;