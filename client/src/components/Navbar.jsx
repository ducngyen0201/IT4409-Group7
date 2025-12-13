import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { Bell, Search, LogOut, BookOpen, Settings, LayoutDashboard, Menu as MenuIcon, X, ShieldAlert } from 'lucide-react';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // State hiển thị
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotiMenu, setShowNotiMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Vẫn giữ state search cho Mobile Menu (nếu cần)
  const [searchTerm, setSearchTerm] = useState('');
  
  // State xử lý lỗi ảnh
  const [imageError, setImageError] = useState(false);

  // Data thông báo
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userMenuRef = useRef(null);
  const notiMenuRef = useRef(null);

  // Reset lỗi ảnh khi user thay đổi
  useEffect(() => {
    setImageError(false);
  }, [user?.avatar]);

  // 1. Hiệu ứng cuộn trang
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Fetch thông báo
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await axiosClient.get('/api/me/notifications');
          setNotifications(res.data);
          const count = res.data.filter(n => !n.read_at).length;
          setUnreadCount(count);
        } catch (err) {
          console.error("Lỗi tải thông báo", err);
        }
      };
      fetchNotifications();
    }
  }, [user]);

  // 3. Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
      if (notiMenuRef.current && !notiMenuRef.current.contains(event.target)) setShowNotiMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/all-courses?search=${encodeURIComponent(searchTerm)}`);
      setShowMobileMenu(false);
      setSearchTerm('');
    }
  };

  // --- HÀM XỬ LÝ URL ẢNH ---
  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiUrl}${path}`;
  };

  // --- HÀM RENDER AVATAR ---
  const renderAvatar = (sizeClasses = "w-10 h-10", textSize = "text-sm") => {
    if (user?.avatar && !imageError) {
      return (
        <img 
          src={getAvatarUrl(user.avatar)} 
          alt="Avatar" 
          className={`${sizeClasses} rounded-full object-cover border border-gray-200 shadow-sm`}
          onError={(e) => {
            setImageError(true);
            e.target.style.display = 'none'; 
          }}
        />
      );
    }
    return (
      <div className={`${sizeClasses} rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold ${textSize} uppercase shadow-sm`}>
        {user?.full_name ? user.full_name.charAt(0) : 'U'}
      </div>
    );
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-2' : 'bg-white py-3 border-b border-gray-100'}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* --- LEFT: LOGO (Chỉ còn mỗi Logo) --- */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-extrabold text-indigo-600 flex items-center gap-2 tracking-tight">
              <span className="text-3xl">🎓</span> E-Learning
            </Link>
          </div>

          {/* --- MIDDLE: SEARCH BAR ĐÃ BỊ XÓA --- */}

          {/* --- RIGHT: ACTIONS --- */}
          <div className="flex items-center gap-3 lg:gap-5">
            
            {/* Nút Mobile Menu (Hiện khi màn hình nhỏ) */}
            <button 
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X size={24} /> : <MenuIcon size={24} />}
            </button>

            {user ? (
              <>
                {/* 1. NOTIFICATIONS */}
                <div className="relative hidden md:block" ref={notiMenuRef}>
                  <button onClick={() => setShowNotiMenu(!showNotiMenu)} className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                    )}
                  </button>
                  {showNotiMenu && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 animate-fadeIn origin-top-right z-50">
                       <div className="p-4 text-center text-sm text-gray-500">Chức năng thông báo đang phát triển</div>
                    </div>
                  )}
                </div>

                {/* 2. USER DROPDOWN */}
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 focus:outline-none group"
                  >
                    <div className="group-hover:ring-2 ring-indigo-200 rounded-full transition p-0.5">
                      {renderAvatar("w-9 h-9", "text-sm")}
                    </div>
                    
                    <div className="hidden md:block text-left">
                       <p className="text-sm font-bold text-gray-700 leading-none group-hover:text-indigo-600 transition">{user.full_name}</p>
                       <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">
                         {user.role === 'ADMIN' ? 'Quản trị' : user.role === 'TEACHER' ? 'Giảng viên' : 'Học viên'}
                       </p>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 animate-fadeIn origin-top-right overflow-hidden z-50">
                      <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      <div className="py-2">
                        <Link to="/profile" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition" onClick={() => setShowUserMenu(false)}>
                          <Settings size={16} /> Hồ sơ cá nhân
                        </Link>
                        
                        {user.role === 'STUDENT' && (
                          <Link to="/my-courses" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition" onClick={() => setShowUserMenu(false)}>
                            <BookOpen size={16} /> Khóa học của tôi
                          </Link>
                        )}

                        {user.role === 'ADMIN' && (
                          <Link to="/admin/dashboard" className="flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition mt-1" onClick={() => setShowUserMenu(false)}>
                            <ShieldAlert size={16} /> Trang Quản Trị
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 my-1 pt-1">
                        <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition">
                          <LogOut size={16} /> Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="hidden md:block text-gray-600 font-semibold hover:text-indigo-600 transition">Đăng nhập</Link>
                <Link to="/register" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition transform hover:-translate-y-0.5">Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* --- MOBILE MENU (Giữ lại để điện thoại vẫn dùng được) --- */}
      {showMobileMenu && (
         <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl py-4 px-4 flex flex-col gap-4 animate-slideDown z-40">
           {/* Mobile Search */}
           <form onSubmit={handleSearch} className="relative">
             <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
             <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-100 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
           </form>

           {/* Mobile Links */}
           <div className="flex flex-col gap-2 text-gray-700 font-medium border-b border-gray-100 pb-4">
             {user && (
              <Link to="/all-courses" className="py-2 hover:text-indigo-600" onClick={() => setShowMobileMenu(false)}>
                Tất cả khóa học
              </Link>
             )}
             <Link to="/instructors" className="py-2 hover:text-indigo-600" onClick={() => setShowMobileMenu(false)}>
                Giảng viên
             </Link>
           </div>
           
           {!user && (
             <div className="flex flex-col gap-3">
               <Link to="/login" className="w-full text-center py-2 border border-gray-300 rounded-lg font-bold text-gray-700" onClick={() => setShowMobileMenu(false)}>Đăng nhập</Link>
               <Link to="/register" className="w-full text-center py-2 bg-indigo-600 text-white rounded-lg font-bold" onClick={() => setShowMobileMenu(false)}>Đăng ký</Link>
             </div>
           )}
         </div>
      )}
    </nav>
  );
}

export default Navbar;