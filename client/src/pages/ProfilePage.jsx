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

    if (file.size > 5 * 1024 * 1024) {
      showAlert('Lỗi', 'Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setIsUploadingAvatar(true);
      const res = await axiosClient.patch('/api/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(prev => ({ ...prev, avatar: res.data.avatar }));
      showAlert('Thành công', 'Đã cập nhật ảnh đại diện!', 'success');
      e.target.value = null; 
    } catch (err) {
      console.error(err);
      showAlert('Lỗi', 'Không thể upload ảnh.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
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
    if (user?.avatar) {
        return <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover transition-opacity duration-300" />;
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
      
      {/* THẺ CARD CHÍNH: Chia đôi Layout (Trái - Phải) */}
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto max-h-[90vh]">
        
        {/* === CỘT TRÁI: AVATAR & INFO (MÀU NỀN GRADIENT) === */}
        <div className="md:w-2/5 bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-8 text-white relative">
          
          {/* Avatar Container */}
          <div className="relative group cursor-pointer mb-6">
            <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl relative">
              {renderAvatar()}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            
            {/* Nút Upload ẩn */}
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
            {user?.role === 'teacher' ? 'Giáo viên' : 'Học viên'}
          </div>

          {/* Trang trí nền */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        {/* === CỘT PHẢI: FORM CHỈNH SỬA (MÀU TRẮNG) === */}
        <div className="md:w-3/5 p-8 flex flex-col justify-center bg-white overflow-y-auto">
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <User className="text-indigo-600"/> Chỉnh sửa hồ sơ
            </h1>
            <p className="text-gray-500 text-sm mt-1">Cập nhật thông tin cá nhân và bảo mật.</p>
          </div>

          <form onSubmit={handleUpdateInfo} className="space-y-6">
            
            {/* Input Tên */}
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

            {/* Khu vực Bảo mật */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:border-indigo-200 transition-colors flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Mật khẩu</h3>
                  <p className="text-gray-500 text-xs">Bảo mật tài khoản của bạn</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsPassModalOpen(true)}
                className="px-4 py-2 bg-white text-indigo-700 text-sm font-bold rounded-lg border border-gray-200 shadow-sm hover:bg-indigo-50 transition-all flex items-center gap-2"
              >
                <Lock size={16} /> Đổi mật khẩu
              </button>
            </div>

            {/* Nút Lưu (Full width) */}
            <button 
              type="submit" 
              className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Lưu thay đổi
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;