import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Link } from 'react-router-dom';

function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axiosClient.get('/api/me/enrollments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEnrollments(response.data);
      } catch (err) {
        console.error("Lỗi tải khóa học của tôi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="container p-8 mx-auto">
      <h1 className="text-3xl font-bold mb-8">Khóa học của tôi</h1>

      {enrollments.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">Bạn chưa đăng ký khóa học nào.</p>
          <Link to="/" className="text-indigo-600 hover:underline font-medium">
            Khám phá các khóa học ngay &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((item) => (
            <div key={item.course_id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded uppercase">
                    {item.code}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase
                    ${item.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                      item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {item.status === 'APPROVED' ? 'Đang học' : 
                     item.status === 'PENDING' ? 'Chờ duyệt' : 'Bị từ chối'}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
              </div>

              <div className="p-4 bg-gray-50 border-t">
                {item.status === 'APPROVED' ? (
                  <Link 
                    to={`/course/${item.course_id}/learn`}
                    className="block w-full text-center py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
                  >
                    Vào học ngay
                  </Link>
                ) : (
                  <button disabled className="block w-full text-center py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed">
                    Chưa thể truy cập
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyCoursesPage;