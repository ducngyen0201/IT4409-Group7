import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Link } from 'react-router-dom';
import CustomModal from '../CustomModal';

function LectureManager({ courseId }) {
  const [lectures, setLectures] = useState([]);
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [uploadingId, setUploadingId] = useState(null); 

  const [modal, setModal] = useState({
    isOpen: false, type: 'alert', title: '', message: '', defaultValue: '', onConfirm: () => {}
  });
  const closeModal = () => setModal({ ...modal, isOpen: false });
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => {} });

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

  const handleAddLecture = async (e) => {
    e.preventDefault();
    if (!newLectureTitle.trim()) return;
    try {
      await axiosClient.post(
        `/api/courses/${courseId}/lectures`,
        { title: newLectureTitle, position: lectures.length + 1 }
      );
      setNewLectureTitle('');
      fetchLectures();
    } catch (err) {
      showAlert('Lỗi', err.response?.data?.error || 'Lỗi tạo bài giảng');
    }
  };

  // 3. Upload File (Video/Tài liệu)
 const handleUpload = async (lectureId, file) => {
  if (!file) return;
  const defaultTitle = file.name.includes('.') 
    ? file.name.substring(0, file.name.lastIndexOf('.')) 
    : file.name;
  setModal({
    isOpen: true,
    type: 'prompt',
    title: 'Tải tài liệu lên',
    message: 'Nhập tên hiển thị cho tài liệu này:',
    defaultValue: defaultTitle, // Đã sửa logic chạy từ dưới lên
    onConfirm: async (finalTitle) => {
      // Nếu người dùng xóa hết và nhấn OK, lấy lại tên mặc định
      const titleToUpload = finalTitle.trim() || defaultTitle;
      
      const isVideo = file.type.startsWith('video/');
      const fileType = isVideo ? 'VIDEO' : 'DOCUMENT';

      const formData = new FormData();
      formData.append('title', titleToUpload);
      formData.append('type', fileType); 
      formData.append('file', file);

      try {
        setUploadingId(lectureId);
        await axiosClient.post(
          `/api/lectures/${lectureId}/materials`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        showAlert('Thành công', 'Đã tải lên tài liệu thành công!');
        fetchLectures();
      } catch (err) {
        console.error(err);
        showAlert('Lỗi', 'Upload thất bại.');
      } finally {
        setUploadingId(null);
      }
    }
  });
};

  const handlePublish = async (lectureId) => {
    try {
      await axiosClient.post(`/api/lectures/${lectureId}/publish`);
      fetchLectures();
      showAlert('Thành công', 'Đã xuất bản bài giảng.');
    } catch (err) {
      showAlert('Lỗi', 'Lỗi xuất bản.');
    }
  };

  const handleRenameMaterial = (materialId, oldName) => {
    setModal({
      isOpen: true,
      type: 'prompt',
      title: 'Đổi tên tài liệu',
      message: 'Nhập tên mới:',
      defaultValue: oldName,
      onConfirm: async (newName) => {
        if (!newName || newName === oldName) return;
        try {
          // SỬA: Dùng axiosClient
          await axiosClient.patch(`/api/materials/${materialId}`, { title: newName });
          fetchLectures();
        } catch (err) {
          showAlert('Lỗi', 'Lỗi đổi tên.');
        }
      }
    });
  };

  const handleDeleteMaterial = (materialId) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Xác nhận xóa',
      message: 'Hành động này sẽ xóa file vĩnh viễn trên Cloudinary. Bạn chắc chắn chứ?',
      onConfirm: async () => {
        try {
          // SỬA: Dùng axiosClient
          await axiosClient.delete(`/api/materials/${materialId}`);
          fetchLectures();
        } catch (err) {
          showAlert('Lỗi', 'Lỗi xóa file.');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <CustomModal {...modal} onClose={closeModal} />

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
                          {/* SỬA: Hiển thị icon theo loại file */}
                          <span className="text-lg">{mat.type === 'VIDEO' ? '🎥' : '📄'}</span>
                          {/* SỬA: mat.url -> mat.storage_key để khớp Database */}
                          <a href={mat.storage_key} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline truncate">
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
                  <p className="text-sm text-gray-400 italic mb-4">Chưa có tài liệu/video nào.</p>
                )}

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <span>📤 Tải tệp lên</span>
                    <input 
                      type="file" className="hidden"
                      accept="video/*,.pdf,.doc,.docx"
                      onChange={(e) => handleUpload(lecture.id, e.target.files[0])}
                      disabled={uploadingId === lecture.id}
                    />
                  </label>
                  {uploadingId === lecture.id && (
                    <span className="text-sm text-indigo-600 font-medium animate-pulse">⏳ Đang xử lý trên Cloud...</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {lectures.length === 0 && <p className="text-center text-gray-500 italic py-8">Chưa có bài giảng nào.</p>}
      </div>
    </div>
  );
}

export default LectureManager;