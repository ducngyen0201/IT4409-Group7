import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';
import { BookPlus, ArrowLeft, Code, Info, CheckCircle2 } from 'lucide-react';
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
        message: 'Khóa học đã được tạo thành công!',
        onConfirm: () => { navigate(`/manage/courses/${newCourseId}`); }
      });
    } catch (err) {
      setModal({ isOpen: true, type: 'alert', title: 'Lỗi', message: err.response?.data?.error || 'Không thể tạo khóa học.', onConfirm: closeModal });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 md:p-12 font-sans flex flex-col items-center">
      <CustomModal {...modal} onClose={closeModal} />
      
      {/* Container chính: Chiếm 100% trên mobile, max-width trên PC */}
      <div className="w-full max-w-3xl animate-fade-in-up">
        
        {/* Nút quay lại: Chỉnh text nhỏ hơn trên mobile */}
        <Link to="/" className="flex items-center gap-2 mb-6 text-gray-400 hover:text-indigo-600 w-fit group font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all">
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-2 transition-transform" /> Quay lại Dashboard
        </Link>

        <div className="bg-white shadow-2xl rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-gray-100 ring-4 md:ring-8 ring-white/50">
          
          {/* Header: Giảm padding trên mobile */}
          <div className="p-6 md:p-12 bg-indigo-600 text-white">
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 text-center sm:text-left">
              <div className="p-3 md:p-5 bg-white/20 rounded-2xl md:rounded-3xl backdrop-blur-md shadow-inner">
                <BookPlus className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <div>
                <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-tight">Khởi tạo bài giảng</h2>
                <p className="text-indigo-100 mt-1 md:mt-2 text-xs md:text-sm font-medium opacity-80">Thiết lập nền tảng kiến thức</p>
              </div>
            </div>
          </div>
          
          {/* Form nội dung: Giảm padding trên mobile */}
          <div className="p-6 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-10">
              
              {/* Grid: 1 cột trên mobile, 2 cột từ màn hình md trở lên */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div className="group">
                  <label className="flex items-center gap-2 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    <Code className="w-3.5 h-3.5 text-indigo-500" /> Mã khóa học
                  </label>
                  <input 
                    type="text" name="code" placeholder="CS50, REACT-CB..." required 
                    className="w-full px-5 py-3.5 md:px-6 md:py-5 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-700 shadow-inner transition-all text-sm md:text-base" 
                    value={formData.code} onChange={handleChange} 
                  />
                </div>
                <div className="group">
                  <label className="flex items-center gap-2 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Tên hiển thị
                  </label>
                  <input 
                    type="text" name="title" placeholder="Lập trình ReactJS..." required 
                    className="w-full px-5 py-3.5 md:px-6 md:py-5 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-700 shadow-inner transition-all text-sm md:text-base" 
                    value={formData.title} onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  <Info className="w-3.5 h-3.5 text-indigo-500" /> Mô tả khóa học
                </label>
                <textarea 
                  name="description" rows="4" placeholder="Học viên sẽ đạt được gì..." required 
                  className="w-full px-5 py-3.5 md:px-6 md:py-5 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none font-medium text-gray-700 shadow-inner transition-all resize-none text-sm md:text-base" 
                  value={formData.description} onChange={handleChange} 
                />
              </div>

              {/* Nút bấm: Xếp chồng trên mobile cực nhỏ, ngang hàng trên mobile/tablet trở lên */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-6 border-t border-gray-50">
                <Link 
                  to="/admin" 
                  className="w-full sm:w-auto text-center px-10 py-4 font-black text-gray-400 hover:bg-gray-100 rounded-xl md:rounded-2xl text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all"
                >
                  Hủy bỏ
                </Link>
                <button 
                  type="submit" disabled={loading} 
                  className="w-full sm:w-auto px-10 md:px-14 py-4 font-black text-white bg-indigo-600 rounded-xl md:rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <BookPlus className="w-4 h-4 md:w-5 md:h-5" />}
                  {loading ? 'Đang tạo...' : 'Xác nhận tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateCoursePage;