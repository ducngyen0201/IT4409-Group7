import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';
import { BookPlus, ArrowLeft, Code, Info } from 'lucide-react';
import CustomModal from '../../components/CustomModal';

function CreateCoursePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', code: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {} });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axiosClient.post('/api/courses', formData, { headers: { Authorization: `Bearer ${token}` } });
      const newCourseId = res.data.courseId || res.data.id;

      setModal({
        isOpen: true,
        type: 'alert',
        title: 'Thành công',
        message: 'Khóa học đã được khởi tạo thành công!',
        onConfirm: () => { navigate(`/manage/courses/${newCourseId}`); }
      });
    } catch (err) {
      setModal({ isOpen: true, type: 'alert', title: 'Lỗi', message: err.response?.data?.error || 'Không thể tạo khóa học.', onConfirm: closeModal });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 md:p-12 font-sans flex flex-col items-center">
      <CustomModal {...modal} onClose={closeModal} />
      <div className="w-full max-w-3xl animate-fade-in-up">
        <Link to="/admin" className="flex items-center gap-3 mb-8 text-gray-400 hover:text-indigo-600 w-fit group font-black text-xs uppercase tracking-[0.2em] transition-all">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" /> Quay lại Dashboard
        </Link>

        <div className="bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-gray-100 ring-8 ring-white/50">
          <div className="p-12 bg-indigo-600 text-white"><div className="flex items-center gap-6"><div className="p-5 bg-white/20 rounded-3xl backdrop-blur-md shadow-inner"><BookPlus className="w-10 h-10" /></div><div><h2 className="text-3xl font-black uppercase tracking-tight leading-none">Khởi tạo bài giảng</h2><p className="text-indigo-100 mt-2 font-medium opacity-80">Thiết lập nền tảng kiến thức cho học viên</p></div></div></div>
          
          <div className="p-12"><form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="group"><label className="flex items-center gap-3 mb-4 text-xs font-black text-gray-400 uppercase tracking-widest ml-1"><Code className="w-4 h-4 text-indigo-500" /> Mã khóa học</label><input type="text" name="code" placeholder="CS50, REACT-CB..." required className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-700 shadow-inner transition-all" value={formData.code} onChange={handleChange} /></div>
                <div className="group"><label className="flex items-center gap-3 mb-4 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">📝 Tên hiển thị</label><input type="text" name="title" placeholder="Lập trình ReactJS..." required className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-700 shadow-inner transition-all" value={formData.title} onChange={handleChange} /></div>
              </div>

              <div className="group"><label className="flex items-center gap-3 mb-4 text-xs font-black text-gray-400 uppercase tracking-widest ml-1"><Info className="w-4 h-4 text-indigo-500" /> Mô tả khóa học</label><textarea name="description" rows="5" placeholder="Học viên sẽ đạt được gì..." required className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none font-medium text-gray-700 shadow-inner transition-all resize-none" value={formData.description} onChange={handleChange} /></div>

              <div className="flex items-center justify-end gap-6 pt-6 border-t border-gray-50"><Link to="/admin" className="px-10 py-5 font-black text-gray-400 hover:bg-gray-100 rounded-2xl text-xs uppercase tracking-[0.2em] transition-all active:scale-95">Hủy bỏ</Link><button type="submit" disabled={loading} className="px-14 py-5 font-black text-white bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-[0.2em] flex items-center gap-3">{loading ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : <BookPlus className="w-5 h-5" />}{loading ? 'Đang khởi tạo...' : 'Xác nhận tạo'}</button></div>
          </form></div>
        </div>
      </div>
    </div>
  );
}

export default CreateCoursePage;