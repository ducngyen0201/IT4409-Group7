import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';

function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axiosClient.get('/api/me/teaching', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(response.data);
      } catch (err) {
        console.error('Lỗi tải khóa học:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container p-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý khóa học</h1>
        {/* Nút tạo khóa học mới (Chúng ta sẽ làm trang CreateCourse sau) */}
        <Link 
          to="/manage/courses/create" 
          className="px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700"
        >
          + Tạo khóa học
        </Link>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-sm text-gray-700 uppercase bg-gray-100">
              <th className="p-4 border-b">Mã</th>
              <th className="p-4 border-b">Tên khóa học</th>
              <th className="p-4 border-b">Trạng thái</th>
              <th className="p-4 border-b">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {courses.length > 0 ? (
              courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="p-4 border-b">{course.code}</td>
                  <td className="p-4 border-b font-medium">{course.title}</td>
                  <td className="p-4 border-b">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                      ${course.status === 'APPROVED' ? 'text-green-800 bg-green-100' : 
                        course.status === 'DRAFT' ? 'text-gray-800 bg-gray-200' : 
                        'text-yellow-800 bg-yellow-100'}`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="p-4 border-b">
                    <Link 
                      to={`/manage/courses/${course.id}`} 
                      className="text-indigo-600 hover:underline"
                    >
                      Chỉnh sửa
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  Bạn chưa có khóa học nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeacherDashboard;