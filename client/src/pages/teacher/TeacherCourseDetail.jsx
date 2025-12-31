import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LectureManager from '../../components/teacher/LectureManager';
import TeacherStats from '../../components/teacher/TeacherStats';
import EnrollmentManager from '../../components/teacher/EnrollmentManager';
import CustomModal from '../../components/CustomModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Video, Settings, BookOpen, BarChart3, Users } from 'lucide-react';

function TeacherCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content'); 

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_enrollment_open: false
  });

  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {} });
  const closeModal = () => setModal({ ...modal, isOpen: false });
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => {} });

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/api/courses/${id}`);
      const courseData = response.data.course || response.data; 
      
      setCourse(courseData);
      setFormData({
        title: courseData.title,
        description: courseData.description,
        is_enrollment_open: courseData.is_enrollment_open
      });
    } catch (err) {
      console.error("Lỗi tải khóa học:", err);
      showAlert('Lỗi', "Không thể tải thông tin khóa học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCourse();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.patch(`/api/courses/${id}`, formData);
      showAlert('Thành công', 'Cập nhật thông tin khóa học thành công!');
      fetchCourse();
    } catch (err) {
      showAlert('Thất bại', 'Có lỗi xảy ra khi cập nhật.');
    }
  };

  const handleStartLive = () => {
    navigate(`/video-call/${id}`);
  };

  if (loading) return <LoadingSpinner />;
  if (!course) return <div className="p-8 text-center">Không tìm thấy khóa học.</div>;

  return (
    <div className="container p-8 mx-auto max-w-7xl">
      <CustomModal {...modal} onClose={closeModal} />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{course.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Mã: {course.code}</span>
            <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter shadow-sm
              ${course.status === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' : 
                course.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                'bg-gray-100 text-gray-500 border border-gray-200'}`}>
              {course.status === 'APPROVED' ? '● Đã duyệt' : course.status === 'PENDING_REVIEW' ? '○ Chờ duyệt' : 'Draft'}
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleStartLive} 
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
        >
          <Video size={20} /> BẮT ĐẦU LIVESTREAM
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* CỘT TRÁI: CÀI ĐẶT CHUNG */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
              <Settings size={20} className="text-indigo-600" /> CÀI ĐẶT CHUNG
            </h2>
            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tên khóa học</label>
                <input type="text" className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mô tả tóm tắt</label>
                <textarea rows="6" className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm leading-relaxed"
                  value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded-md"
                  checked={formData.is_enrollment_open} onChange={(e) => setFormData({...formData, is_enrollment_open: e.target.checked})}
                />
                <span className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Cho phép học viên đăng ký</span>
              </label>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                LƯU THAY ĐỔI
              </button>
            </form>
          </div>
        </div>

        {/* CỘT PHẢI: QUẢN LÝ NÂNG CAO (TABS) */}
        <div className="lg:col-span-2">
          {/* TAB NAVIGATION */}
          <div className="flex gap-4 mb-8 bg-gray-100 p-1.5 rounded-2xl w-fit">
            <button onClick={() => setActiveTab('content')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'content' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <BookOpen size={16} /> NỘI DUNG
            </button>
            <button onClick={() => setActiveTab('stats')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'stats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <BarChart3 size={16} /> THỐNG KÊ
            </button>
            <button onClick={() => setActiveTab('enrollments')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'enrollments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Users size={16} /> DUYỆT HỌC VIÊN
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="min-h-[600px] animate-in fade-in duration-500">
            {activeTab === 'content' && <LectureManager courseId={id} />}
            {activeTab === 'stats' && <TeacherStats courseId={id} />}
            {activeTab === 'enrollments' && <EnrollmentManager courseId={id} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherCourseDetail;