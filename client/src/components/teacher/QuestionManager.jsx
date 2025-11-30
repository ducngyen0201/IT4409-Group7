import React, { useState, useEffect } from 'react';
import axios from 'axios';

function QuestionManager({ quizId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State form tạo câu hỏi mới
  const [newPrompt, setNewPrompt] = useState('');
  const [newPoints, setNewPoints] = useState(1);

  // State form tạo đáp án mới (lưu theo questionId)
  const [optionInputs, setOptionInputs] = useState({});

  // 1. Load danh sách câu hỏi
  const fetchQuestions = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/quizzes/${quizId}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) fetchQuestions();
  }, [quizId]);

  // 2. Thêm Câu hỏi
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/quizzes/${quizId}/questions`, {
        prompt: newPrompt,
        points: newPoints,
        type: 'SINGLE_CHOICE', // Mặc định trắc nghiệm 1 đáp án
        position: questions.length + 1
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setNewPrompt('');
      fetchQuestions();
    } catch (err) {
      alert('Lỗi thêm câu hỏi');
    }
  };

  // 3. Thêm Đáp án (Option)
  const handleAddOption = async (questionId) => {
    const content = optionInputs[questionId];
    if (!content) return;

    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/questions/${questionId}/options`, {
        content: content,
        is_correct: false, // Mặc định sai, giáo viên sẽ tích chọn đúng sau
        position: 1
      }, { headers: { Authorization: `Bearer ${token}` } });

      // Reset input
      setOptionInputs({ ...optionInputs, [questionId]: '' });
      fetchQuestions();
    } catch (err) {
      alert('Lỗi thêm đáp án');
    }
  };

  // 4. Đánh dấu đáp án đúng
  const handleSetCorrect = async (optionId, isCorrect) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/options/${optionId}`, {
        is_correct: isCorrect
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Xóa đáp án
  const handleDeleteOption = async (optionId) => {
    if(!window.confirm("Xóa đáp án này?")) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/options/${optionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQuestions();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div>Đang tải câu hỏi...</div>;

  return (
    <div className="space-y-8">
      {/* Form thêm câu hỏi */}
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <form onSubmit={handleAddQuestion} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Nhập nội dung câu hỏi mới..." 
            className="flex-1 px-3 py-2 border rounded"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            required
          />
          <input 
            type="number" 
            placeholder="Điểm" 
            className="w-20 px-3 py-2 border rounded"
            value={newPoints}
            onChange={(e) => setNewPoints(e.target.value)}
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
            + Thêm
          </button>
        </form>
      </div>

      {/* Danh sách câu hỏi */}
      {questions.map((q, idx) => (
        <div key={q.id} className="border rounded bg-white p-4 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg">Câu {idx + 1}: {q.prompt}</h3>
            <span className="text-sm bg-gray-100 px-2 py-1 rounded">{q.points} điểm</span>
          </div>

          {/* Danh sách đáp án */}
          <div className="ml-4 space-y-2">
            {q.options && q.options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-3 group">
                <input 
                  type="radio" 
                  checked={opt.is_correct} 
                  onChange={() => handleSetCorrect(opt.id, true)}
                  className="w-4 h-4 text-green-600 cursor-pointer"
                  name={`question-${q.id}`} // Group radio theo câu hỏi
                />
                <span className={opt.is_correct ? "text-green-700 font-medium" : "text-gray-700"}>
                  {opt.content}
                </span>
                <button 
                  onClick={() => handleDeleteOption(opt.id)}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 text-xs"
                >
                  Xóa
                </button>
              </div>
            ))}

            {/* Input thêm đáp án */}
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="text" 
                placeholder="Thêm lựa chọn..." 
                className="px-2 py-1 border rounded text-sm w-64"
                value={optionInputs[q.id] || ''}
                onChange={(e) => setOptionInputs({ ...optionInputs, [q.id]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddOption(q.id)}
              />
              <button 
                onClick={() => handleAddOption(q.id)}
                className="text-sm text-indigo-600 hover:underline"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default QuestionManager;