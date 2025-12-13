import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Link } from 'react-router-dom';
import CustomModal from '../CustomModal';

function LectureManager({ courseId }) {
  const [lectures, setLectures] = useState([]);
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [uploadingId, setUploadingId] = useState(null); 

  // --- STATE MODAL ---
  const [modal, setModal] = useState({
    isOpen: false, type: 'alert', title: '', message: '', defaultValue: '', onConfirm: () => {}
  });
  const closeModal = () => setModal({ ...modal, isOpen: false });
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => {} });

  // 1. Hàm lấy danh sách
  const fetchLectures = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axiosClient.get(`/api/courses/${courseId}/lectures`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLectures(response.data);
    } catch (err) {
      console.error("Lỗi tải bài giảng:", err);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, [courseId]);

  // 2. Tạo bài giảng
  const handleAddLecture = async (e) => {
    e.preventDefault();
    if (!newLectureTitle.trim()) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/courses/${courseId}/lectures`,
        { title: newLectureTitle, position: lectures.length + 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewLectureTitle('');
      fetchLectures();
    } catch (err) {
      showAlert('Lỗi', err.response?.data?.error || 'Lỗi tạo bài giảng');
    }
  };

  // 3. Upload Video
  const handleUpload = async (lectureId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('title', file.name);
    formData.append('type', 'VIDEO');
    formData.append('material', file);

    try {
      setUploadingId(lectureId);
      const token = sessionStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/lectures/${lectureId}/materials`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      showAlert('Thành công', 'Upload thành công!');
      fetchLectures();
    } catch (err) {
      console.error(err);
      showAlert('Lỗi', 'Upload thất bại.');
    } finally {
      setUploadingId(null);
    }
  };

  // 4. Xuất bản
  const handlePublish = async (lectureId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/lectures/${lectureId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLectures();
      showAlert('Thành công', 'Đã xuất bản bài giảng.');
    } catch (err) {
      showAlert('Lỗi', 'Lỗi xuất bản.');
    }
  };

  // 5. Đổi tên tài liệu (Thay prompt)
  const handleRenameMaterial = (materialId, oldName) => {
    setModal({
      isOpen: true,
      type: 'prompt',
      title: 'Đổi tên tài liệu',
      message: 'Nhập tên mới cho tài liệu:',
      defaultValue: oldName,
      onConfirm: async (newName) => {
        if (!newName || newName === oldName) return;
        try {
          const token = sessionStorage.getItem('token');
          await axios.patch(`http://localhost:5000/api/materials/${materialId}`, 
            { title: newName },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          fetchLectures();
        } catch (err) {
          showAlert('Lỗi', 'Lỗi đổi tên.');
        }
      }
    });
  };

  // 6. Xóa tài liệu (Thay confirm)
  const handleDeleteMaterial = (materialId) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa file này không?',
      onConfirm: async () => {
        try {
          const token = sessionStorage.getItem('token');
          await axios.delete(`http://localhost:5000/api/materials/${materialId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchLectures();
        } catch (err) {
          showAlert('Lỗi', 'Lỗi xóa file.');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* MODAL */}
      <CustomModal {...modal} onClose={closeModal} />

      {/* Form tạo bài giảng */}
      <div className="bg-gray-50 p-4 rounded border border-dashed border-gray-300">
        <form onSubmit={handleAddLecture} className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập tên bài giảng mới..."
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={newLectureTitle}
            onChange={(e) => setNewLectureTitle(e.target.value)}
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium">
            Thêm bài
          </button>
        </form>
      </div>

      {/* Danh sách bài giảng */}
      <div className="space-y-4">
        {lectures.map((lecture) => {
          const existingQuiz = lecture.quizzes && lecture.quizzes.length > 0 ? lecture.quizzes[0] : null;

          return (
            <div key={lecture.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{lecture.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                     <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${lecture.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                      {lecture.is_published ? '● Đã xuất bản' : '○ Bản nháp'}
                    </span>
                    
                    {existingQuiz ? (
                      <Link to={`/manage/quizzes/${existingQuiz.id}`} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200 transition-colors">
                        ✏️ Sửa Quiz {existingQuiz.is_published ? '(Đã đăng)' : '(Nháp)'}
                      </Link>
                    ) : (
                      <Link to={`/manage/lectures/${lecture.id}/quiz/new`} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-colors">
                        ➕ Tạo Quiz
                      </Link>
                    )}
                  </div>
                </div>
                
                {!lecture.is_published && (
                  <button onClick={() => handlePublish(lecture.id)} className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline">
                    Xuất bản ngay
                  </button>
                )}
              </div>

              <div className="p-4 bg-gray-50">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tài liệu / Video</h4>
                
                {lecture.materials && lecture.materials.length > 0 ? (
                  <ul className="space-y-2 mb-4">
                    {lecture.materials.map(mat => (
                      <li key={mat.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-lg">🎥</span>
                          <a href={mat.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                            {mat.title}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => handleRenameMaterial(mat.id, mat.title)}
                            className="text-gray-500 hover:text-indigo-600 p-1" title="Đổi tên">
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteMaterial(mat.id)}
                            className="text-gray-500 hover:text-red-600 p-1" title="Xóa">
                            🗑️
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-4">Chưa có video nào.</p>
                )}

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <span>📤 Tải video lên</span>
                    <input 
                      type="file" className="hidden"
                      onChange={(e) => handleUpload(lecture.id, e.target.files[0])}
                      disabled={uploadingId === lecture.id}
                    />
                  </label>
                  {uploadingId === lecture.id && (
                    <span className="text-sm text-indigo-600 font-medium animate-pulse">⏳ Đang tải lên...</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {lectures.length === 0 && <p className="text-center text-gray-500 italic py-8">Chưa có bài giảng nào. Hãy thêm bài đầu tiên!</p>}
      </div>
    </div>
  );
}

export default LectureManager;