import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import CustomModal from '../CustomModal';
import { 
  Check, X, User, Calendar, ShieldCheck, 
  RefreshCw, AlertCircle, UserPlus, Search 
} from 'lucide-react';

function EnrollmentManager({ courseId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');
  
  // State quản lý Modal
  const [modal, setModal] = useState({
    isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}
  });

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/api/courses/${courseId}/enrollments`);
      setEnrollments(res.data);
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchEnrollments();
  }, [courseId]);

  // CHỨC NĂNG: Thêm học viên trực tiếp qua Email
  const handleAddByEmail = () => {
    setModal({
        isOpen: true,
        type: 'prompt',
        title: 'Thêm học viên mới',
        message: 'Nhập chính xác Email của học viên để thêm vào lớp:',
        onConfirm: async (email) => {
        if (!email || !email.includes('@')) {
            setModal(prev => ({ ...prev, isOpen: true, type: 'alert', title: 'Lỗi', message: 'Vui lòng nhập Email hợp lệ.' }));
            return;
        }
        try {
            await axiosClient.post(`/api/courses/${courseId}/enrollments/add`, { email });
            
            setModal({ isOpen: true, type: 'alert', title: 'Thành công', message: `Đã thêm ${email} vào lớp học.` });
            fetchEnrollments();
        } catch (err) {
            const msg = err.response?.data?.error || 'Không tìm thấy User hoặc học viên đã có trong lớp.';
            setModal({ isOpen: true, type: 'alert', title: 'Thất bại', message: msg });
        }
        }
    });
    };

  const handleAction = async (enrollmentId, status) => {
    try {
        if (status === 'APPROVED') {
        await axiosClient.post(`/api/courses/${courseId}/enrollments/${enrollmentId}/approve`);
        } 
        else if (status === 'REJECTED') {
        await axiosClient.post(`/api/courses/${courseId}/enrollments/${enrollmentId}/reject`);
        }

        setEnrollments(prev => prev.map(e => 
        e.id === enrollmentId ? { ...e, status: status } : e
        ));
        } catch (err) {
            console.error("Lỗi duyệt học viên:", err.response?.data);
            alert("Thao tác thất bại: " + (err.response?.data?.error || "Lỗi server"));
}
};

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "---" : date.toLocaleDateString('vi-VN');
  };

  const filteredEnrollments = enrollments.filter(e => filter === 'ALL' ? true : e.status === filter);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <RefreshCw className="animate-spin mb-4 text-indigo-500" size={32} />
      <p className="text-xs font-black uppercase tracking-widest text-gray-500">Đang đồng bộ danh sách...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <CustomModal {...modal} onClose={closeModal} />

      {/* THANH CÔNG CỤ: BỘ LỌC + NÚT THÊM MỚI */}
      <div className="flex flex-col md:flex-row justify-between items-md-center gap-4">
        <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl w-fit border border-gray-100">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-tighter transition-all ${
                filter === f ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {f === 'ALL' ? 'TẤT CẢ' : f === 'PENDING' ? 'ĐANG CHỜ' : f === 'APPROVED' ? 'ĐÃ DUYỆT' : 'TỪ CHỐI'}
            </button>
          ))}
        </div>

        <button 
          onClick={handleAddByEmail}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[11px] font-black rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <UserPlus size={16} /> THÊM HỌC VIÊN
        </button>
      </div>

      {/* BẢNG DỮ LIỆU */}
      {filteredEnrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50/30 rounded-3xl border-2 border-dashed border-gray-100">
          <AlertCircle className="text-gray-200 mb-2" size={40} />
          <p className="text-sm text-gray-400 font-medium italic">Danh sách trống.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Học viên</th>
                <th className="pb-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Ngày yêu cầu</th>
                <th className="pb-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Trạng thái</th>
                <th className="pb-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEnrollments.map((en) => (
                <tr key={en.id} className="group hover:bg-gray-50/50 transition-all">
                  <td className="py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-none mb-1.5">{en.full_name}</p>
                        <p className="text-[11px] text-gray-400 font-bold tracking-tight">{en.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 text-center">
                    <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 font-bold bg-gray-50 px-3 py-1 rounded-lg">
                      <Calendar size={13} className="text-gray-400" /> 
                      {formatDate(en.requested_at)}
                    </div>
                  </td>
                  <td className="py-5 text-center">
                    <span className={`px-3 py-1.5 text-[9px] font-black rounded-xl uppercase tracking-wider border ${
                      en.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100' : 
                      en.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : 
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {en.status === 'APPROVED' ? '● Thành công' : en.status === 'REJECTED' ? '● Từ chối' : '○ Đang đợi'}
                    </span>
                  </td>
                  <td className="py-5 text-right">
                    {en.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleAction(en.id, 'APPROVED')} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl hover:bg-indigo-700 transition-all active:scale-90"><Check size={14} /> DUYỆT</button>
                        <button onClick={() => handleAction(en.id, 'REJECTED')} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-400 text-[10px] font-black rounded-xl hover:text-red-600 hover:border-red-100 transition-all"><X size={14} /> LOẠI</button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-[10px] text-gray-300 font-black uppercase italic">
                        <ShieldCheck size={14} /> Đã xử lý
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EnrollmentManager;