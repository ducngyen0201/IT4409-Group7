import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuestionManager from '../../components/teacher/QuestionManager';
import { formatForInput } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';

function TeacherQuizEditor() {
  // Lấy cả 2 tham số (tùy vào route mà cái nào sẽ có giá trị)
  const { lectureId, quizId } = useParams(); 
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    time_limit_sec: 0,
    attempts_allowed: 1,
    is_published: false,
    shuffle_questions: false,
    due_at: ''
  });

  // 1. Tải dữ liệu (Xử lý cả 2 trường hợp)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        let res;

        if (quizId) {
          // TRƯỜNG HỢP 1: SỬA (Có quizId trên URL)
          res = await axios.get(`http://localhost:5000/api/quizzes/${quizId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (lectureId) {
          // TRƯỜNG HỢP 2: TẠO MỚI (Có lectureId trên URL)
          // Thử tìm xem lecture này đã có quiz chưa
          res = await axios.get(`http://localhost:5000/api/lectures/${lectureId}/quiz`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        // Nếu tìm thấy Quiz -> Điền dữ liệu
        if (res && res.data) {
          const data = res.data;
          setQuiz(data);
          setFormData({
            title: data.title,
            time_limit_sec: data.time_limit_sec ? Math.floor(data.time_limit_sec / 60) : 0,
            attempts_allowed: data.attempts_allowed || 1,
            is_published: data.is_published,
            shuffle_questions: data.shuffle_questions,
            due_at: formatForInput(data.due_at)
          });
        }
      } catch (err) {
        // Nếu lỗi 404 và đang ở mode lectureId -> Nghĩa là chưa có quiz -> Không sao
        if (err.response && err.response.status === 404 && lectureId) {
          // Giữ form trống để tạo mới
        } else {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lectureId, quizId]);

  // 2. Lưu Quiz
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = sessionStorage.getItem('token');
    
    const payload = {
      ...formData,
      time_limit_sec: formData.time_limit_sec * 60
    };
    
    try {
      if (quiz) {
        // Cập nhật (PATCH)
        await axios.patch(`http://localhost:5000/api/quizzes/${quiz.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Đã cập nhật thành công!");
      } else {
        // Tạo mới (POST) - Cần lectureId
        if (!lectureId) {
          alert("Lỗi: Không tìm thấy ID bài giảng để tạo Quiz.");
          return;
        }
        const res = await axios.post(`http://localhost:5000/api/lectures/${lectureId}/quiz`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuiz(res.data);
        // Sau khi tạo xong, chuyển hướng URL sang dạng /quizzes/:id để đồng bộ
        navigate(`/manage/quizzes/${res.data.id}`, { replace: true });
      }
    } catch (err) {
      console.error("Lỗi lưu:", err);
      alert("Lỗi khi lưu Quiz.");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Xuất bản
  const handlePublish = async () => {
    if (!window.confirm("Xuất bản ngay?")) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/quizzes/${quiz.id}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuiz({ ...quiz, is_published: true });
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            {quiz ? 'Chỉnh sửa Đề Thi' : 'Tạo Đề Thi Mới'}
            {quiz && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                quiz.is_published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
                {quiz.is_published ? '● Đã Xuất Bản' : '○ Bản Nháp'}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {quiz && !quiz.is_published && (
            <button onClick={handlePublish} className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 shadow transition">
              🚀 Xuất bản ngay
            </button>
          )}
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
            Quay lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI: CẤU HÌNH */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-4">
            <h2 className="font-bold text-lg mb-5 text-gray-800">⚙️ Cấu hình chung</h2>
            <form onSubmit={handleSaveQuiz} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên bài kiểm tra</label>
                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (Phút)</label>
                  <input type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                    value={formData.time_limit_sec} onChange={(e) => setFormData({...formData, time_limit_sec: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lần làm</label>
                  <input type="number" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                    value={formData.attempts_allowed} onChange={(e) => setFormData({...formData, attempts_allowed: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn chót</label>
                <input type="datetime-local" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                  value={formData.due_at} onChange={(e) => setFormData({...formData, due_at: e.target.value})} />
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <input type="checkbox" id="shuffle" className="w-4 h-4 text-indigo-600 rounded"
                  checked={formData.shuffle_questions} onChange={(e) => setFormData({...formData, shuffle_questions: e.target.checked})} />
                <label htmlFor="shuffle" className="text-sm text-gray-700 cursor-pointer select-none">Trộn câu hỏi</label>
              </div>
              <button type="submit" disabled={isSaving} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md transition disabled:opacity-70">
                {isSaving ? 'Đang lưu...' : 'Lưu Cài Đặt'}
              </button>
            </form>
          </div>
        </div>

        {/* CỘT PHẢI: QUẢN LÝ CÂU HỎI */}
        <div className="lg:col-span-2">
          {quiz ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="font-bold text-lg text-gray-800">📋 Danh sách câu hỏi</h2>
              </div>
              <QuestionManager quizId={quiz.id} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
              <h3 className="text-lg font-bold text-gray-700">Chưa có bài kiểm tra</h3>
              <p className="text-gray-500 mt-2">Nhấn <strong>"Lưu Cài Đặt"</strong> để bắt đầu thêm câu hỏi.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherQuizEditor;