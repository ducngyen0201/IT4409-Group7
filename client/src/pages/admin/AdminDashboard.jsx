import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomModal from '../../components/CustomModal';
import { formatDateTime } from '../../utils/dateUtils';

function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Modal Thông báo/Xác nhận (Alert/Confirm)
  const [modal, setModal] = useState({
    isOpen: false, 
    type: 'alert', 
    title: '', 
    message: '', 
    confirmText: '',
    confirmColor: '',
    onConfirm: () => {} 
  });
  
  const [preview, setPreview] = useState({
    isOpen: false,
    courseTitle: '',
    lectures: [],
    isLoading: false
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => {} });

  // 1. Tải danh sách khóa học
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data);
    } catch (err) {
      console.error(err);
      showAlert('Lỗi', 'Không thể tải danh sách khóa học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // 2. Xử lý Duyệt / Từ chối
  const handleUpdateStatus = (courseId, newStatus) => {
    // TRƯỜNG HỢP 1: DUYỆT (Approve)
    if (newStatus === 'APPROVED') {
      setModal({
        isOpen: true,
        type: 'confirm',
        title: 'Phê duyệt khóa học',
        message: 'Bạn có chắc chắn muốn duyệt khóa học này? Nó sẽ được công khai cho học sinh ngay lập tức.',
        confirmText: 'Duyệt ngay',
        confirmColor: 'bg-green-600 hover:bg-green-700',
        onConfirm: async () => {
          try {
            const token = sessionStorage.getItem('token');
            await axios.patch(`http://localhost:5000/api/admin/courses/${courseId}/status`, 
              { status: 'APPROVED' },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            showAlert('Thành công', 'Đã duyệt khóa học.');
            fetchCourses();
          } catch (err) {
            showAlert('Lỗi', 'Không thể duyệt khóa học.');
          }
        }
      });
    } 
    
    // TRƯỜNG HỢP 2: TỪ CHỐI (Reject/Draft)
    else if (newStatus === 'DRAFT') {
      setModal({
        isOpen: true,
        type: 'prompt',
        title: 'Từ chối khóa học',
        message: 'Vui lòng nhập lý do từ chối để gửi cho giáo viên sửa lại:',
        confirmText: 'Gửi từ chối',
        confirmColor: 'bg-red-600 hover:bg-red-700',
        onConfirm: async (reason) => { // Nhận lý do từ input
          if (!reason || !reason.trim()) {
            showAlert('Lỗi', 'Bạn phải nhập lý do từ chối.');
            return;
          }

          try {
            const token = sessionStorage.getItem('token');
            await axios.patch(`http://localhost:5000/api/admin/courses/${courseId}/status`, 
              { 
                status: 'DRAFT',
                reason: reason // Gửi lý do lên server
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            showAlert('Thành công', 'Đã từ chối và gửi phản hồi cho giáo viên.');
            fetchCourses();
          } catch (err) {
            showAlert('Lỗi', 'Không thể từ chối khóa học.');
          }
        }
      });
    }
  };

  // --- 3. XEM NỘI DUNG (PREVIEW) ---
  const handlePreviewContent = async (courseId, courseTitle) => {
    // Mở modal loading trước
    setPreview({ isOpen: true, courseTitle, lectures: [], isLoading: true });

    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/courses/${courseId}/lectures`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPreview({
        isOpen: true,
        courseTitle,
        lectures: res.data,
        isLoading: false
      });
    } catch (err) {
      console.error(err);
      setPreview({ isOpen: false, courseTitle: '', lectures: [], isLoading: false });
      showAlert('Lỗi', 'Không thể tải nội dung khóa học.');
    }
  };

  const closePreview = () => setPreview({ ...preview, isOpen: false });

  const pendingCourses = courses.filter(c => c.status === 'PENDING_REVIEW');
  const otherCourses = courses.filter(c => c.status !== 'PENDING_REVIEW');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-8 relative">
      <CustomModal {...modal} onClose={closeModal} />
      
      <h1 className="text-3xl font-bold text-gray-800 mb-8">🛡️ Trang Quản Trị Viên</h1>

      {/* --- PHẦN 1: KHÓA HỌC CHỜ DUYỆT --- */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-orange-600 mb-4 flex items-center gap-2">
          <span>⏳ Yêu cầu chờ duyệt</span>
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">{pendingCourses.length}</span>
        </h2>

        {pendingCourses.length === 0 ? (
          <div className="bg-green-50 p-6 rounded border border-green-100 text-green-700 text-center">
            Không có khóa học nào đang chờ duyệt.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khóa học</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giáo viên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingCourses.map(course => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{course.title}</div>
                      <div className="text-xs text-gray-500">Mã: {course.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{course.instructor_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{course.instructor_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(course.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {/* NÚT XEM NỘI DUNG */}
                      <button 
                        onClick={() => handlePreviewContent(course.id, course.title)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2 bg-indigo-50 px-3 py-1 rounded hover:bg-indigo-100 transition"
                      >
                        🔍 Xem nội dung
                      </button>

                      <button 
                        onClick={() => handleUpdateStatus(course.id, 'APPROVED')}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                      >
                        ✓ Duyệt
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(course.id, 'DRAFT')}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        ✕ Từ chối
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- PHẦN 2: DANH SÁCH TẤT CẢ --- */}
      <div>
        <h2 className="text-xl font-bold text-gray-700 mb-4">📚 Tất cả khóa học</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên khóa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cập nhật cuối</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {otherCourses.map(course => (
                <tr key={course.id}>
                  <td className="px-6 py-4 text-sm text-gray-500">#{course.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{course.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full 
                      ${course.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(course.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL XEM TRƯỚC NỘI DUNG (CUSTOM UI) --- */}
      {preview.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Nội dung khóa học</h3>
                <p className="text-sm text-indigo-600 font-medium truncate max-w-md">{preview.courseTitle}</p>
              </div>
              <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 text-2xl font-bold px-2">&times;</button>
            </div>

            {/* Body Modal */}
            <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
              {preview.isLoading ? (
                <div className="text-center py-10"><LoadingSpinner /></div>
              ) : preview.lectures.length === 0 ? (
                <p className="text-center text-gray-500 italic">Khóa học này chưa có nội dung nào.</p>
              ) : (
                <div className="space-y-4">
                  {preview.lectures.map((lec, idx) => (
                    <div key={lec.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                      {/* Tiêu đề Bài giảng */}
                      <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                        <span className="font-bold text-indigo-900">Bài {idx + 1}: {lec.title}</span>
                        <span className={`text-xs px-2 py-1 rounded ${lec.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                          {lec.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      
                      {/* Chi tiết bên trong */}
                      <div className="p-4 space-y-3">
                        {/* 1. Tài liệu / Video */}
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Video & Tài liệu</h4>
                          {lec.materials && lec.materials.length > 0 ? (
                            <ul className="space-y-1 pl-2">
                              {lec.materials.map(m => (
                                <li key={m.id} className="text-sm text-gray-700 flex items-center gap-2">
                                  <span>🎥</span> 
                                  <a href={m.url} target="_blank" rel="noreferrer" className="hover:underline text-blue-600">{m.title}</a>
                                </li>
                              ))}
                            </ul>
                          ) : <span className="text-xs text-gray-400 italic pl-2">Không có video</span>}
                        </div>

                        {/* 2. Quiz */}
                        <div className="border-t pt-2 mt-2">
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Bài tập trắc nghiệm</h4>
                          {lec.quizzes && lec.quizzes.length > 0 ? (
                            <ul className="space-y-1 pl-2">
                              {lec.quizzes.map(q => (
                                <li key={q.id} className="text-sm text-gray-700 flex items-center gap-2">
                                  <span>📝</span> 
                                  <span>{q.title}</span>
                                  <span className="text-xs text-gray-400">({q.questions_count || '?'} câu)</span>
                                </li>
                              ))}
                            </ul>
                          ) : <span className="text-xs text-gray-400 italic pl-2">Không có bài tập</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 bg-white border-t flex justify-end">
              <button 
                onClick={closePreview}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-medium transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;