import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { Bell, LogOut, Settings, Menu as MenuIcon, X, ShieldAlert, User } from 'lucide-react';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- STATE HIỂN THỊ ---
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotiMenu, setShowNotiMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // --- STATE DỮ LIỆU ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [imageError, setImageError] = useState(false);

  const userMenuRef = useRef(null);
  const notiMenuRef = useRef(null);

  // 1. Hiệu ứng cuộn trang (Thay đổi độ trong suốt Navbar)
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Logic Reset lỗi ảnh khi User thay đổi (Quan trọng để cập nhật Avatar sau khi upload)
  useEffect(() => {
    setImageError(false);
  }, [user?.avatar]);

  // 3. Tải thông báo từ Backend
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axiosClient.get('/api/me/notifications');
      setNotifications(res.data);
      const count = res.data.filter(n => !n.read_at).length;
      setUnreadCount(count);
    } catch (err) {
      console.error("Lỗi tải thông báo:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000); // Cập nhật mỗi 2 phút
    return () => clearInterval(interval);
  }, [user]);

  // 4. Đánh dấu thông báo đã đọc
  const handleMarkRead = async (id) => {
    try {
      await axiosClient.post(`/api/me/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  };

  // 5. Đóng menu khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
      if (notiMenuRef.current && !notiMenuRef.current.contains(event.target)) setShowNotiMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HÀM HỖ TRỢ HIỂN THỊ AVATAR ---
  const getAvatarUrl = (path) => {
    if (!path) return null;

    // Nếu path là link Cloudinary hoàn chỉnh (bắt đầu bằng http)
    if (path.startsWith('http')) return path;

    // Nếu là link Local cũ (ví dụ: uploads/avatar.jpg)
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  const renderAvatar = (sizeClasses = "w-9 h-9") => {
    const avatarUrl = getAvatarUrl(user?.avatar);
    
    if (avatarUrl && !imageError) {
      return (
        <img 
          src={avatarUrl} 
          className={`${sizeClasses} rounded-full object-cover border border-gray-200 shadow-sm`}
          onError={() => setImageError(true)}
          alt="Profile"
        />
      );
    }
    return (
      <div className={`${sizeClasses} rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold uppercase shadow-sm`}>
        {user?.full_name?.charAt(0) || 'U'}
      </div>
    );
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-2' : 'bg-white py-3 border-b border-gray-100'}`}>
      <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">
        
        {/* LOGO */}
        <Link to="/" className="text-2xl font-black text-indigo-600 flex items-center gap-2 tracking-tighter">
          <span className="text-3xl">🎓</span> E-LEARNING
        </Link>

        {/* CÁC HÀNH ĐỘNG BÊN PHẢI */}
        <div className="flex items-center gap-3 md:gap-5">
          {user ? (
            <>
              {/* CHUÔNG THÔNG BÁO */}
              <div className="relative" ref={notiMenuRef}>
                <button 
                  onClick={() => setShowNotiMenu(!showNotiMenu)} 
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition relative"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* DROPDOWN THÔNG BÁO */}
                {showNotiMenu && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-in fade-in zoom-in duration-200 origin-top-right z-[60] overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <span className="font-bold text-gray-800 text-sm">Thông báo gần đây</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase">Mới</span>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400 italic">Bạn chưa có thông báo nào</div>
                      ) : (
                        notifications.map((noti) => (
                          <div 
                            key={noti.id} 
                            onClick={() => {
                              if (!noti.read_at) handleMarkRead(noti.id);
                              setShowNotiMenu(false);
                            }}
                            className={`px-4 py-4 border-b border-gray-50 cursor-pointer transition flex gap-3 ${!noti.read_at ? 'bg-indigo-50/30 hover:bg-indigo-50' : 'hover:bg-gray-50'}`}
                          >
                            <div className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${!noti.read_at ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                            <div className="flex-1">
                              <p className={`text-sm leading-snug ${!noti.read_at ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                {noti.message}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                {new Date(noti.created_at).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* MENU NGƯỜI DÙNG */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)} 
                  className="flex items-center gap-3 px-1 py-1 rounded-full hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                >
                  {renderAvatar()}
                  <div className="hidden md:block text-left pr-2">
                    <p className="text-sm font-bold text-gray-800 leading-none">{user.full_name}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-wider">{user.role}</p>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[60] overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 md:hidden">
                       <p className="font-bold text-gray-800">{user.full_name}</p>
                       <p className="text-xs text-gray-400 uppercase tracking-widest">{user.role}</p>
                    </div>

                    <Link to="/profile" className="flex items-center gap-3 px-5 py-3 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" onClick={() => setShowUserMenu(false)}>
                      <User size={18} /> Hồ sơ cá nhân
                    </Link>
                    
                    {user.role === 'ADMIN' && (
                      <Link to="/admin/dashboard" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors" onClick={() => setShowUserMenu(false)}>
                        <ShieldAlert size={18} /> Trang Quản Trị
                      </Link>
                    )}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button 
                        onClick={logout} 
                        className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <LogOut size={18} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-indigo-600 px-3">Đăng nhập</Link>
              <Link to="/register" className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;