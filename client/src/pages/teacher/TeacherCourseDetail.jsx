import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import LectureManager from '../../components/teacher/LectureManager';
import

function TeacherCourseDetail() {
  const { id } = useParams(); // Lấy ID khóa học từ URL
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State cho form chỉnh sửa
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_enrollment_open: false
  });

  // Load dữ liệu khóa học
  const fetchCourse = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      // Gọi API lấy chi tiết (Backend: GET /api/courses/:id)
      const response = await axios.get(`http://localhost:5000/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const courseData = response.data.course;
      setCourse(courseData);
      
      // Đổ dữ liệu vào form
      setFormData({
        title: courseData.title,
        description: courseData.description,
        is_enrollment_open: courseData.is_enrollment_open
      });

    } catch (err) {
      console.error("Lỗi tải khóa học:", err);
      alert("Không thể tải thông tin khóa học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  // Xử lý cập nhật thông tin (PATCH)
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/courses/${id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Cập nhật thành công!');
      fetchCourse(); // Tải lại dữ liệu mới nhất
    } catch (err) {
      console.error(err);
      alert('Lỗi cập nhật.');
    }
  };

  // Xử lý gửi yêu cầu duyệt (Request Review)
  const handleRequestReview = async () => {
    if (!window.confirm("Bạn có chắc muốn gửi yêu cầu duyệt? Khóa học sẽ chuyển sang trạng thái CHỜ DUYỆT.")) return;
    
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/courses/${id}/request-review`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Đã gửi yêu cầu duyệt!');
      fetchCourse();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Lỗi khi gửi yêu cầu.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!course) return <div className="p-8">Không tìm thấy khóa học.</div>;

  return (
    <div className="container p-8 mx-auto">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-500">Mã: {course.code}</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 text-sm font-bold rounded-full 
            ${course.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {course.status}
          </span>
          
          {/* Nút gửi duyệt (Chỉ hiện khi DRAFT) */}
          {course.status === 'DRAFT' && (
            <button 
              onClick={handleRequestReview}
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Gửi duyệt
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* --- CỘT TRÁI: THÔNG TIN CHUNG --- */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white rounded shadow">
            <h2 className="mb-4 text-xl font-bold text-gray-800">Thông tin chung</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">Tên khóa học</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:ring-indigo-500"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  rows="4"
                  className="w-full px-3 py-2 border rounded focus:ring-indigo-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_enrollment_open}
                    onChange={(e) => setFormData({...formData, is_enrollment_open: e.target.checked})}
                  />
                  <span className="text-sm text-gray-700">Đang mở ghi danh</span>
                </label>
              </div>
              <button 
                type="submit"
                className="w-full px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700"
              >
                Lưu thay đổi
              </button>
            </form>
          </div>
        </div>

        {/* --- CỘT PHẢI: QUẢN LÝ BÀI GIẢNG --- */}
        <div className="lg:col-span-2">
          <div className="p-6 bg-white rounded shadow">
            <h2 className="mb-6 text-xl font-bold text-gray-800">Nội dung khóa học</h2>
            
            {/* TRUYỀN ID KHÓA HỌC VÀO COMPONENT */}
            <LectureManager courseId={id} />
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherCourseDetail;