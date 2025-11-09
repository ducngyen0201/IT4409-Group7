// file: client/src/pages/RegisterPage.jsx
import React, { useState } from 'react'; // <-- 1. Import useState
import axios from 'axios'; // <-- 2. Import axios
import { useNavigate } from 'react-router-dom'; // <-- 3. Import useNavigate (để chuyển trang)

function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(''); // Để lưu thông báo lỗi
  const navigate = useNavigate(); // Khởi tạo hook chuyển trang

  // Hàm này chạy mỗi khi người dùng gõ chữ
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Hàm này chạy khi người dùng nhấn nút "Đăng ký"
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn form tải lại trang
    setError(''); // Xóa lỗi cũ

    try {
      // 4. Gọi API backend (chạy trên cổng 5000)
      const response = await axios.post(
        'http://localhost:5000/api/auth/register', 
        formData
      );

      // 5. Nếu thành công:
      console.log(response.data); // In ra log
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login'); // Chuyển hướng sang trang Đăng nhập

    } catch (err) {
      // 6. Nếu thất bại (ví dụ: email đã tồn tại)
      console.error('Lỗi đăng ký:', err.response.data.error);
      setError(err.response.data.error || 'Đã có lỗi xảy ra.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Tạo tài khoản mới
        </h2>

        {/* 7. Hiển thị lỗi (nếu có) */}
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">
            {error}
          </div>
        )}

        {/* 8. Kết nối form với state và hàm handleSubmit */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Trường Full Name */}
          <div>
            <label 
              htmlFor="full_name" 
              className="block text-sm font-medium text-gray-700"
            >
              Họ và tên
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.full_name} // <-- Kết nối state
              onChange={handleChange} // <-- Kết nối hàm
            />
          </div>

          {/* Trường Email */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.email} // <-- Kết nối state
              onChange={handleChange} // <-- Kết nối hàm
            />
          </div>

          {/* Trường Password */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.password} // <-- Kết nối state
              onChange={handleChange} // <-- Kết nối hàm
            />
          </div>

          {/* Nút Submit */}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Đăng ký
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;