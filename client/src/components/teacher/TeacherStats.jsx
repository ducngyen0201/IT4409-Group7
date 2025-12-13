import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../LoadingSpinner';

function TeacherStats({ courseId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await axiosClient.get(`/api/courses/${courseId}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudents(res.data);
      } catch (err) {
        console.error("Lỗi tải thống kê:", err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchStats();
  }, [courseId]);

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  // Tính toán tổng quan
  const totalStudents = students.length;
  const classAvgScore = students.reduce((acc, curr) => acc + (parseFloat(curr.avg_score) || 0), 0) / (students.filter(s => s.avg_score).length || 1);
  const classAvgProgress = students.reduce((acc, curr) => acc + curr.progress_percent, 0) / (totalStudents || 1);

  return (
    <div className="space-y-6">
      
      {/* 1. CARD TỔNG QUAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-sm font-bold text-blue-800 uppercase">Tổng học viên</h3>
          <p className="text-3xl font-bold text-blue-600 mt-1">{totalStudents}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-sm font-bold text-green-800 uppercase">Tiến độ trung bình</h3>
          <p className="text-3xl font-bold text-green-600 mt-1">{Math.round(classAvgProgress)}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-sm font-bold text-purple-800 uppercase">Điểm Quiz trung bình</h3>
          <p className="text-3xl font-bold text-purple-600 mt-1">{classAvgScore.toFixed(1)} / 10</p>
        </div>
      </div>

      {/* 2. BẢNG CHI TIẾT */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-700">Danh sách chi tiết</h3>
        </div>
        
        {students.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic">Chưa có học viên nào đăng ký khóa học này.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Học viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiến độ học</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm TB Quiz</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {student.full_name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-middle">
                    <div className="w-full max-w-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-indigo-700">{student.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${student.progress_percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.avg_score !== null ? (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${parseFloat(student.avg_score) >= 8 ? 'bg-green-100 text-green-800' : 
                          parseFloat(student.avg_score) >= 5 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {student.avg_score} điểm
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Chưa làm bài</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TeacherStats;