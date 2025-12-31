import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { Settings, PlayCircle, Lock, BookOpen } from 'lucide-react';

function CourseDetailPage() {
  const { id: courseId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Lấy thông tin khóa học & bài giảng bằng courseId
        const courseRes = await axiosClient.get(`/api/courses/${courseId}`, { headers });
        setCourse(courseRes.data.course);
        setLectures(courseRes.data.lectures);

        if (user) {
          // 2. Nếu là TEACHER, kiểm tra quyền giảng viên bằng courseId
          if (user.role === 'TEACHER') {
            try {
              const checkInsRes = await axiosClient.get(`/api/courses/${courseId}/check-instructor`, { headers });
              setIsInstructor(checkInsRes.data.isInstructor);
            } catch (err) {
              console.error("Lỗi kiểm tra quyền giảng viên:", err);
            }
          }

          // 3. Nếu là STUDENT, kiểm tra trạng thái đăng ký dựa trên courseId
          if (user.role === 'STUDENT') {
            const enrollRes = await axiosClient.get('/api/me/enrollments', { headers });
            const myEnrollment = enrollRes.data.find(e => String(e.course_id) === String(courseId));
            if (myEnrollment) {
              setEnrollmentStatus(myEnrollment.status);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, user]);

  // Xử lý Đăng ký học (Dành cho Student)
  const handleEnroll = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để đăng ký.");
      navigate('/login');
      return;
    }
    try {
      const token = sessionStorage.getItem('token');
      await axiosClient.post(`/api/courses/${courseId}/enroll`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      alert("Đăng ký thành công! Vui lòng chờ giáo viên duyệt.");
      setEnrollmentStatus('PENDING');
    } catch (err) {
      alert(err.response?.data?.error || "Lỗi đăng ký.");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!course) return <div className="p-8 text-center">Không tìm thấy khóa học.</div>;

  const canAccessContent = isInstructor || enrollmentStatus === 'APPROVED';

  return (
    <div className="container p-8 mx-auto max-w-6xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
             <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase">
               {course.category || 'Công nghệ'}
             </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">{course.title}</h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">{course.description}</p>
        </div>

        {/* NÚT HÀNH ĐỘNG */}
        <div className="flex flex-col gap-3 min-w-[200px]">
          {isInstructor ? (
            <>
              <button 
                onClick={() => navigate(`/course/${courseId}/learn`)}
                className="flex items-center justify-center gap-2 px-6 py-3 text-white bg-indigo-600 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
              >
                <PlayCircle size={20} /> VÀO LỚP HỌC
              </button>
              <button 
                onClick={() => navigate(`/manage/courses/${courseId}`)}
                className="flex items-center justify-center gap-2 px-6 py-3 text-indigo-600 bg-white border-2 border-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all"
              >
                <Settings size={20} /> QUẢN LÝ KHÓA HỌC
              </button>
            </>
          ) : enrollmentStatus === 'APPROVED' ? (
            <Link 
              to={`/course/${courseId}/learn`}
              className="flex items-center justify-center gap-2 px-8 py-4 text-white bg-green-600 rounded-xl font-bold shadow-xl hover:bg-green-700 transition-all"
            >
              <BookOpen size={20} /> TIẾP TỤC HỌC NGAY
            </Link>
          ) : enrollmentStatus === 'PENDING' ? (
            <button disabled className="px-8 py-4 text-white bg-amber-500 rounded-xl font-bold cursor-not-allowed flex items-center gap-2">
              ⏳ ĐANG CHỜ DUYỆT...
            </button>
          ) : enrollmentStatus === 'REJECTED' ? (
             <button disabled className="px-8 py-4 text-white bg-red-500 rounded-xl font-bold cursor-not-allowed">
              ❌ ĐĂNG KÝ BỊ TỪ CHỐI
            </button>
          ) : (
            <button 
              onClick={handleEnroll}
              className="px-8 py-4 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 font-black shadow-xl shadow-indigo-100 transition-all active:scale-95"
            >
              ĐĂNG KÝ HỌC
            </button>
          )}
        </div>
      </div>

      {/* DANH SÁCH BÀI GIẢNG */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
              📚 NỘI DUNG CHƯƠNG TRÌNH
          </h2>
          <span className="text-sm text-gray-500 font-medium">{lectures.length} bài giảng</span>
        </div>

        <div className="divide-y divide-gray-50">
          {lectures.map((lec, index) => (
            <div 
              key={lec.id} 
              onClick={() => {
                if (canAccessContent) navigate(`/course/${courseId}/learn`);
                else alert("Vui lòng đăng ký khóa học để xem nội dung chi tiết.");
              }}
              className={`group flex justify-between items-center p-5 transition-all
                ${canAccessContent 
                  ? 'cursor-pointer hover:bg-indigo-50/50' 
                  : 'bg-gray-50/30'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  ${canAccessContent ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-400'}`}>
                  {index + 1}
                </div>
                <div>
                  <h3 className={`font-bold text-sm mb-1 ${canAccessContent ? 'text-gray-900' : 'text-gray-500'}`}>
                    {lec.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    {lec.quiz_id && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                        📝 Bài tập
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 font-medium uppercase">
                      {canAccessContent ? 'Khả dụng' : 'Yêu cầu đăng ký'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {canAccessContent ? (
                  <span className="text-indigo-600 font-bold text-xs flex items-center gap-1 group-hover:underline">
                    XEM NGAY <PlayCircle size={14} />
                  </span>
                ) : (
                  <Lock size={16} className="text-gray-300" />
                )}
              </div>
            </div>
          ))}
          
          {lectures.length === 0 && (
            <div className="p-10 text-center text-gray-400 italic">
              Giảng viên đang cập nhật nội dung bài giảng...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseDetailPage;