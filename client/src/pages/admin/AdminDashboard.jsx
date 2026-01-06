import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomModal from '../../components/CustomModal';
import { formatDateTime } from '../../utils/dateUtils';
import { BookOpen, Users, Clock, Search, CheckCircle, XCircle, Eye, ShieldCheck, LayoutDashboard, X, ChevronRight, Video, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
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
    { label: 'Tổng khóa học', value: courses.length, icon: <BookOpen className="w-5 h-5"/>, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Chờ duyệt', value: courses.filter(c => c.status === 'PENDING_REVIEW').length, icon: <Clock className="w-5 h-5"/>, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Đã xuất bản', value: courses.filter(c => c.status === 'APPROVED').length, icon: <CheckCircle className="w-5 h-5"/>, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const handleUpdateStatus = (courseId, newStatus) => {
    if (newStatus === 'APPROVED') {
      setModal({ isOpen: true, type: 'confirm', title: 'Phê duyệt', message: 'Duyệt khóa học này?', confirmText: 'Duyệt', confirmColor: 'bg-green-600', onConfirm: async () => {
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
    <div className="min-h-screen bg-[#f9fafb] p-4 md:p-8 font-sans text-sm">
      <CustomModal {...modal} onClose={closeModal} />
      
      <div className="max-w-7xl mx-auto mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" /> Admin Panel
          </h1>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button onClick={() => setActiveTab('courses')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'courses' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>📚 Khóa học</button>
          <button onClick={() => setActiveTab('users')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>👥 Người dùng</button>
        </div>
      </div>

      {activeTab === 'courses' ? (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:translate-y-[-2px] transition-transform">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>{stat.icon}</div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
                  <p className="text-2xl font-black text-gray-800 leading-none">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Tìm kiếm nhanh..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-gray-700" />
          </div>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b bg-orange-50/20 flex items-center justify-between">
              <h2 className="text-sm font-black text-orange-700 uppercase tracking-tight flex items-center gap-2"><Clock className="w-4 h-4" /> Yêu cầu phê duyệt</h2>
              <span className="bg-orange-200 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingCourses.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-gray-50">
                  {pendingCourses.map(course => (
                    <tr key={course.id} className="hover:bg-gray-50/50 transition-all">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800 text-sm mb-0.5">{course.title}</p>
                        <p className="text-[11px] text-gray-500 font-mono">CODE: {course.code}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-700 text-xs">{course.instructor_name}</p>
                        <p className="text-[11px] text-gray-500">{course.instructor_email}</p>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5">
                        <button onClick={() => handlePreviewContent(course.id, course.title)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Xem nhanh"><Eye className="w-5 h-5" /></button>
                        <button onClick={() => handleUpdateStatus(course.id, 'APPROVED')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Phê duyệt"><CheckCircle className="w-5 h-5" /></button>
                        <button onClick={() => handleUpdateStatus(course.id, 'DRAFT')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Từ chối"><XCircle className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingCourses.length === 0 && <p className="p-6 text-center text-gray-500 italic text-xs">Không có yêu cầu nào.</p>}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">Quản lý nội dung</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-gray-50">
                  {otherCourses.map(course => (
                    <tr key={course.id} className="hover:bg-gray-50/30 transition-all">
                      <td className="px-6 py-3">
                        <p className="font-bold text-gray-800 text-sm">{course.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">ID: #{course.id} • {formatDateTime(course.updated_at)}</p>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${course.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{course.status}</span>
                      </td>
                      <td className="px-6 py-3 text-right space-x-1">
                        <button onClick={() => handlePreviewContent(course.id, course.title)} className="text-[10px] font-bold text-indigo-600 px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition">Nội dung</button>
                        <button onClick={() => setViewingStudentsCourseId(course.id)} className="text-[10px] font-bold text-blue-600 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition">Học viên</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : <AdminUserManagement />}

      {preview.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-zoom-in">
            <div className="px-8 py-5 border-b flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xl font-black text-gray-800 tracking-tight">Chi tiết bài giảng</h3>
                <p className="text-indigo-600 text-xs font-bold truncate max-w-md">{preview.courseTitle}</p>
              </div>
              <button onClick={() => setPreview(p=>({...p, isOpen: false}))} className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className={`flex-1 p-6 bg-gray-50 ${preview.isLoading ? 'overflow-hidden' : 'overflow-y-auto'}`}>
              {preview.isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Đang tải nội dung...</p>
                </div>
              ) : preview.lectures.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <AlertCircle className="w-12 h-12" />
                  <p className="text-sm font-medium italic">Chưa có bài học nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {preview.lectures.map((lec, idx) => (
                    <div key={lec.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-7 h-7 bg-gray-800 text-white rounded-lg flex items-center justify-center text-xs font-black shadow-md">{idx + 1}</span>
                        <h4 className="text-base font-black text-gray-800 tracking-tight">{lec.title}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-10">
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-2"><Video className="w-3.5 h-3.5" /> Video & Tài liệu</p>
                          {lec.materials?.length > 0 ? (
                            <ul className="space-y-2">
                              {lec.materials.map(m => (
                                <li key={m.id} className="text-xs font-semibold text-blue-600 flex items-center gap-2">
                                  <ChevronRight className="w-3 h-3 opacity-50" />
                                  <a href={m.url} target="_blank" className="hover:underline line-clamp-1">{m.title}</a>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-[11px] text-gray-400 italic">Trống</p>}
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-2"><HelpCircle className="w-3.5 h-3.5" /> Bài kiểm tra</p>
                          {lec.quizzes?.length > 0 ? (
                            <ul className="space-y-2">
                              {lec.quizzes.map(q => (
                                <li key={q.id} className="text-xs font-semibold text-emerald-600 flex items-center gap-2">
                                  <ChevronRight className="w-3 h-3 opacity-50" /> 
                                  <span className="line-clamp-1">{q.title}</span>
                                  <span className="text-[9px] text-gray-500 font-normal">({q.questions_count} câu)</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-[11px] text-gray-400 italic">Trống</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {viewingStudentsCourseId && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-zoom-in">
             <div className="px-6 py-4 border-b flex justify-between items-center bg-white sticky top-0 shadow-sm">
               <h3 className="text-base font-black text-gray-800 uppercase tracking-tight">Thống kê học viên</h3>
               <button onClick={() => setViewingStudentsCourseId(null)} className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl transition">
                 <X className="w-6 h-6" />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
               <TeacherStats courseId={viewingStudentsCourseId} />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;