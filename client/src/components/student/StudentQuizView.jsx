import React, { useState, useEffect } from 'react';
import axios from 'axios';

function StudentQuizView({ quizId }) {
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(null); // Lượt làm bài hiện tại
  const [questions, setQuestions] = useState([]); // Danh sách câu hỏi
  const [result, setResult] = useState(null); // Kết quả sau khi nộp

  // State lưu đáp án đã chọn: { questionId: optionId }
  const [answers, setAnswers] = useState({});

  // 1. Hàm Bắt đầu làm bài
  const handleStart = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/quizzes/${quizId}/attempts`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAttempt(res.data.attempt);
      setQuestions(res.data.questions);
      // Reset answers
      setAnswers({});
    } catch (err) {
      alert(err.response?.data?.error || "Không thể bắt đầu làm bài.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Hàm Chọn đáp án (Auto-save)
  const handleSelectOption = async (questionId, optionId) => {
    // Cập nhật UI ngay lập tức cho mượt
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));

    // Gửi API lưu ngầm
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/attempts/${attempt.id}/answer`, {
        question_id: questionId,
        selected_option_id: optionId
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error("Lỗi lưu đáp án:", err);
    }
  };

  // 3. Hàm Nộp bài
  const handleSubmit = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn nộp bài?")) return;
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/attempts/${attempt.id}/submit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResult(res.data.result); // Lưu kết quả (điểm số)
      setAttempt(null); // Kết thúc chế độ làm bài
    } catch (err) {
      alert("Lỗi nộp bài.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang xử lý...</div>;

  // --- TRẠNG THÁI 1: HIỂN THỊ KẾT QUẢ (Sau khi nộp) ---
  if (result) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-5xl">🏆</div>
        <h2 className="text-2xl font-bold text-gray-800">Hoàn thành bài thi!</h2>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 inline-block">
          <p className="text-green-800 font-medium">Điểm số của bạn</p>
          <p className="text-4xl font-bold text-green-600">{result.score}</p>
        </div>
        <div>
          <button 
            onClick={() => setResult(null)} // Quay lại màn hình chính để làm lại (nếu còn lượt)
            className="text-indigo-600 hover:underline"
          >
            Quay lại / Làm lại
          </button>
        </div>
      </div>
    );
  }

  // --- TRẠNG THÁI 2: ĐANG LÀM BÀI ---
  if (attempt && questions.length > 0) {
    return (
      <div className="p-4 space-y-6">
        {/* Header: Chỉ hiện trạng thái và thời gian (nếu muốn làm thêm đồng hồ đếm ngược sau này) */}
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-bold text-indigo-700 flex items-center gap-2">
            📝 Đang làm bài...
          </span>
          <span className="text-xs text-gray-500">
            Số câu: {questions.length}
          </span>
        </div>

        {/* Danh sách câu hỏi */}
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white p-4 rounded shadow-sm border border-gray-100">
              <p className="font-medium text-gray-800 mb-3">
                <span className="text-indigo-600 font-bold mr-2">Câu {idx + 1}:</span>
                {q.prompt}
              </p>
              
              <div className="space-y-2">
                {q.options.map(opt => (
                  <label 
                    key={opt.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all duration-200
                      ${answers[q.id] === opt.id 
                        ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' 
                        : 'hover:bg-gray-50 border-gray-200'}`}
                  >
                    <input 
                      type="radio" 
                      name={`question-${q.id}`}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      checked={answers[q.id] === opt.id}
                      onChange={() => handleSelectOption(q.id, opt.id)}
                    />
                    <span className="text-sm text-gray-700">{opt.content}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Nút Nộp bài duy nhất ở cuối */}
        <div className="pt-4 border-t">
          <button 
            onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 transform transition hover:scale-[1.01]"
          >
            Nộp bài thi
          </button>
        </div>
      </div>
    );
  }

  // --- TRẠNG THÁI 3: MÀN HÌNH CHÀO (Chưa bắt đầu) ---
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="text-4xl">📝</div>
      <h3 className="text-xl font-bold text-gray-800">Bài kiểm tra trắc nghiệm</h3>
      <p className="text-gray-500 text-sm">
        Bài tập này giúp củng cố kiến thức của bạn sau khi xem video.
      </p>
      <button 
        onClick={handleStart}
        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-full shadow hover:bg-indigo-700 transition transform hover:scale-105"
      >
        Bắt đầu làm bài
      </button>
    </div>
  );
}

export default StudentQuizView;