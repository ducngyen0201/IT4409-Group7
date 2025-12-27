import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../LoadingSpinner';
import CustomModal from '../../components/CustomModal';

function TeacherStats({ courseId }) {
  const [stats, setStats] = useState({
    students: [],
    total_students: 0,
    total_lectures: 0,
    pending_students: 0
  });
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    confirmText: '',
    confirmColor: '',
    onConfirm: () => {}
  });

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));
  
  const showAlert = (title, message) => {
    setModal({
      isOpen: true,
      type: 'alert',
      title,
      message,
      confirmText: 'Đóng',
      onConfirm: closeModal
    });
  };

  const fetchStats = useCallback(async () => {
    try {
      // Sử dụng userId từ token theo quy định của authMiddleware
      const res = await axiosClient.get(`/api/courses/${courseId}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) fetchStats();
  }, [fetchStats]);

  const handleAddByEmail = () => {
    setModal({
      isOpen: true,
      type: 'prompt',
      title: 'Thêm học viên mới',
      message: 'Nhập địa chỉ Email của học viên để thêm trực tiếp vào lớp:',
      confirmText: 'Thêm vào lớp',
      confirmColor: 'bg-indigo-600 hover:bg-indigo-700',
      onConfirm: async (email) => {
        if (!email || !email.includes('@')) {
          showAlert('Lỗi', 'Vui lòng nhập Email hợp lệ.');
          return;
        }
        try {
          await axiosClient.post(`/api/courses/${courseId}/enrollments`, { email });
          closeModal();
          showAlert('Thành công', `Học viên ${email} đã được thêm vào lớp.`);
          fetchStats();
        } catch (err) {
          const msg = err.response?.data?.error || 'Lỗi: Không tìm thấy học sinh hoặc đã ở trong lớp.';
          showAlert('Lỗi', msg);
        }
      }
    });
  };

  const handleApprove = (enrollmentId) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Duyệt học viên',
      message: 'Xác nhận cho phép học viên này tham gia khóa học?',
      confirmText: 'Duyệt ngay',
      confirmColor: 'bg-green-600 hover:bg-green-700',
      onConfirm: async () => {
        try {
          await axiosClient.post(`/api/courses/${courseId}/enrollments/${enrollmentId}/approve`);
          closeModal();
          showAlert('Thành công', 'Học viên đã được phê duyệt.');
          fetchStats();
        } catch (err) {
          showAlert('Lỗi', 'Thao tác thất bại.');
        }
      }
    });
  };

  const handleReject = (enrollmentId) => {
    setModal({
      isOpen: true,
      type: 'prompt',
      title: 'Từ chối đăng ký',
      message: 'Lý do từ chối (không bắt buộc):',
      confirmText: 'Xác nhận từ chối',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async (reason) => {
        try {
          await axiosClient.post(`/api/courses/${courseId}/enrollments/${enrollmentId}/reject`, { note: reason });
          closeModal();
          showAlert('Thông báo', 'Đã từ chối yêu cầu đăng ký.');
          fetchStats();
        } catch (err) {
          showAlert('Lỗi', 'Có lỗi xảy ra.');
        }
      }
    });
  };

  const getAvatarUrl = (path) => {
  if (!path) return null;

  if (path.startsWith('http')) {
    return path; 
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
};

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  const approvedStudents = stats.students.filter(s => s.enrollment_status === 'APPROVED');
  const classAvgProgress = approvedStudents.length > 0
    ? approvedStudents.reduce((acc, curr) => acc + (curr.progress_percent || 0), 0) / approvedStudents.length
    : 0;

  return (
    <div className="space-y-6">
      <CustomModal {...modal} onClose={closeModal} />

      {/* DÒNG KẾT QUẢ HỌC TẬP & NÚT THÊM HỌC VIÊN */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
          <div className="text-center md:text-left md:border-r border-gray-100 last:border-0 px-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Học viên</h3>
            <p className="text-xl font-black text-indigo-600">{stats.total_students}</p>
          </div>
          <div className="text-center md:text-left md:border-r border-gray-100 last:border-0 px-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chờ duyệt</h3>
            <p className="text-xl font-black text-amber-500">{stats.pending_students}</p>
          </div>
          <div className="text-center md:text-left md:border-r border-gray-100 last:border-0 px-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiến độ lớp</h3>
            <p className="text-xl font-black text-green-500">{Math.round(classAvgProgress)}%</p>
          </div>
          <div className="text-center md:text-left px-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bài giảng</h3>
            <p className="text-xl font-black text-purple-500">{stats.total_lectures}</p>
          </div>
        </div>

        <div className="w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
          <button 
            onClick={handleAddByEmail}
            className="w-full lg:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span className="text-lg">＋</span> Thêm học viên
          </button>
        </div>
      </div>

      {/* DANH SÁCH CHI TIẾT */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-gray-700">Chi tiết danh sách lớp học</h2>
          <span className="text-[10px] font-bold text-gray-400 uppercase">Dữ liệu cập nhật mới nhất</span>
        </div>
        
        {stats.students.length === 0 ? (
          <div className="p-16 text-center text-gray-400 italic">Chưa có học viên nào tham gia.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thông tin học viên</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái / Tiến độ</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.students.map((student) => (
                  <tr key={student.student_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getAvatarUrl(student.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=random`} 
                          className="w-9 h-9 rounded-full object-cover border border-gray-100" 
                          alt="" 
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-800">{student.full_name}</p>
                          <p className="text-[11px] text-gray-400 font-medium">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.enrollment_status === 'APPROVED' ? (
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${student.progress_percent}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-gray-700">{student.progress_percent}%</span>
                        </div>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">CHỜ PHÊ DUYỆT</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {student.enrollment_status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleApprove(student.enrollment_id)} className="px-4 py-1.5 bg-green-600 text-white text-[11px] font-bold rounded-lg hover:bg-green-700 shadow-sm transition-colors">Duyệt</button>
                          <button onClick={() => handleReject(student.enrollment_id)} className="px-4 py-1.5 bg-red-50 text-red-600 text-[11px] font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all">Từ chối</button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-300 font-bold uppercase tracking-tighter">Thành viên lớp</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherStats;