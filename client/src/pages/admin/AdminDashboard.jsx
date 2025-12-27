import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomModal from '../../components/CustomModal';
import { formatDateTime } from '../../utils/dateUtils';

import TeacherStats from '../../components/teacher/TeacherStats'; 
import AdminUserManagement from './AdminUserManagement';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' hoặc 'users'
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingStudentsCourseId, setViewingStudentsCourseId] = useState(null);

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
  
  // State Xem trước nội dung bài giảng
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
      const res = await axiosClient.get('/api/admin/courses', {
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

  // 2. Xử lý Duyệt / Từ chối khóa học
  const handleUpdateStatus = (courseId, newStatus) => {
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
            await axiosClient.patch(`/api/admin/courses/${courseId}/status`, 
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
    else if (newStatus === 'DRAFT') {
      setModal({
        isOpen: true,
        type: 'prompt',
        title: 'Từ chối khóa học',
        message: 'Vui lòng nhập lý do từ chối để gửi cho giáo viên sửa lại:',
        confirmText: 'Gửi từ chối',
        confirmColor: 'bg-red-600 hover:bg-red-700',
        onConfirm: async (reason) => {
          if (!reason || !reason.trim()) {
            showAlert('Lỗi', 'Bạn phải nhập lý do từ chối.');
            return;
          }
          try {
            const token = sessionStorage.getItem('token');
            await axiosClient.patch(`/api/admin/courses/${courseId}/status`, 
              { 
                status: 'DRAFT',
                reason: reason 
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

  // 3. Xem trước nội dung khóa học (Lectures, Materials, Quizzes)
  const handlePreviewContent = async (courseId, courseTitle) => {
    setPreview({ isOpen: true, courseTitle, lectures: [], isLoading: true });
    try {
      const token = sessionStorage.getItem('token');
      const res = await axiosClient.get(`/api/courses/${courseId}/lectures`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreview({ isOpen: true, courseTitle, lectures: res.data, isLoading: false });
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
    <div className="container mx-auto p-8 relative min-h-screen bg-gray-50">
      <CustomModal {...modal} onClose={closeModal} />
      
      {/* HEADER & TAB NAVIGATION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <h1 className="text-3xl font-extrabold text-gray-800">🛡️ Quản Trị Hệ Thống</h1>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'courses' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            📚 Khóa học
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            👥 Người dùng
          </button>
        </div>
      </div>

      {/* NỘI DUNG THEO TAB */}
      {activeTab === 'courses' ? (
        <div className="space-y-12 animate-fade-in">
          {/* 1. KHÓA HỌC CHỜ DUYỆT */}
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-4 flex items-center gap-2">
              <span>⏳ Yêu cầu chờ duyệt</span>
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">{pendingCourses.length}</span>
            </h2>

            {pendingCourses.length === 0 ? (
              <div className="bg-green-50 p-6 rounded border border-green-100 text-green-700 text-center font-medium">
                Hiện không có khóa học nào đang chờ duyệt.
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Khóa học</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Giáo viên</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ngày tạo</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingCourses.map(course => (
                      <tr key={course.id} className="hover:bg-gray-50 transition">
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
                          <button onClick={() => handlePreviewContent(course.id, course.title)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg transition font-bold">🔍 Soát nội dung</button>
                          <button onClick={() => handleUpdateStatus(course.id, 'APPROVED')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold">✓ Duyệt</button>
                          <button onClick={() => handleUpdateStatus(course.id, 'DRAFT')} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-bold">✕ Từ chối</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 2. TẤT CẢ KHÓA HỌC */}
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {otherCourses.map(course => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">#{course.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{course.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full 
                          ${course.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(course.updated_at)}</td>
                      
                      {/* CẬP NHẬT CỘT HÀNH ĐỘNG Ở ĐÂY */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {/* Nút xem nội dung (Bài giảng, Quiz) */}
                        <button 
                          onClick={() => handlePreviewContent(course.id, course.title)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded hover:bg-indigo-100 transition"
                        >
                          🔍 Xem nội dung
                        </button>

                        {/* Nút xem thống kê học viên */}
                        <button 
                          onClick={() => setViewingStudentsCourseId(course.id)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition"
                        >
                          👥 Học viên
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TAB QUẢN LÝ NGƯỜI DÙNG */
        <AdminUserManagement />
      )}

      {/* MODAL 1: THỐNG KÊ HỌC VIÊN */}
      {viewingStudentsCourseId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-zoom-in">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">📊 Thống kê học viên & Tiến độ</h3>
              <button onClick={() => setViewingStudentsCourseId(null)} className="text-gray-400 hover:text-red-500 text-3xl font-bold transition">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <TeacherStats courseId={viewingStudentsCourseId} />
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <button onClick={() => setViewingStudentsCourseId(null)} className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM TRƯỚC NỘI DUNG */}
      {preview.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Nội dung khóa học</h3>
                <p className="text-sm text-indigo-600 font-medium truncate max-w-md">{preview.courseTitle}</p>
              </div>
              <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 text-2xl font-bold px-2">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
              {preview.isLoading ? <div className="text-center py-10"><LoadingSpinner /></div> : preview.lectures.length === 0 ? <p className="text-center text-gray-500 italic">Khóa học chưa có nội dung.</p> : (
                <div className="space-y-4">
                  {preview.lectures.map((lec, idx) => (
                    <div key={lec.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                        <span className="font-bold text-indigo-900">Bài {idx + 1}: {lec.title}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${lec.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{lec.is_published ? 'Published' : 'Draft'}</span>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Video & Tài liệu</h4>
                          {lec.materials && lec.materials.length > 0 ? (
                            <ul className="space-y-2 pl-2">
                              {lec.materials.map(m => (
                                <li key={m.id} className="text-sm text-gray-700 flex items-center gap-2">🎥 <a href={m.url} target="_blank" rel="noreferrer" className="hover:underline text-blue-600 font-medium">{m.title}</a></li>
                              ))}
                            </ul>
                          ) : <span className="text-xs text-gray-400 italic">Không có tài liệu</span>}
                        </div>
                        <div className="border-t pt-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Bài tập trắc nghiệm</h4>
                          {lec.quizzes && lec.quizzes.length > 0 ? (
                            <ul className="space-y-2 pl-2">
                              {lec.quizzes.map(q => (
                                <li key={q.id} className="text-sm text-gray-700 flex items-center gap-2">📝 <span className="font-medium">{q.title}</span> <span className="text-xs text-gray-400">({q.questions_count || 0} câu)</span></li>
                              ))}
                            </ul>
                          ) : <span className="text-xs text-gray-400 italic">Không có bài tập</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-white border-t flex justify-end">
              <button onClick={closePreview} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold transition">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;