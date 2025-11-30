import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Nhận thêm prop 'lectureTitle' để hiển thị cho rõ
function DiscussionSection({ lectureId, lectureTitle }) {
  const [threads, setThreads] = useState([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Mỗi khi lectureId thay đổi, hàm này sẽ chạy lại để tải thảo luận mới
  const fetchThreads = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/lectures/${lectureId}/threads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setThreads(response.data);
    } catch (err) {
      console.error("Lỗi tải thảo luận:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId) fetchThreads();
  }, [lectureId]); // <--- QUAN TRỌNG: Theo dõi sự thay đổi của lectureId

  // 2. Tạo thảo luận mới
  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim()) return;

    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/lectures/${lectureId}/threads`,
        { title: newThreadTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewThreadTitle('');
      fetchThreads();
    } catch (err) {
      alert('Không thể tạo thảo luận.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* HEADER NHỎ: Cho biết đang thảo luận bài nào */}
      <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
        <p className="text-xs text-indigo-800 font-semibold truncate">
          Đang thảo luận: {lectureTitle}
        </p>
      </div>

      {/* Form tạo câu hỏi */}
      <div className="p-4 border-b bg-gray-50">
        <form onSubmit={handleCreateThread}>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Bạn thắc mắc gì về bài này?"
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
          />
          <button 
            type="submit" 
            className="mt-2 w-full px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700"
          >
            Gửi câu hỏi
          </button>
        </form>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-xs text-gray-500">Đang tải thảo luận...</div>
        ) : threads.length === 0 ? (
          <div className="text-center text-xs text-gray-500">
            Chưa có câu hỏi nào cho bài giảng này. <br/>
            Hãy là người đầu tiên đặt câu hỏi!
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.id} className="border rounded bg-white p-3 shadow-sm">
              <div className="font-semibold text-sm text-gray-800">{thread.title}</div>
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>{thread.author_name}</span>
                <span>{new Date(thread.created_at).toLocaleDateString()}</span>
              </div>
              <button className="mt-2 text-xs text-indigo-600 hover:underline">
                Xem trả lời &rarr;
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DiscussionSection;