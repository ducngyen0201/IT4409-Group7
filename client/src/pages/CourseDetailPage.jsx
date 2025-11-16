import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function CourseDetailPage() {
  const { id } = useParams(); // Lấy ID khóa học từ URL
  const [course, setCourse] = useState(null); // Lưu thông tin khóa học
  const [lectures, setLectures] = useState([]); // Lưu danh sách bài giảng
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 2. Gọi API khi trang được tải (hoặc khi 'id' thay đổi)
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Gọi API chi tiết khóa học (Backend)
        const response = await axios.get(`http://localhost:5000/api/courses/${id}`);
        
        setCourse(response.data.course);
        setLectures(response.data.lectures);

      } catch (err) {
        console.error("Lỗi khi fetch chi tiết khóa học:", err);
        setError('Không thể tải chi tiết khóa học.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id]);

  // 3. Xử lý các trạng thái
  if (loading) {
    return <div className="p-8 text-center">Đang tải chi tiết khóa học...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  if (!course) {
    return <div className="p-8 text-center">Không tìm thấy khóa học.</div>;
  }

  // 4. Hiển thị nội dung
  return (
    <div className="container p-8 mx-auto">
      {/* Nút quay lại trang chủ */}
      <Link to="/" className="mb-4 text-indigo-600 hover:underline">
        &larr; Quay lại danh sách
      </Link>

      {/* Thông tin khóa học */}
      <h1 className="mb-2 text-4xl font-bold">{course.title}</h1>
      <span className="inline-block px-3 py-1 mb-4 text-sm font-semibold tracking-wide text-indigo-600 uppercase bg-indigo-100 rounded-full">
        {course.code}
      </span>
      <p className="mb-8 text-lg text-gray-700">{course.description}</p>

      {/* Danh sách bài giảng (Lectures) */}
      <h2 className="mb-4 text-2xl font-semibold">Nội dung bài giảng</h2>
      <div className="space-y-3">
        {lectures.length > 0 ? (
          lectures.map((lecture) => (
            <div 
              key={lecture.id} 
              className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              {/* Chúng ta sẽ link đến trang xem bài giảng sau */}
              <h3 className="text-lg font-medium">{lecture.title}</h3>
            </div>
          ))
        ) : (
          <p>Khóa học này chưa có bài giảng nào.</p>
        )}
      </div>
    </div>
  );
}

export default CourseDetailPage;