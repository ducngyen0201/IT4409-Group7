import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function CreateCoursePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = sessionStorage.getItem('token');
      
      // Gọi API tạo khóa học
      // (Backend: POST /api/courses)
      await axios.post(
        'http://localhost:5000/api/courses',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('Tạo khóa học thành công!');
      // Chuyển hướng về trang danh sách
      navigate('/teacher/courses');

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi tạo khóa học.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container p-8 mx-auto">
      <div className="max-w-2xl mx-auto bg-white rounded shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Tạo khóa học mới</h2>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Mã khóa học */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-bold text-gray-700">
                Mã khóa học (Code)
              </label>
              <input
                type="text"
                name="code"
                placeholder="VD: REACT-01"
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-indigo-300"
                value={formData.code}
                onChange={handleChange}
              />
            </div>

            {/* Tiêu đề */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-bold text-gray-700">
                Tên khóa học
              </label>
              <input
                type="text"
                name="title"
                placeholder="VD: Lập trình ReactJS cơ bản"
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-indigo-300"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            {/* Mô tả */}
            <div className="mb-6">
              <label className="block mb-2 text-sm font-bold text-gray-700">
                Mô tả
              </label>
              <textarea
                name="description"
                rows="4"
                placeholder="Mô tả nội dung khóa học..."
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-indigo-300"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <Link 
                to="/teacher/courses"
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Đang tạo...' : 'Tạo khóa học'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateCoursePage;