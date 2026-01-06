import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import CustomModal from '../../components/CustomModal';
import { 
  Clock, CheckCircle, AlertCircle, Trophy, HelpCircle, ChevronRight, Timer 
} from 'lucide-react';

function StudentQuizView({ quizId }) {
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);

  const [modal, setModal] = useState({
    isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });
  const showModal = (title, message, type = 'alert', onConfirm = closeModal) => 
    setModal({ isOpen: true, type, title, message, onConfirm });

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
  });

  useEffect(() => {
    const checkActiveAttempt = async () => {
      try {
        const res = await axiosClient.get(`/api/quizzes/${quizId}/active-attempt`, getAuthHeader());
        if (res.data.attempt) {
          setAttempt(res.data.attempt);
          setQuestions(res.data.questions);
          setTimeLeft(res.data.time_remaining);
          const savedAnswers = {};
          res.data.answers.forEach(a => { savedAnswers[a.question_id] = a.selected_option_id; });
          setAnswers(savedAnswers);
        }
      } catch (err) { console.log("Không có bài làm dở dang."); }
      finally { setLoading(false); }
    };
    checkActiveAttempt();
  }, [quizId]);

  useEffect(() => {
    let timer;
    if (attempt && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && attempt) {
      showModal("Hết giờ!", "Thời gian làm bài đã hết, hệ thống sẽ tự động nộp bài.", "alert", () => executeSubmit());
    }
    return () => clearInterval(timer);
  }, [timeLeft, attempt]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.post(`/api/quizzes/${quizId}/attempts`, {}, getAuthHeader());
      setAttempt(res.data.attempt);
      setQuestions(res.data.questions);
      setTimeLeft(res.data.attempt.time_remaining || 900);
      setAnswers({});
    } catch (err) {
      showModal("Lỗi", err.response?.data?.error || "Không thể bắt đầu làm bài.");
    } finally { setLoading(false); }
  };

  const handleSelectOption = async (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    try {
      await axiosClient.post(`/api/attempts/${attempt.id}/answer`, {
        question_id: questionId, selected_option_id: optionId
      }, getAuthHeader());
    } catch (err) { console.error("Lỗi lưu đáp án"); }
  };

  const handleSubmit = async () => {
    const unanswered = questions.length - Object.keys(answers).length;
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Nộp bài thi',
      message: unanswered > 0 ? `Bạn còn ${unanswered} câu chưa làm. Bạn vẫn muốn nộp bài chứ?` : "Bạn có chắc chắn muốn kết thúc bài thi ngay bây giờ?",
      onConfirm: async () => { closeModal(); await executeSubmit(); }
    });
  };

  const executeSubmit = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.post(`/api/attempts/${attempt.id}/submit`, {}, getAuthHeader());
      setResult(res.data.result);
      setAttempt(null);
    } catch (err) { showModal("Lỗi", "Không thể nộp bài do lỗi máy chủ."); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="p-20 text-center font-bold text-indigo-600 animate-pulse text-xl tracking-widest uppercase">Đang xử lý...</div>;

  if (result) return (
    <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[2.5rem] shadow-2xl text-center border border-gray-100 animate-zoom-in">
      <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Hoàn thành!</h2>
      <div className="my-8 p-8 bg-green-50 rounded-3xl border border-green-100 ring-8 ring-green-50/50">
        <p className="text-green-600 font-black uppercase text-xs tracking-[0.2em]">Điểm số đạt được</p>
        <p className="text-7xl font-black text-green-700 mt-2">{result.score}</p>
      </div>
      <button onClick={() => setResult(null)} className="font-bold text-indigo-600 hover:text-indigo-800 transition">Quay lại danh sách</button>
    </div>
  );

  if (attempt) return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 pb-32">
      <CustomModal {...modal} onClose={closeModal} />
      <div className="sticky top-4 z-30 bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border border-gray-100 flex justify-between items-center transition-all">
        <div className="flex flex-col gap-1">
          <span className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Tiến độ bài làm</span>
          <div className="flex items-center gap-3">
             <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}></div>
             </div>
             <span className="text-xs font-black text-indigo-600 italic">{Math.round((Object.keys(answers).length / questions.length) * 100)}%</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 font-mono font-bold text-xl shadow-sm ${timeLeft < 60 ? 'border-red-500 text-red-600 animate-pulse' : 'border-indigo-600 text-indigo-700'}`}>
          <Timer className="w-6 h-6" /> {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="space-y-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xl font-black text-gray-800 mb-8 flex gap-4">
              <span className="text-indigo-600">Q{idx + 1}.</span> {q.prompt}
            </p>
            <div className="grid gap-4">
              {q.options.map(opt => (
                <label key={opt.id} className={`flex items-center gap-5 p-5 rounded-[1.5rem] border-2 transition-all cursor-pointer ${answers[q.id] === opt.id ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50' : 'border-gray-50 hover:border-gray-200'}`}>
                  <input type="radio" className="w-6 h-6 accent-indigo-600" checked={answers[q.id] === opt.id} onChange={() => handleSelectOption(q.id, opt.id)} />
                  <span className="font-bold text-gray-700 text-lg">{opt.content}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => handleSubmit()} className="w-full py-6 bg-indigo-600 text-white font-black text-2xl rounded-3xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest">Nộp bài thi</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-8">
      <div className="p-8 bg-indigo-50 rounded-[2.5rem] text-indigo-600 shadow-inner"><HelpCircle className="w-20 h-20" /></div>
      <div>
        <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Bài kiểm tra trắc nghiệm</h3>
        <p className="text-gray-400 mt-2 font-medium">Hãy chuẩn bị sẵn sàng trước khi bắt đầu bài làm.</p>
      </div>
      <button onClick={handleStart} className="px-16 py-5 bg-indigo-600 text-white font-black text-xl rounded-full shadow-2xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest">Bắt đầu ngay</button>
    </div>
  );
}

export default StudentQuizView;