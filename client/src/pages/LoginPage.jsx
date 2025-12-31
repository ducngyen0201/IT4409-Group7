import React, { useState, useContext } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom'; // Thêm Link
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, LogIn } from 'lucide-react'; // Thêm icons

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Thêm trạng thái loading
  const { login } = useContext(AuthContext);
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
      const response = await axiosClient.post('/api/auth/login', formData);
      
      // Lưu token và user vào Context/Session
      login(response.data.token, response.data.user);

      // Chuyển hướng về trang chủ
      navigate('/');
    } catch (err) {
      console.error('Lỗi đăng nhập:', err.response?.data?.error);
      setError(err.response?.data?.error || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        
        {/* Tiêu đề */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full mb-4">
            <LogIn size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Chào mừng trở lại</h2>
          <p className="mt-2 text-sm text-gray-500">Đăng nhập để tiếp tục hành trình học tập</p>
        </div>

        {/* Hiển thị lỗi */}
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Trường Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email của bạn
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail size={18} />
              </span>
              <input
                name="email"
                type="email"
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Trường Password */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-semibold text-gray-700">Mật khẩu</label>
              <Link to="/forgot-password" size={18} className="text-xs text-indigo-600 hover:underline font-medium">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock size={18} />
              </span>
              <input
                name="password"
                type="password"
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Nút Đăng nhập */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
            </button>
          </div>

          {/* Link chuyển sang đăng ký */}
          <p className="text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-indigo-600 font-bold hover:underline transition">
              Đăng ký miễn phí
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;