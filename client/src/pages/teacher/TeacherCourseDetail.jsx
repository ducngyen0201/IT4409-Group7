import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LectureManager from '../../components/teacher/LectureManager';
import TeacherStats from '../../components/teacher/TeacherStats';
import EnrollmentManager from '../../components/teacher/EnrollmentManager';
import CustomModal from '../../components/CustomModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Video, Settings, BookOpen, BarChart3, Users, ArrowLeft } from 'lucide-react';

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

  if (loading) return <LoadingSpinner />;
  if (!course) return <div className="p-8 text-center font-bold text-gray-400">Không tìm thấy khóa học.</div>;

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 md:p-8 lg:p-12 font-sans">
      <CustomModal {...modal} onClose={closeModal} />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* NÚT QUAY LẠI */}
        <button 
          onClick={() => navigate('/admin')} 
          className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> QUAY LẠI QUẢN LÝ
        </button>

        {/* HEADER SECTION: Responsive Direction */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="space-y-2 w-full">
            <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              {course.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Mã: {course.code}</span>
              <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-tighter border-2
                ${course.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' : 
                  course.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                  'bg-gray-50 text-gray-500 border-gray-100'}`}>
                {course.status === 'APPROVED' ? '● Đã xuất bản' : course.status === 'PENDING_REVIEW' ? '○ Chờ duyệt' : 'Draft'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => navigate(`/video-call/${id}`)} 
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 uppercase text-xs tracking-widest"
          >
            <Video size={20} className="animate-pulse" /> LIVE NGAY
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* CỘT TRÁI: CÀI ĐẶT (Stack on top on mobile) */}
          <div className="lg:col-span-1">
            <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 lg:sticky lg:top-10">
              <h2 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-3">
                <Settings size={20} className="text-indigo-600" /> CÀI ĐẶT CHUNG
              </h2>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Tên hiển thị</label>
                  <input type="text" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-gray-700"
                    value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Mô tả khóa học</label>
                  <textarea rows="5" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium leading-relaxed resize-none"
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <label className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-2xl cursor-pointer group transition-all hover:bg-indigo-50">
                  <input type="checkbox" className="w-6 h-6 text-indigo-600 rounded-lg border-none bg-white shadow-inner focus:ring-0"
                    checked={formData.is_enrollment_open} onChange={(e) => setFormData({...formData, is_enrollment_open: e.target.checked})}
                  />
                  <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Mở đăng ký học viên</span>
                </label>
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95 uppercase text-xs tracking-[0.2em]">
                  LƯU THÔNG TIN
                </button>
              </form>
            </div>
          </div>

          {/* CỘT PHẢI: TABS QUẢN LÝ */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* TAB NAVIGATION: Tối ưu cho Mobile (Scroll ngang nếu thiếu chỗ) */}
            <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 scrollbar-hide">
              {[
                { id: 'content', icon: <BookOpen size={16} />, label: 'NỘI DUNG' },
                { id: 'stats', icon: <BarChart3 size={16} />, label: 'THỐNG KÊ' },
                { id: 'enrollments', icon: <Users size={16} />, label: 'HỌC VIÊN' },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)} 
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black transition-all whitespace-nowrap flex-1 justify-center
                    ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: Hiệu ứng Fade-in mượt */}
            <div className="min-h-[500px] animate-in fade-in duration-700">
              {activeTab === 'content' && (
                <div className="bg-white rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-gray-100">
                  <LectureManager courseId={id} />
                </div>
              )}
              {activeTab === 'stats' && (
                <div className="bg-white rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-gray-100">
                  <TeacherStats courseId={id} />
                </div>
              )}
              {activeTab === 'enrollments' && (
                <div className="bg-white rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-gray-100">
                  <EnrollmentManager courseId={id} />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default TeacherCourseDetail;