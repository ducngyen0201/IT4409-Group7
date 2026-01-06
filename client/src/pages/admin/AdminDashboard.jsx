import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomModal from '../../components/CustomModal';
import { formatDateTime } from '../../utils/dateUtils';
import { BookOpen, Users, Clock, Search, CheckCircle, XCircle, Eye, ShieldCheck, LayoutDashboard, X, ChevronRight, Video, HelpCircle } from 'lucide-react';
import TeacherStats from '../../components/teacher/TeacherStats'; 
import AdminUserManagement from './AdminUserManagement';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingStudentsCourseId, setViewingStudentsCourseId] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', confirmText: '', confirmColor: '', onConfirm: () => {} });
  const [preview, setPreview] = useState({ isOpen: false, courseTitle: '', lectures: [], isLoading: false });

  const closeModal = () => setModal({ ...modal, isOpen: false });
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => {} });
  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/api/admin/courses', getAuthHeader());
      setCourses(res.data);
    } catch (err) { showAlert('Lỗi', 'Không thể tải danh sách.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;
    const lowSearch = searchTerm.toLowerCase();
    return courses.filter(c => c.title.toLowerCase().includes(lowSearch) || (c.instructor_name || '').toLowerCase().includes(lowSearch) || (c.code || '').toLowerCase().includes(lowSearch));
  }, [courses, searchTerm]);

  const pendingCourses = filteredCourses.filter(c => c.status === 'PENDING_REVIEW');
  const otherCourses = filteredCourses.filter(c => c.status !== 'PENDING_REVIEW');

  const stats = [
    { label: 'Tổng khóa học', value: courses.length, icon: <BookOpen />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Chờ duyệt', value: courses.filter(c => c.status === 'PENDING_REVIEW').length, icon: <Clock />, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Đã xuất bản', value: courses.filter(c => c.status === 'APPROVED').length, icon: <CheckCircle />, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const handleUpdateStatus = (courseId, newStatus) => {
    if (newStatus === 'APPROVED') {
      setModal({ isOpen: true, type: 'confirm', title: 'Phê duyệt', message: 'Duyệt khóa học này ra công chúng?', confirmText: 'Duyệt', confirmColor: 'bg-green-600', onConfirm: async () => {
          try { await axiosClient.patch(`/api/admin/courses/${courseId}/status`, { status: 'APPROVED' }, getAuthHeader()); showAlert('Xong', 'Đã duyệt.'); fetchCourses(); }
          catch (err) { showAlert('Lỗi', 'Duyệt thất bại.'); }
      }});
    } else {
      setModal({ isOpen: true, type: 'prompt', title: 'Từ chối', message: 'Lý do gửi giảng viên:', confirmText: 'Gửi', confirmColor: 'bg-red-600', onConfirm: async (reason) => {
          if (!reason?.trim()) return showAlert('Lỗi', 'Phải nhập lý do.');
          try { await axiosClient.patch(`/api/admin/courses/${courseId}/status`, { status: 'DRAFT', reason }, getAuthHeader()); showAlert('Xong', 'Đã từ chối.'); fetchCourses(); }
          catch (err) { showAlert('Lỗi', 'Thất bại.'); }
      }});
    }
  };

  const handlePreviewContent = async (courseId, courseTitle) => {
    setPreview({ isOpen: true, courseTitle, lectures: [], isLoading: true });
    try {
      const res = await axiosClient.get(`/api/courses/${courseId}/lectures`, getAuthHeader());
      setPreview({ isOpen: true, courseTitle, lectures: res.data, isLoading: false });
    } catch (err) { setPreview(p => ({...p, isOpen: false, isLoading: false})); showAlert('Lỗi', 'Không thể tải.'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-10 font-sans">
      <CustomModal {...modal} onClose={closeModal} />
      
      <div className="max-w-7xl mx-auto mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div><h1 className="text-4xl font-black text-gray-900 flex items-center gap-4"><ShieldCheck className="w-12 h-12 text-indigo-600" /> Admin Panel</h1></div>
        <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <button onClick={() => setActiveTab('courses')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'courses' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400'}`}>📚 Khóa học</button>
          <button onClick={() => setActiveTab('users')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400'}`}>👥 Người dùng</button>
        </div>
      </div>

      {activeTab === 'courses' ? (
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 ring-8 ring-white/50 hover:scale-[1.02] transition-transform">
                <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner`}>{stat.icon}</div>
                <div><p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p><p className="text-4xl font-black text-gray-800 leading-none">{stat.value}</p></div>
              </div>
            ))}
          </div>

          <div className="relative group max-w-2xl"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-6 h-6 group-focus-within:text-indigo-600" /><input type="text" placeholder="Tìm tên khóa học, giảng viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-14 py-5 bg-white border-none rounded-[2rem] shadow-sm focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-gray-700" />{searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-5 h-5" /></button>}</div>

          <section className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-10 py-8 border-b bg-orange-50/20"><h2 className="text-xl font-black text-orange-700 uppercase tracking-tighter flex items-center gap-3"><Clock className="w-6 h-6" /> Yêu cầu phê duyệt</h2></div>
            <div className="overflow-x-auto"><table className="w-full text-left"><tbody className="divide-y divide-gray-50">{pendingCourses.map(course => (
              <tr key={course.id} className="hover:bg-gray-50/50 transition-all"><td className="px-10 py-8"><p className="font-black text-gray-800 text-lg leading-none mb-1">{course.title}</p><p className="text-xs text-gray-400 font-mono">CODE: {course.code}</p></td><td className="px-10 py-8"><p className="font-bold text-gray-700">{course.instructor_name}</p><p className="text-xs text-gray-400">{course.instructor_email}</p></td><td className="px-10 py-8 text-right space-x-3"><button onClick={() => handlePreviewContent(course.id, course.title)} className="p-3 text-indigo-600 bg-indigo-50 rounded-2xl hover:bg-indigo-100 transition shadow-sm"><Eye className="w-6 h-6" /></button><button onClick={() => handleUpdateStatus(course.id, 'APPROVED')} className="p-3 text-white bg-green-500 rounded-2xl hover:bg-green-600 shadow-lg shadow-green-100"><CheckCircle className="w-6 h-6" /></button><button onClick={() => handleUpdateStatus(course.id, 'DRAFT')} className="p-3 text-white bg-red-500 rounded-2xl hover:bg-red-600 shadow-lg shadow-red-100"><XCircle className="w-6 h-6" /></button></td></tr>
            ))}</tbody></table></div>
          </section>

          <section className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-10 py-8 border-b"><h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-3"><LayoutDashboard className="w-6 h-6 text-indigo-500" /> Quản lý nội dung</h2></div>
            <div className="overflow-x-auto"><table className="w-full text-left"><tbody className="divide-y divide-gray-50">{otherCourses.map(course => (
              <tr key={course.id} className="hover:bg-gray-50/30 transition-all"><td className="px-10 py-6"><p className="font-bold text-gray-800">{course.title}</p><p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">ID: #{course.id} • {formatDateTime(course.updated_at)}</p></td><td className="px-10 py-6 text-center"><span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${course.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{course.status}</span></td><td className="px-10 py-6 text-right space-x-2"><button onClick={() => handlePreviewContent(course.id, course.title)} className="text-[10px] font-black text-indigo-600 px-5 py-2.5 hover:bg-indigo-50 rounded-xl transition uppercase tracking-widest">Xem nội dung</button><button onClick={() => setViewingStudentsCourseId(course.id)} className="text-[10px] font-black text-blue-600 px-5 py-2.5 hover:bg-blue-50 rounded-xl transition uppercase tracking-widest">Học viên</button></td></tr>
            ))}</tbody></table></div>
          </section>
        </div>
      ) : <AdminUserManagement />}

      {preview.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/70 backdrop-blur-md p-6">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-zoom-in">
            <div className="px-12 py-10 border-b flex justify-between items-center bg-white sticky top-0 z-10"><div className="flex flex-col gap-1"><h3 className="text-3xl font-black text-gray-800 tracking-tighter leading-none">Xem nội dung</h3><p className="text-indigo-600 text-sm font-black truncate max-w-md">{preview.courseTitle}</p></div><button onClick={() => setPreview(p=>({...p, isOpen: false}))} className="p-4 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-3xl transition-all active:scale-90"><X className="w-10 h-10" /></button></div>
            <div className={`flex-1 p-12 bg-[#fcfcfc] ${preview.isLoading ? 'overflow-hidden' : 'overflow-y-auto'}`}>{preview.isLoading ? <div className="text-center py-24 flex flex-col items-center gap-4"><Loader2 className="w-16 h-16 text-indigo-600 animate-spin" /><p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] animate-pulse">Đang tải dữ liệu...</p></div> : preview.lectures.length === 0 ? <div className="text-center py-24 text-gray-300 flex flex-col items-center gap-4"><AlertCircle className="w-16 h-16" /><p className="text-lg font-bold italic">Chưa có bài học nào được đăng tải.</p></div> : (
              <div className="space-y-8">{preview.lectures.map((lec, idx) => (
                <div key={lec.id} className="bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 shadow-sm group hover:border-indigo-100 transition-colors"><div className="flex items-center gap-4 mb-6"><span className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg">{idx + 1}</span><h4 className="text-xl font-black text-gray-800 tracking-tight">{lec.title}</h4></div><div className="grid grid-cols-1 md:grid-cols-2 gap-10 ml-14"><div className="space-y-4"><p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2"><Video className="w-4 h-4" /> Tài liệu video</p>{lec.materials?.length > 0 ? <ul className="space-y-3">{lec.materials.map(m => (<li key={m.id} className="text-base font-bold text-blue-600 flex items-center gap-2"><ChevronRight className="w-4 h-4 opacity-30" /><a href={m.url} target="_blank" className="hover:underline">{m.title}</a></li>))}</ul> : <p className="text-xs text-gray-400 italic">Trống</p>}</div><div className="space-y-4"><p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2"><HelpCircle className="w-4 h-4" /> Bài kiểm tra</p>{lec.quizzes?.length > 0 ? <ul className="space-y-3">{lec.quizzes.map(q => (<li key={q.id} className="text-base font-bold text-emerald-600 flex items-center gap-2"><ChevronRight className="w-4 h-4 opacity-30" /> {q.title} <span className="text-[10px] text-gray-400">({q.questions_count} câu)</span></li>))}</ul> : <p className="text-xs text-gray-400 italic">Trống</p>}</div></div></div>
              ))}</div>
            )}</div>
          </div>
        </div>
      )}

{viewingStudentsCourseId && (
  <div className="fixed inset-0 z-[130] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-fade-in">
    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-zoom-in">
       <div className="px-8 py-6 border-b flex justify-between items-center bg-white sticky top-0 shadow-sm">
         <h3 className="text-lg md:text-xl font-black text-gray-800 tracking-tight uppercase leading-none">
           Thống kê học viên
         </h3>
         <button 
           onClick={() => setViewingStudentsCourseId(null)} 
           className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-red-100"
         >
           <X className="w-8 h-8" />
         </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#fdfdfd]">
              <TeacherStats courseId={viewingStudentsCourseId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;