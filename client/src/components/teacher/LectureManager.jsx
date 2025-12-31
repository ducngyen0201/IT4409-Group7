import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Link } from 'react-router-dom';
import CustomModal from '../CustomModal';
import { 
  Plus, Video, FileText, Pencil, Trash2, 
  Upload, CheckCircle2, Circle 
} from 'lucide-react';

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
      const response = await axiosClient.get(`/api/courses/${courseId}/lectures`);
      setLectures(response.data);
    } catch (err) {
      console.error("Lỗi tải bài giảng:", err);
    }
  };

  useEffect(() => {
    if (courseId) fetchLectures();
  }, [courseId]);

  const handleAddLecture = async (e) => {
    e.preventDefault();
    if (!newLectureTitle.trim()) return;
    try {
      await axiosClient.post(`/api/courses/${courseId}/lectures`, { 
        title: newLectureTitle, 
        position: lectures.length + 1 
      });
      setNewLectureTitle('');
      fetchLectures();
    } catch (err) {
      showAlert('Lỗi', err.response?.data?.error || 'Lỗi tạo bài giảng');
    }
  };

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
      defaultValue: defaultTitle,
      onConfirm: async (finalTitle) => {
        const titleToUpload = finalTitle.trim() || defaultTitle;
        const isVideo = file.type.startsWith('video/');
        const fileType = isVideo ? 'VIDEO' : 'DOCUMENT';

        const formData = new FormData();
        formData.append('title', titleToUpload);
        formData.append('type', fileType); 
        formData.append('file', file);

        try {
          setUploadingId(lectureId);
          await axiosClient.post(`/api/lectures/${lectureId}/materials`, formData, { 
            headers: { 'Content-Type': 'multipart/form-data' } 
          });
          showAlert('Thành công', 'Đã tải lên tài liệu thành công!');
          fetchLectures();
        } catch (err) {
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

  return (
    <div className="space-y-6">
      <CustomModal {...modal} onClose={closeModal} />

      {/* Form thêm bài giảng mới */}
      <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200">
        <form onSubmit={handleAddLecture} className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập tên bài giảng mới..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newLectureTitle}
            onChange={(e) => setNewLectureTitle(e.target.value)}
          />
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center gap-2">
            <Plus size={18} /> Thêm bài
          </button>
        </form>
      </div>

      {/* Danh sách bài giảng */}
      <div className="space-y-4">
        {lectures.map((lecture) => {
          const existingQuiz = lecture.quizzes?.[0];

          return (
            <div key={lecture.id} className="border rounded-xl bg-white shadow-sm overflow-hidden border-gray-100">
              <div className="p-4 bg-white border-b border-gray-50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800">{lecture.title}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      lecture.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {lecture.is_published ? <CheckCircle2 size={12}/> : <Circle size={12}/>}
                      {lecture.is_published ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                    
                    {existingQuiz ? (
                      <Link to={`/manage/quizzes/${existingQuiz.id}`} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700 uppercase hover:bg-purple-200 border border-purple-200 transition-colors">
                        ✏️ Sửa Quiz {existingQuiz.is_published ? '(Đã đăng)' : '(Nháp)'}
                      </Link>
                    ) : (
                      <Link to={`/manage/lectures/${lecture.id}/quiz/new`} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 text-gray-600 uppercase hover:bg-gray-200 border border-gray-200 transition-colors">
                        <Plus size={10} /> Tạo Quiz
                      </Link>
                    )}
                  </div>
                </div>
                
                {!lecture.is_published && (
                  <button onClick={() => handlePublish(lecture.id)} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-tight">
                    Xuất bản ngay
                  </button>
                )}
              </div>

              <div className="p-4 bg-gray-50/50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tài liệu / Video</h4>
                
                {lecture.materials?.length > 0 ? (
                  <ul className="space-y-2 mb-4">
                    {lecture.materials.map(mat => (
                      <li key={mat.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-indigo-500">
                            {mat.type === 'VIDEO' ? <Video size={18} /> : <FileText size={18} />}
                          </span>
                          <a href={mat.storage_key} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-700 hover:text-indigo-600 truncate">
                            {mat.title}
                          </a>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"><Pencil size={14}/></button>
                          <button className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic mb-4">Chưa có bài giảng.</p>
                )}

                <div className="flex items-center gap-3">
                  <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all ${uploadingId === lecture.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Upload size={14} /> Tải tệp lên
                    <input 
                      type="file" className="hidden"
                      accept="video/*,.pdf,.doc,.docx"
                      onChange={(e) => handleUpload(lecture.id, e.target.files[0])}
                      disabled={uploadingId === lecture.id}
                    />
                  </label>
                  {uploadingId === lecture.id && (
                    <span className="text-xs text-indigo-600 font-bold animate-pulse">⏳ Đang tải lên...</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LectureManager;