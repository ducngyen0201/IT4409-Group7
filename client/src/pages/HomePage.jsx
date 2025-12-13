import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

function HomePage() {
  const { user } = useContext(AuthContext); 
  
  // State cho khóa học công khai
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho khóa học của tôi
  const [myCourses, setMyCourses] = useState([]);
  const [loadingMyCourses, setLoadingMyCourses] = useState(false);

  // API lấy khóa học Public
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/api/courses/public');
      setCourses(res.data);
    } catch (err) {
      console.error("Lỗi tải trang chủ:", err);
    } finally {
      setLoading(false);
    }
  };

  // API lấy khóa học Của tôi
  const fetchMyCourses = async () => {
    try {
      setLoadingMyCourses(true);
      const res = await axiosClient.get('/api/me/enrollments');
      console.log("Dữ liệu khóa học của tôi:", res.data);
      setMyCourses(res.data);
    } catch (err) {
      console.error("Lỗi tải khóa học của tôi:", err);
    } finally {
      setLoadingMyCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses(); // Luôn chạy cái này
    if (user) {
      fetchMyCourses(); // Nếu đã login thì lấy thêm khóa học của tôi
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Container chính */}
      <div className="container mx-auto px-4 py-8 space-y-12">
        
        {/* --- 1. KHÓA HỌC CỦA TÔI (Chỉ hiện khi đã đăng nhập) --- */}
        {user && (
          <div className="animate-fade-in">
             <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    🎓 Khóa học của tôi
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Xin chào <span className="font-semibold text-indigo-600">{user.full_name}</span>, tiếp tục học nào!</p>
                </div>
                <Link to="/my-courses" className="text-indigo-600 text-sm font-medium hover:underline hover:text-indigo-800 transition">
                  Đến trang học tập &rarr;
                </Link>
             </div>

             {loadingMyCourses ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
             ) : myCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {myCourses.slice(0, 4).map(enrollment => (
                    <CourseCard 
                      key={enrollment.course_id} 
                      course={{
                        id: enrollment.course_id,
                        title: enrollment.title,
                        description: enrollment.description,
                        thumbnail: enrollment.thumbnail || "https://via.placeholder.com/300x200?text=No+Image", 
                        price: 0,
                        instructor_name: "Giảng viên",
                      }} 
                      isEnrolled={true} 
                    />
                  ))}
                </div>
             ) : (
                <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-300 shadow-sm">
                  <p className="text-gray-500 mb-4">Bạn chưa đăng ký khóa học nào.</p>
                </div>
             )}
          </div>
        )}

        {/* --- 2. TẤT CẢ KHÓA HỌC (PUBLIC) --- */}
        <div id="public-courses">
          <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                🔥 Khóa học nổi bật
              </h2>
              <p className="text-sm text-gray-500 mt-1">Khám phá các kiến thức mới nhất</p>
            </div>
            <Link to="/all-courses" className="text-indigo-600 text-sm font-medium hover:underline hover:text-indigo-800 transition hidden md:block">
              Xem tất cả &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="py-20"><LoadingSpinner /></div>
          ) : courses.length === 0 ? (
             <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-500">Chưa có khóa học nào được xuất bản.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default HomePage;