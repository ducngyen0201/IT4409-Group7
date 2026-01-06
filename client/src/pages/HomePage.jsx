import React, { useState, useEffect, useContext, useMemo } from 'react'; // Thêm useMemo
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, LayoutDashboard, Flame, GraduationCap, Search, X } from 'lucide-react'; // Thêm Search, X

function HomePage() {
  const { user } = useContext(AuthContext); 
  const navigate = useNavigate(); 

  const [courses, setCourses] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState([]);
  const [loadingMyCourses, setLoadingMyCourses] = useState(false);
  
  // 1. Logic tìm kiếm: State lưu từ khóa
  const [searchTerm, setSearchTerm] = useState('');

  const isTeacher = user && user.role === 'TEACHER';
  const isStudent = user && user.role === 'STUDENT';

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

  // 2. Logic lọc khóa học: Sử dụng useMemo để tối ưu hiệu năng
  const filteredCourses = useMemo(() => {
    return courses.filter(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, searchTerm]);

  const filteredMyCourses = useMemo(() => {
    return myCourses.filter(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [myCourses, searchTerm]);

  // 3. Component Thanh tìm kiếm (UI)
  const SearchBar = (
    <div className="relative max-w-2xl mx-auto mb-10 group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
        <Search size={20} />
      </div>
      <input
        type="text"
        placeholder="Tìm kiếm khóa học..."
        className="block w-full pl-11 pr-12 py-4 bg-white border border-gray-200 rounded-2xl leading-5 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <button 
          onClick={() => setSearchTerm('')}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );

  if (loading) return <LoadingSpinner />;

  // --- VIEW DÀNH CHO GIÁO VIÊN ---
  if (isTeacher) {
    return (
      <div className="container mx-auto p-8 max-w-7xl animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <LayoutDashboard className="text-indigo-600" size={32} /> Quản lý bài giảng
            </h1>
            <p className="text-gray-500 mt-1">Chào mừng trở lại, {user.full_name}.</p>
          </div>
          <button 
              onClick={() => navigate('/manage/courses/create')} 
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 active:scale-95"
          >
              <PlusCircle size={20} /> Tạo Khóa học Mới
          </button>
        </div>

        {SearchBar}

        {filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
            <p className="text-lg text-gray-400">Không tìm thấy khóa học nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} isTeacherView={true} /> 
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- VIEW DÀNH CHO HỌC VIÊN & KHÁCH ---
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container mx-auto px-4 py-10 space-y-12 max-w-7xl animate-in fade-in duration-500">
        
        {/* Banner hoặc Tiêu đề chào mừng */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Học tập không giới hạn</h1>
          <p className="text-gray-500 font-medium">Khám phá hàng ngàn khóa học từ những chuyên gia hàng đầu</p>
        </div>

        {/* Thanh tìm kiếm */}
        {SearchBar}

        {/* 1. KHÓA HỌC ĐANG HỌC */}
        {isStudent && myCourses.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                  <GraduationCap className="text-indigo-600" size={28} /> Khóa học của tôi
                </h2>
              </div>
            </div>

            {loadingMyCourses ? (
              <div className="flex justify-center py-10"><LoadingSpinner /></div>
            ) : filteredMyCourses.length === 0 ? (
              <p className="text-gray-400 italic">Không tìm thấy khóa học nào trong danh sách đang học.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredMyCourses.slice(0, 4).map(enrollment => (
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
        <div id="public-courses" className="space-y-6 pt-10">
          <div className="flex justify-between items-end border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                <Flame className="text-orange-500" size={28} /> Khám phá khóa học
              </h2>
            </div>
          </div>

          {filteredCourses.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
               <p className="text-gray-400 italic">Không tìm thấy kết quả phù hợp với từ khóa của bạn.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredCourses.map(course => (
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