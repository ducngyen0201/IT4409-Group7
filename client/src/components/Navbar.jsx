import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { formatDateTime } from '../utils/dateUtils';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // State quản lý hiển thị menu
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotiMenu, setShowNotiMenu] = useState(false);
  
  // State dữ liệu thông báo
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Ref để xử lý click ra ngoài thì đóng menu
  const userMenuRef = useRef(null);
  const notiMenuRef = useRef(null);

  // 1. Lấy danh sách thông báo khi đăng nhập
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const token = sessionStorage.getItem('token');
          const res = await axios.get('http://localhost:5000/api/me/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setNotifications(res.data);
          // Đếm số thông báo chưa đọc (read_at là null)
          const count = res.data.filter(n => !n.read_at).length;
          setUnreadCount(count);
        } catch (err) {
          console.error("Lỗi tải thông báo", err);
        }
      };
      fetchNotifications();
    }
  }, [user]);

  // 2. Xử lý click ra ngoài để đóng menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notiMenuRef.current && !notiMenuRef.current.contains(event.target)) {
        setShowNotiMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Xử lý khi đọc thông báo
  const handleReadNotification = async (noti) => {
    if (!noti.read_at) {
      try {
        const token = sessionStorage.getItem('token');
        await axios.post(`http://localhost:5000/api/me/notifications/${noti.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Cập nhật lại state local
        setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, read_at: new Date() } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    setShowNotiMenu(false);
  };

  return (
    <nav className="bg-white shadow-md z-50 relative">
      <div className="container px-4 mx-auto">
        <div className="flex justify-between items-center h-16">
          
          {/* --- LOGO --- */}
          <Link to="/" className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <span>🎓</span> E-Learning
          </Link>

          {/* --- MENU BÊN PHẢI --- */}
          <div className="flex items-center space-x-6">
            
            {user ? (
              <>
                {/* 1. ICON CHUÔNG THÔNG BÁO */}
                <div className="relative" ref={notiMenuRef}>
                  <button 
                    onClick={() => setShowNotiMenu(!showNotiMenu)}
                    className="relative p-1 text-gray-600 hover:text-indigo-600 focus:outline-none"
                  >
                    {/* SVG Icon Chuông */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    
                    {/* Badge số lượng chưa đọc */}
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Thông báo */}
                  {showNotiMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 border ring-1 ring-black ring-opacity-5 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b text-sm font-semibold text-gray-700">Thông báo</div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">Không có thông báo mới.</div>
                      ) : (
                        notifications.map(noti => (
                          <div 
                            key={noti.id}
                            onClick={() => handleReadNotification(noti)}
                            className={`px-4 py-3 text-sm border-b hover:bg-gray-50 cursor-pointer ${!noti.read_at ? 'bg-indigo-50' : ''}`}
                          >
                            <p className="text-gray-800">{JSON.parse(noti.payload_json).message || 'Thông báo mới'}</p>
                            <span className="text-xs text-gray-500">{new Date(noti.created_at).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 2. AVATAR USER */}
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center focus:outline-none"
                  >
                    {/* Avatar hình tròn (Dùng ảnh placeholder nếu chưa có) */}
                    <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold overflow-hidden border-2 border-white shadow">
                      {/* Nếu user có avatar_url thì hiện img, ko thì hiện chữ cái đầu */}
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </button>

                  {/* Dropdown Menu User */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl py-1 border ring-1 ring-black ring-opacity-5">
                      {/* Header: Tên & Email */}
                      <div className="px-4 py-3 border-b bg-gray-50">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      {/* Các mục menu */}
                      <Link 
                        to="/profile" // Bạn sẽ cần tạo trang Profile sau
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        👤 Hồ sơ cá nhân
                      </Link>

                      {/* Link khóa học (Tùy role) */}
                      {user.role === 'STUDENT' && (
                        <Link 
                          to="/my-courses" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          📚 Khóa học của bạn
                        </Link>
                      )}
                      {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                        <Link 
                          to="/teacher/courses" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          👨‍🏫 Quản lý khóa học
                        </Link>
                      )}

                      <div className="border-t my-1"></div>

                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        🚪 Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // --- CHƯA ĐĂNG NHẬP ---
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 font-medium shadow-md transition"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;