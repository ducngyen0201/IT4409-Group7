import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Mail, Lock, RefreshCw, ArrowLeft } from 'lucide-react';

function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // Bước 1: Nhập email, Bước 2: Nhập pass mới
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Bước 1: Kiểm tra xem email có tồn tại không
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axiosClient.post('/api/auth/forgot-password-check', { email });
      if (res.data.exists) {
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Email không tồn tại trong hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Cập nhật mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp.');
    }
    setError('');
    setLoading(true);
    try {
      await axiosClient.post('/api/auth/reset-password-quick', { email, newPassword });
      alert('Đổi mật khẩu thành công! Hãy đăng nhập lại.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full mb-4">
            <RefreshCw size={32} className={loading ? 'animate-spin' : ''} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {step === 1 ? 'Quên mật khẩu?' : 'Đặt lại mật khẩu'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {step === 1 ? 'Nhập email để xác minh tài khoản' : 'Nhập mật khẩu mới cho tài khoản của bạn'}
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg animate-bounce">
            ⚠️ {error}
          </div>
        )}

        {step === 1 ? (
          <form className="space-y-6" onSubmit={handleCheckEmail}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email tài khoản</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:bg-gray-400"
            >
              {loading ? 'Đang kiểm tra...' : 'Tiếp tục'}
            </button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all active:scale-95"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-indigo-600 flex items-center justify-center gap-1">
            <ArrowLeft size={16} /> Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;