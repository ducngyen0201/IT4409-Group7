import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LectureManager from '../../components/teacher/LectureManager';
import TeacherStats from '../../components/teacher/TeacherStats';
import CustomModal from '../../components/CustomModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Video } from 'lucide-react';

function TeacherCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate(); // Khởi tạo useNavigate ở đây

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State quản lý Tabs: 'content' hoặc 'stats'
  const [activeTab, setActiveTab] = useState('content'); 

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_enrollment_open: false
  });

  // State Modal
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {} });
  const closeModal = () => setModal({ ...modal, isOpen: false });
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => {} });

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axiosClient.get(`/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Lưu ý: Sửa lại để lấy data trực tiếp (do backend cũ có thể bọc trong key 'course')
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
    fetchCourse();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      await axiosClient.patch(`/api/courses/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert('Thành công', 'Cập nhật thông tin khóa học thành công!');
      fetchCourse();
    } catch (err) {
      console.error(err);
      showAlert('Thất bại', 'Có lỗi xảy ra khi cập nhật.');
    }
  };

  const handleRequestReview = async () => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Gửi yêu cầu duyệt',
      message: 'Bạn có chắc muốn gửi yêu cầu duyệt? Khóa học sẽ chuyển sang trạng thái CHỜ DUYỆT.',
      onConfirm: async () => {
        try {
          const token = sessionStorage.getItem('token');
          await axiosClient.post(
            `/api/courses/${id}/request-review`, {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showAlert('Thành công', 'Đã gửi yêu cầu duyệt!');
          fetchCourse();
        } catch (err) {
          console.error(err);
          showAlert('Lỗi', err.response?.data?.error || 'Lỗi khi gửi yêu cầu.');
        }
      }
    });
  };

  // --- HÀM MỚI: BẮT ĐẦU LIVE STREAM ---
  const handleStartLive = () => {
    // Chuyển hướng đến trang Video Call, dùng Course ID làm Room ID
    navigate(`/video-call/${id}`);
  };

  if (loading) return <LoadingSpinner />;
  if (!course) return <div className="p-8 text-center">Không tìm thấy khóa học.</div>;

  return (
    <div className="container p-8 mx-auto">
      <CustomModal {...modal} onClose={closeModal} />

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-500">Mã: {course.code}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* NÚT BẮT ĐẦU LIVESTREAM (NỔI BẬT) */}
          <button 
            onClick={handleStartLive} 
            className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 font-bold shadow-lg shadow-red-200 flex items-center gap-2 transition transform hover:scale-[1.02]"
          >
            <Video size={20} /> Bắt đầu Livestream
          </button>
          {/* ---------------------------------- */}
          
          <span className={`px-3 py-1 text-sm font-bold rounded-full 
            ${course.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
              course.status === 'PENDING_REVIEW' ? 'bg-orange-100 text-orange-800' : 
              'bg-gray-100 text-gray-800'}`}>
            {course.status === 'APPROVED' ? 'Đã duyệt' : 
             course.status === 'PENDING_REVIEW' ? 'Chờ duyệt' : 'Bản nháp'}
          </span>
          
          {course.status === 'DRAFT' && (
            <button onClick={handleRequestReview} className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 font-medium shadow">
              Gửi duyệt
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* --- CỘT TRÁI: FORM SỬA THÔNG TIN --- */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white rounded shadow border border-gray-100">
            <h2 className="mb-4 text-xl font-bold text-gray-800">Thông tin chung</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">Tên khóa học</label>
                <input type="text" className="w-full px-3 py-2 border rounded focus:ring-indigo-500 outline-none"
                  value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">Mô tả</label>
                <textarea rows="6" className="w-full px-3 py-2 border rounded focus:ring-indigo-500 outline-none"
                  value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded"
                    checked={formData.is_enrollment_open} onChange={(e) => setFormData({...formData, is_enrollment_open: e.target.checked})}
                  />
                  <span className="text-sm text-gray-700">Đang mở ghi danh</span>
                </label>
              </div>
              <button type="submit" className="w-full px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 font-medium transition">
                Lưu thay đổi
              </button>
            </form>
          </div>
        </div>

        {/* --- CỘT PHẢI: TABS (NỘI DUNG / THỐNG KÊ) --- */}
        <div className="lg:col-span-2">
          
          {/* THANH TAB NAVIGATION */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('content')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'content'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                📝 Nội dung khóa học
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'stats'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                📊 Thống kê học viên
              </button>
            </nav>
          </div>

          {/* KHU VỰC HIỂN THỊ NỘI DUNG TAB */}
          <div className="bg-white rounded shadow p-6 border border-gray-100 min-h-[500px]">
            {activeTab === 'content' ? (
              // TAB 1: QUẢN LÝ BÀI GIẢNG
              <>
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-gray-800">Quản lý bài giảng</h2>
                   <span className="text-sm text-gray-500 italic">Kéo thả để sắp xếp (Coming soon)</span>
                </div>
                <LectureManager courseId={id} />
              </>
            ) : (
              // TAB 2: THỐNG KÊ
              <>
                <h2 className="mb-6 text-xl font-bold text-gray-800">Kết quả học tập</h2>
                <TeacherStats courseId={id} />
              </>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default TeacherCourseDetail;