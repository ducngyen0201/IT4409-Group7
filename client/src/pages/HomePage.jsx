import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';

function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 2. Gọi API khi trang được tải
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError('');
        // Gọi API (chỉ lấy các khóa học 'APPROVED')
        const response = await axios.get('http://localhost:5000/api/courses');
        setCourses(response.data);
      } catch (err) {
        console.error("Lỗi khi fetch khóa học:", err);
        setError('Không thể tải danh sách khóa học.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []); // Mảng rỗng [] nghĩa là chỉ chạy 1 lần khi mount

  // 3. Xử lý các trạng thái
  if (loading) return <LoadingSpinner />;
  
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container p-8 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">Danh sách khóa học</h1>

      {/* 4. Hiển thị danh sách khóa học */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.length > 0 ? (
          courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))
        ) : (
          <p>Không có khóa học nào đã được duyệt.</p>
        )}
      </div>
    </div>
  );
}

export default HomePage;