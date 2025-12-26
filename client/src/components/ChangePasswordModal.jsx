import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { X, Eye, EyeOff, Lock } from 'lucide-react';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State để quản lý việc ẩn/hiện mật khẩu cho từng ô
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Reset form khi mở/đóng modal
  useEffect(() => {
    if (isOpen) {
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: '', text: '' });
      setShowPass({ current: false, new: false, confirm: false });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const toggleShow = (field) => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate Client-side
    if (passwords.newPassword.length < 6) {
      return setMessage({ type: 'error', text: 'Mật khẩu mới phải từ 6 ký tự trở lên!' });
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      return setMessage({ type: 'error', text: 'Xác nhận mật khẩu không khớp!' });
    }

    try {
      setIsLoading(true);

      // Gọi API: axiosClient tự động xử lý Token trong header
      await axiosClient.patch('/api/me/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      
      // Đóng modal sau 1.5s
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Lỗi kết nối server';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm render input để code gọn hơn
  const renderPasswordInput = (label, name, showKey, placeholder) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-2.5 text-gray-400">
          <Lock size={18} />
        </div>
        <input 
          type={showPass[showKey] ? "text" : "password"} 
          name={name}
          value={passwords[name]} 
          onChange={handleChange} 
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          required 
        />
        <button 
          type="button"
          onClick={() => toggleShow(showKey)}
          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          {showPass[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fadeIn">
      
      {/* Modal */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            🔐 Đổi mật khẩu
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition bg-white rounded-full p-1 hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Alert Message */}
          {message.text && (
            <div className={`mb-5 p-3 text-sm rounded-lg flex items-center justify-center font-medium ${
              message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {renderPasswordInput("Mật khẩu hiện tại", "currentPassword", "current", "Nhập mật khẩu cũ")}
            {renderPasswordInput("Mật khẩu mới", "newPassword", "new", "Nhập mật khẩu mới (min 6 ký tự)")}
            {renderPasswordInput("Xác nhận mật khẩu", "confirmPassword", "confirm", "Nhập lại mật khẩu mới")}

            <div className="flex justify-end gap-3 mt-8 pt-2">
              <button 
                type="button" 
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg disabled:bg-blue-400 flex items-center gap-2"
              >
                {isLoading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
                {isLoading ? 'Đang xử lý...' : 'Lưu thay đổi'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;