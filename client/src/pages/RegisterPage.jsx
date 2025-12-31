import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, GraduationCap, School } from 'lucide-react'; // Thêm icon cho đẹp

function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'STUDENT', // Giá trị mặc định là Học viên
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Gửi formData bao gồm cả trường role lên Backend
      const response = await axiosClient.post('/api/auth/register', formData);
      console.log('Đăng ký thành công:', response.data);
      alert("Đăng ký thành công!");
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Tạo tài khoản</h2>
          <p className="mt-2 text-sm text-gray-500">Tham gia cộng đồng học tập ngay hôm nay</p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg animate-pulse">
            ⚠️ {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Họ và tên */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <User size={18} />
              </span>
              <input
                name="full_name"
                type="text"
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Nguyễn Văn A"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail size={18} />
              </span>
              <input
                name="email"
                type="email"
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock size={18} />
              </span>
              <input
                name="password"
                type="password"
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* CHỌN ROLE (VAI TRÒ) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bạn đăng ký với tư cách?</label>
            <div className="grid grid-cols-2 gap-4">
              {/* Lựa chọn Student */}
              <label 
                className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.role === 'STUDENT' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-gray-200 text-gray-500 hover:border-indigo-200'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="STUDENT"
                  className="hidden"
                  checked={formData.role === 'STUDENT'}
                  onChange={handleChange}
                />
                <div className="flex flex-col items-center gap-1">
                  <GraduationCap size={24} />
                  <span className="text-xs font-bold">Học viên</span>
                </div>
              </label>

              {/* Lựa chọn Teacher */}
              <label 
                className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.role === 'TEACHER' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-gray-200 text-gray-500 hover:border-indigo-200'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="TEACHER"
                  className="hidden"
                  checked={formData.role === 'TEACHER'}
                  onChange={handleChange}
                />
                <div className="flex flex-col items-center gap-1">
                  <School size={24} />
                  <span className="text-xs font-bold">Giảng viên</span>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all active:scale-95 disabled:bg-gray-400"
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Đã có tài khoản? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;