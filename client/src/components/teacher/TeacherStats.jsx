import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../LoadingSpinner';
import { Users, BookOpen, TrendingUp, Award, Search } from 'lucide-react'; // Sử dụng Lucide-react đồng bộ

function TeacherStats({ courseId }) {
  const [stats, setStats] = useState({
    students: [],
    total_students: 0,
    total_lectures: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
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

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; 
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  };

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  // Lọc danh sách: Chỉ lấy học viên đã vào lớp (APPROVED) và lọc theo tìm kiếm
  const approvedStudents = stats.students.filter(s => 
    s.enrollment_status === 'APPROVED' && 
    (s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const classAvgProgress = approvedStudents.length > 0
    ? approvedStudents.reduce((acc, curr) => acc + (curr.progress_percent || 0), 0) / approvedStudents.length
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. DASHBOARD TỔNG QUAN (CHỈ SỐ THỐNG KÊ) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-indigo-600">
            <Users size={20} />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tổng học viên</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{approvedStudents.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-green-500">
            <TrendingUp size={20} />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tiến độ TB lớp</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{Math.round(classAvgProgress)}%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-purple-500">
            <BookOpen size={20} />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Số bài giảng</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{stats.total_lectures}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-amber-500">
            <Award size={20} />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hoàn thành</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">
            {approvedStudents.filter(s => s.progress_percent === 100).length}
          </p>
        </div>
      </div>

      {/* 2. BẢNG CHI TIẾT TIẾN ĐỘ HỌC TẬP */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-md-center gap-4 bg-gray-50/30">
          <div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight">Bảng theo dõi học tập</h2>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">Dữ liệu thời gian thực</p>
          </div>
          
          {/* Thanh tìm kiếm học viên */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Tìm học viên..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left border-b border-gray-50">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Học viên</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiến độ hoàn thành</th>
                <th className="px-8 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {approvedStudents.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-8 py-20 text-center text-gray-400 italic font-medium">
                    Không tìm thấy dữ liệu học viên.
                  </td>
                </tr>
              ) : (
                approvedStudents.map((student) => (
                  <tr key={student.student_id} className="group hover:bg-indigo-50/30 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <img 
                          src={getAvatarUrl(student.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=random`} 
                          className="w-10 h-10 rounded-2xl object-cover border-2 border-white shadow-sm" 
                          alt="" 
                        />
                        <div>
                          <p className="text-sm font-black text-gray-800 leading-none mb-1">{student.full_name}</p>
                          <p className="text-[11px] text-gray-400 font-bold tracking-tight">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              student.progress_percent === 100 ? 'bg-green-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${student.progress_percent}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-black text-gray-700 w-10">{student.progress_percent}%</span>
                      </div>
                    </td>

                    <td className="px-8 py-5 text-center">
                      {student.progress_percent === 100 ? (
                        <span className="px-3 py-1.5 bg-green-50 text-green-600 text-[9px] font-black rounded-xl uppercase tracking-wider border border-green-100">
                          Đã hoàn thành
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-xl uppercase tracking-wider border border-indigo-100">
                          Đang học
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TeacherStats;