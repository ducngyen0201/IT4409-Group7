import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../LoadingSpinner';

function TeacherStats({ courseId }) {
  // 1. Quản lý state cho cả mảng học viên và các thông số tổng quan
  const [students, setStudents] = useState([]);
  const [courseSummary, setCourseSummary] = useState({ total_students: 0, total_lectures: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await axiosClient.get(`/api/courses/${courseId}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // FIX: Truy cập vào đúng thuộc tính .students từ Object trả về
        const studentsData = res.data.students || [];
        setStudents(studentsData);
        
        // Lưu thêm thông tin tổng quan từ Backend
        setCourseSummary({
          total_students: res.data.total_students || 0,
          total_lectures: res.data.total_lectures || 0
        });

      } catch (err) {
        console.error("Lỗi tải thống kê:", err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchStats();
  }, [courseId]);

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  // 2. Tính toán an toàn (kiểm tra students có phải mảng không trước khi dùng reduce)
  const isArray = Array.isArray(students);
  const totalInList = isArray ? students.length : 0;
  
  const classAvgProgress = (isArray && totalInList > 0)
    ? students.reduce((acc, curr) => acc + (curr.progress_percent || 0), 0) / totalInList
    : 0;

  // Giả định bạn sẽ bổ sung avg_score vào SQL sau, hiện tại để tránh crash:
  const classAvgScore = (isArray && totalInList > 0)
    ? students.reduce((acc, curr) => acc + (parseFloat(curr.avg_score) || 0), 0) / (students.filter(s => s.avg_score).length || 1)
    : 0;

  return (
    <div className="space-y-6">
      
      {/* 1. CARD TỔNG QUAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-sm font-bold text-blue-800 uppercase">Tổng học viên</h3>
          <p className="text-3xl font-bold text-blue-600 mt-1">{courseSummary.total_students}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-sm font-bold text-green-800 uppercase">Tiến độ trung bình</h3>
          <p className="text-3xl font-bold text-green-600 mt-1">{Math.round(classAvgProgress)}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-sm font-bold text-purple-800 uppercase">Tổng bài giảng</h3>
          <p className="text-3xl font-bold text-purple-600 mt-1">{courseSummary.total_lectures}</p>
        </div>
      </div>

      {/* 2. BẢNG CHI TIẾT */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-700">Danh sách chi tiết học viên</h3>
        </div>
        
        {!isArray || students.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic">Chưa có học viên nào đăng ký khóa học này.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiến độ học</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {/* CẬP NHẬT: Dùng student.avatar và ảnh mặc định */}
                        <img 
                          className="h-10 w-10 rounded-full object-cover border border-gray-200" 
                          src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name || 'U')}&background=random`} 
                          alt="" 
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${student.progress_percent === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {student.progress_percent === 100 ? 'Hoàn thành' : 'Đang học'}
                    </span>
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