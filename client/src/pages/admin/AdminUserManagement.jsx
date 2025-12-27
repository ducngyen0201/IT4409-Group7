import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDateTime } from '../../utils/dateUtils';

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Lấy danh sách người dùng
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const res = await axiosClient.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Lỗi tải người dùng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Xử lý Khóa/Mở khóa tài khoản
  const handleToggleStatus = async (user) => {
    const action = user.is_active ? 'KHÓA' : 'MỞ KHÓA';
    if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản của ${user.full_name}?`)) return;

    try {
      const token = sessionStorage.getItem('token');
      // Gọi API cập nhật trạng thái (is_active: true/false)
      await axiosClient.patch(`/api/admin/users/${user.id}/status`, 
        { is_active: !user.is_active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Cập nhật lại danh sách tại chỗ để thấy thay đổi ngay lập tức
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, is_active: !user.is_active } : u
      ));
    } catch (err) {
      alert("Không thể cập nhật trạng thái người dùng.");
    }
  };

  if (loading) return <div className="p-10"><LoadingSpinner /></div>;

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Người dùng</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Vai trò</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ngày tham gia</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img 
                      className="h-10 w-10 rounded-full object-cover border border-gray-100" 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`} 
                      alt="" 
                    />
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full 
                    ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_active ? (
                    <span className="flex items-center text-xs font-bold text-green-600">
                      <span className="h-2 w-2 bg-green-600 rounded-full mr-1.5 animate-pulse"></span>
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="flex items-center text-xs font-bold text-red-600">
                      <span className="h-2 w-2 bg-red-600 rounded-full mr-1.5"></span>
                      Bị khóa
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(user.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {/* Không cho phép Admin tự khóa chính mình */}
                  {user.role !== 'ADMIN' && (
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`px-4 py-1 rounded text-xs font-bold transition-all
                        ${user.is_active 
                          ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' 
                          : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'}`}
                    >
                      {user.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUserManagement;