import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Tạo Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Lưu thông tin user (id, name, role...)
  const [loading, setLoading] = useState(true); // Trạng thái đang tải lại trang

  // Hàm load user khi F5 trang
  useEffect(() => {
    const loadUser = async () => {
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          // Gọi API /me để lấy thông tin user từ token
          // (Lưu ý: Bạn cần chắc chắn API /api/me đã hoạt động ở Backend)
          const response = await axios.get('http://localhost:5000/api/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
        } catch (err) {
          console.error("Token không hợp lệ hoặc hết hạn", err);
          sessionStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Hàm Đăng nhập
  const login = (token, userData) => {
    sessionStorage.setItem('token', token);
    setUser(userData);
  };

  // Hàm Đăng xuất
  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login'; // Chuyển hướng cứng về login
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};