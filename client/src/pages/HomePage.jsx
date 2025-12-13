import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle } from 'lucide-react';

function HomePage() {
  const { user } = useContext(AuthContext); 
  const navigate = useNavigate(); 

  // --- STATES DÙNG CHUNG (cho Public/Teacher) ---
  const [courses, setCourses] = useState([]); 
  const [loading, setLoading] = useState(true);

  // --- STATES DÙNG RIÊNG CHO HỌC VIÊN ---
  const [myCourses, setMyCourses] = useState([]);
  const [loadingMyCourses, setLoadingMyCourses] = useState(false);
  
  const isTeacher = user && user.role === 'TEACHER';
  const isStudent = user && user.role === 'STUDENT';

  // --- LOGIC TẢI DỮ LIỆU ---
  
  // API lấy khóa học Public
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/api/courses/public');
      setCourses(res.data);
    } catch (err) {
      console.error("Lỗi tải khóa học công khai:", err);
    } finally {
      setLoading(false);
    }
  };

  // API lấy khóa học Của tôi (cho Học viên)
  const fetchMyCourses = async () => {
    try {
      setLoadingMyCourses(true);
      const token = sessionStorage.getItem('token');
      const res = await axiosClient.get('/api/me/enrollments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyCourses(res.data);
    } catch (err) {
      console.error("Lỗi tải khóa học của tôi:", err);
    } finally {
      setLoadingMyCourses(false);
    }
  };

  // API lấy khóa học của Giáo viên (Sử dụng logic từ TeacherDashboard: /api/me/teaching)
  const fetchTeacherCourses = async () => {
    try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        const response = await axiosClient.get('/api/me/teaching', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(response.data); // Lưu vào state 'courses' chung
    } catch (err) {
        console.error('Lỗi tải khóa học của giáo viên:', err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (isTeacher) {
        fetchTeacherCourses();
    } else {
        fetchCourses(); 
        if (isStudent) {
            fetchMyCourses(); 
        }
    }
  }, [user]);
  
  if (loading) return <LoadingSpinner />;

  // --- NỘI DUNG DÀNH CHO GIÁO VIÊN (HIỂN THỊ DẠNG CourseCard + Status) ---
  if (isTeacher) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Trang Quản lý Khóa học của Bạn</h1>
        
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-semibold text-indigo-700">Các Khóa học Tôi Quản lý ({courses.length})</h2>
          <button 
              onClick={() => navigate('/manage/courses/create')} 
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
              <PlusCircle size={20} /> Tạo Khóa học Mới
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-100">
            <p className="text-lg text-gray-500 mb-4">Bạn chưa có khóa học nào. Hãy bắt đầu tạo khóa học đầu tiên!</p>
            <button 
                onClick={() => navigate('/manage/courses/create')} 
                className="flex items-center gap-2 mx-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-md"
            >
                <PlusCircle size={20} /> Tạo Khóa học Ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                isTeacherView={true}
              /> 
            ))}
          </div>
        )}
      </div>
    );
  }


  // --- NỘI DUNG DÀNH CHO HỌC VIÊN/KHÁCH (FALLBACK) ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto px-4 py-8 space-y-12">
        
        {/* --- 1. KHÓA HỌC CỦA TÔI (Chỉ hiện khi là HỌC VIÊN) --- */}
        {isStudent && (
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
                        thumbnail: enrollment.thumbnail, 
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