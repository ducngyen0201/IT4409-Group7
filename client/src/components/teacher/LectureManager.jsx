// file: client/src/components/teacher/LectureManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function LectureManager({ courseId }) {
  const [lectures, setLectures] = useState([]);
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [uploadingId, setUploadingId] = useState(null); // ID bài giảng đang upload

  // 1. Hàm lấy danh sách bài giảng
  const fetchLectures = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/courses/${courseId}/lectures`, {
        // Cần token để xem được cả bài chưa publish
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
      });
      setLectures(response.data);
    } catch (err) {
      console.error("Lỗi tải bài giảng:", err);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, [courseId]);

  // 2. Hàm tạo bài giảng mới
  const handleAddLecture = async (e) => {
    e.preventDefault();
    if (!newLectureTitle.trim()) return;

    try {
      const token = sessionStorage.getItem('token');
      // POST /api/courses/:id/lectures
      await axios.post(
        `http://localhost:5000/api/courses/${courseId}/lectures`,
        { title: newLectureTitle, position: lectures.length + 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewLectureTitle('');
      fetchLectures(); // Tải lại danh sách
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi tạo bài giảng');
    }
  };

  // 3. Hàm Upload Video
  const handleUpload = async (lectureId, file) => {
    if (!file) return;
    
    // Tạo FormData để gửi file
    const formData = new FormData();
    formData.append('title', file.name);
    formData.append('type', 'VIDEO'); // Hardcode là VIDEO (hoặc bạn có thể làm dropdown chọn)
    formData.append('material', file);

    try {
      setUploadingId(lectureId); // Bật trạng thái loading cho bài này
      const token = sessionStorage.getItem('token');
      
      // POST /api/lectures/:id/materials
      await axios.post(
        `http://localhost:5000/api/lectures/${lectureId}/materials`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' 
          } 
        }
      );
      alert('Upload thành công!');
    } catch (err) {
      console.error(err);
      alert('Upload thất bại.');
    } finally {
      setUploadingId(null); // Tắt loading
    }
  };

  // 4. Hàm Xuất bản (Publish)
  const handlePublish = async (lectureId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/lectures/${lectureId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchLectures(); // Cập nhật lại giao diện (để hiện nút "Đã xuất bản")
    } catch (err) {
      alert('Lỗi xuất bản.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Form tạo bài giảng */}
      <div className="bg-gray-50 p-4 rounded border border-dashed border-gray-300">
        <form onSubmit={handleAddLecture} className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập tên bài giảng mới (VD: Chương 1: Giới thiệu)"
            className="flex-1 px-3 py-2 border rounded"
            value={newLectureTitle}
            onChange={(e) => setNewLectureTitle(e.target.value)}
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Thêm bài
          </button>
        </form>
      </div>

      {/* Danh sách bài giảng */}
      <div className="space-y-4">
        {lectures.map((lecture) => (
          <div key={lecture.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                {/* Tiêu đề bài giảng */}
                <h3 className="font-semibold text-lg leading-tight">{lecture.title}</h3>
                
                <div className="flex items-center gap-2 mt-1">
                   
                   {/* Badge Trạng thái */}
                   <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${lecture.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                    {lecture.is_published ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                  
                  {/* Badge Quiz */}
                  {lecture.quiz_id ? (
                    <Link 
                      to={`/teacher/lectures/${lecture.id}/quiz`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                    >
                      ✏️ Sửa Quiz {lecture.quiz_published ? '(Đã đăng)' : '(Nháp)'}
                    </Link>
                  ) : (
                    <Link 
                      to={`/teacher/lectures/${lecture.id}/quiz`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      ➕ Tạo Quiz
                    </Link>
                  )}
                </div>

              </div>
              
              {!lecture.is_published && (
                <button
                  onClick={() => handlePublish(lecture.id)}
                  className="text-sm text-blue-600 hover:underline shrink-0 ml-4"
                >
                  Xuất bản ngay
                </button>
              )}
            </div>

            {/* Khu vực Upload */}
            <div className="mt-4 pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tài liệu / Video:
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                  onChange={(e) => handleUpload(lecture.id, e.target.files[0])}
                  disabled={uploadingId === lecture.id}
                />
                {uploadingId === lecture.id && (
                  <span className="text-sm text-indigo-600 font-medium animate-pulse">
                    Đang upload...
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {lectures.length === 0 && (
          <p className="text-center text-gray-500 italic">Chưa có bài giảng nào.</p>
        )}
      </div>
    </div>
  );
}

export default LectureManager;