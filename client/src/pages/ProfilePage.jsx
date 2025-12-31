import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import CustomModal from '../components/CustomModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { Camera, Loader2, Lock, ShieldCheck, Save, Mail, User } from 'lucide-react';

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'alert', title: '', message: '' });

  const [fullName, setFullName] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

 const getAvatarUrl = (path) => {
  if (!path) return null;

  if (path.startsWith('http')) {
    return path; 
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
};

  const showAlert = (title, message, type = 'alert') => {
    setAlertModal({ isOpen: true, type, title, message });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get('/api/me');
        const userData = res.data.user || res.data; 
        setUser(userData);
        setFullName(userData.full_name || userData.fullName);
      } catch (err) {
        console.error("Lỗi tải profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 1. Kiểm tra định dạng tệp (Security bổ sung)
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showAlert('Lỗi', 'Chỉ chấp nhận định dạng ảnh (JPG, PNG, WEBP).', 'error');
      return;
    }

    // 2. Kiểm tra dung lượng
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Lỗi', 'Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.', 'error');
      return;
    }

    // 3. Tạo Preview tức thì cho người dùng (UX)
    const previewUrl = URL.createObjectURL(file);
    const oldAvatar = user.avatar; // Lưu lại để rollback nếu upload lỗi
    setUser(prev => ({ ...prev, avatar: previewUrl }));

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setIsUploadingAvatar(true);
      const res = await axiosClient.patch('/api/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUser(prev => ({ ...prev, avatar: res.data.avatar }));
      showAlert('Thành công', 'Đã cập nhật ảnh đại diện!', 'success');
    } catch (err) {
      // Rollback ảnh cũ nếu upload thất bại
      setUser(prev => ({ ...prev, avatar: oldAvatar }));
      showAlert('Lỗi', 'Không thể upload ảnh lên máy chủ.', 'error');
    } finally {
      setIsUploadingAvatar(false);
      URL.revokeObjectURL(previewUrl); // Giải phóng bộ nhớ
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    const cleanName = fullName.trim();
  
  if (cleanName.length < 2) {
    showAlert('Lỗi', 'Tên quá ngắn, vui lòng nhập lại.', 'error');
    return;
  }
    try {
      await axiosClient.patch('/api/me/info', { full_name: fullName });
      showAlert('Thành công', 'Đã cập nhật thông tin cá nhân.', 'success');
      setUser(prev => ({ ...prev, full_name: fullName }));
    } catch (err) {
      console.error(err);
      showAlert('Lỗi', 'Không thể cập nhật thông tin.', 'error');
    }
  };

  const renderAvatar = () => {
  const avatarUrl = getAvatarUrl(user?.avatar);
  
  if (avatarUrl) {
    return (
      <img 
        src={avatarUrl} 
        alt="Avatar" 
        className="w-full h-full object-cover transition-opacity duration-300"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-white text-indigo-600 text-5xl font-bold uppercase">
      {fullName ? fullName.charAt(0) : 'U'}
    </div>
  );
};

  if (loading) return <LoadingSpinner />;

  return (
    <div className="h-[calc(100vh-80px)] w-full bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
      
      {alertModal.isOpen && (
         <CustomModal 
           isOpen={alertModal.isOpen}
           type={alertModal.type}
           title={alertModal.title}
           message={alertModal.message}
           onClose={() => setAlertModal({ ...alertModal, isOpen: false })} 
         />
      )}

      <ChangePasswordModal 
        isOpen={isPassModalOpen} 
        onClose={() => setIsPassModalOpen(false)} 
      />
      
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto max-h-[90vh] animate-fade-in">
        
        {/* CỘT TRÁI */}
        <div className="md:w-2/5 bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-8 text-white relative">
          <div className="relative group cursor-pointer mb-6">
            <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl relative bg-indigo-500">
              {renderAvatar()}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <label className={`absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isUploadingAvatar ? 'pointer-events-none' : ''}`}>
              <span className="text-white font-medium text-sm flex items-center gap-1">
                <Camera size={20} /> Đổi ảnh
              </span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploadingAvatar} />
            </label>
          </div>

          <h2 className="text-2xl font-bold mb-1 text-center">{user?.full_name || "Chưa cập nhật tên"}</h2>
          <p className="text-indigo-200 text-sm mb-6 flex items-center gap-1">
             <Mail size={14}/> {user?.email}
          </p>

          <div className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm border border-white/10 capitalize">
            {user?.role === 'TEACHER' ? 'Giảng viên' : 'Học viên'}
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="md:w-3/5 p-10 flex flex-col justify-center bg-white overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <User className="text-indigo-600"/> Hồ sơ cá nhân
            </h1>
            <p className="text-gray-500 text-sm mt-1">Quản lý thông tin tài khoản và thiết lập bảo mật.</p>
          </div>

          <form onSubmit={handleUpdateInfo} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên hiển thị</label>
              <input 
                type="text" required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ tên của bạn"
              />
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Mật khẩu</h3>
                  <p className="text-gray-500 text-xs">Cập nhật mật khẩu định kỳ để bảo mật</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsPassModalOpen(true)}
                className="px-4 py-2 bg-white text-indigo-700 text-sm font-bold rounded-lg border border-gray-200 shadow-sm hover:bg-indigo-50 transition-all flex items-center gap-2"
              >
                <Lock size={16} /> Thay đổi
              </button>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Cập nhật hồ sơ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;