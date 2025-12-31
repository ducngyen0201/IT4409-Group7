import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, LayoutDashboard, Flame, GraduationCap } from 'lucide-react'; // Thêm icon

function HomePage() {
  const { user } = useContext(AuthContext); 
  const navigate = useNavigate(); 

  const [courses, setCourses] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState([]);
  const [loadingMyCourses, setLoadingMyCourses] = useState(false);
  
  const isTeacher = user && user.role === 'TEACHER';
  const isStudent = user && user.role === 'STUDENT';

  // 1. Tải khóa học công khai (Cho khách và học viên)
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

  // 2. Tải khóa học đang học (Cho học viên)
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

  // 3. Tải khóa học đang giảng dạy (Cho giáo viên)
  const fetchTeacherCourses = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axiosClient.get('/api/me/teaching', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data); 
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
      if (isStudent) fetchMyCourses(); 
    }
  }, [user]);
  
  if (loading) return <LoadingSpinner />;

  // --- VIEW DÀNH CHO GIÁO VIÊN ---
  if (isTeacher) {
    return (
      <div className="container mx-auto p-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <LayoutDashboard className="text-indigo-600" size={32} /> Quản lý bài giảng
            </h1>
            <p className="text-gray-500 mt-1">Chào mừng trở lại, {user.full_name}. Chúc bạn một ngày dạy tốt!</p>
          </div>
          <button 
              onClick={() => navigate('/manage/courses/create')} 
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 active:scale-95"
          >
              <PlusCircle size={20} /> Tạo Khóa học Mới
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
            <p className="text-lg text-gray-400 mb-6">Bạn chưa có khóa học nào trên hệ thống.</p>
            <button onClick={() => navigate('/manage/courses/create')} className="text-indigo-600 font-bold underline">Bắt đầu tạo ngay &rarr;</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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

  // --- VIEW DÀNH CHO HỌC VIÊN & KHÁCH ---
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container mx-auto px-4 py-10 space-y-16 max-w-7xl">
        
        {/* 1. KHÓA HỌC ĐANG HỌC */}
        {isStudent && myCourses.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                  <GraduationCap className="text-indigo-600" size={28} /> Khóa học của tôi
                </h2>
                <p className="text-sm text-gray-400 font-medium">Bạn đã đăng ký {myCourses.length} khóa học</p>
              </div>
              <Link to="/my-courses" className="text-indigo-600 text-sm font-bold hover:underline transition">
                Tất cả khóa của tôi &rarr;
              </Link>
            </div>

            {loadingMyCourses ? (
              <div className="flex justify-center py-10"><LoadingSpinner /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {myCourses.slice(0, 4).map(enrollment => (
                  <CourseCard 
                    key={enrollment.course_id} 
                    course={{
                      id: enrollment.course_id,
                      title: enrollment.title,
                      description: enrollment.description,
                      thumbnail: enrollment.thumbnail, 
                      price: enrollment.price || 0,
                      instructor_name: enrollment.instructor_name || "Giảng viên",
                    }} 
                    isEnrolled={true} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. KHÁM PHÁ KHÓA HỌC MỚI */}
        <div id="public-courses" className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                <Flame className="text-orange-500" size={28} /> Khóa học nổi bật
              </h2>
              <p className="text-sm text-gray-400 font-medium">Những kiến thức mới nhất từ chuyên gia</p>
            </div>
            <Link to="/all-courses" className="text-indigo-600 text-sm font-bold hover:underline transition">
              Khám phá tất cả &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : courses.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
               <p className="text-gray-400 italic">Hiện chưa có khóa học mới nào được xuất bản.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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