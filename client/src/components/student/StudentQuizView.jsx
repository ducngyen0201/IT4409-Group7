import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import CustomModal from '../../components/CustomModal';
import { 
  Clock, CheckCircle, AlertCircle, Trophy, HelpCircle, ChevronRight, Timer, FileText 
} from 'lucide-react';

function StudentQuizView({ quizId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);

  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {} });

  const closeModal = () => setModal({ ...modal, isOpen: false });
  const showModal = (title, message, type = 'alert', onConfirm = closeModal) => 
    setModal({ isOpen: true, type, title, message, onConfirm });

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } });

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
      executeSubmit();
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
    } catch (err) { showModal("Lỗi", "Không thể nộp bài."); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="p-10 text-center font-black text-indigo-500 animate-pulse text-xs tracking-[0.2em] uppercase">Đang tải dữ liệu...</div>;

  if (result) return (
    <div className="max-w-xs mx-auto mt-16 p-8 bg-white rounded-3xl shadow-xl text-center border border-gray-100">
      <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
      <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Hoàn thành!</h2>
      <div className="my-5 p-5 bg-green-50 rounded-2xl border border-green-100">
        <p className="text-green-600 font-bold uppercase text-[9px] tracking-widest">Điểm của bạn</p>
        <p className="text-5xl font-black text-green-700 mt-1">{result.score}</p>
      </div>
      <button onClick={onBack} className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition uppercase tracking-wider">Quay lại bài học</button>
    </div>
  );

  if (attempt) return (
    <div className="max-w-3xl mx-auto p-4 space-y-6 pb-20">
      <CustomModal {...modal} onClose={closeModal} />
      <div className="sticky top-2 z-30 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-100 flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-gray-500 uppercase text-[9px] tracking-wider">Tiến độ</span>
          <div className="flex items-center gap-2">
             <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}></div>
             </div>
             <span className="text-[10px] font-black text-indigo-600">{Math.round((Object.keys(answers).length / questions.length) * 100)}%</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-mono font-bold text-lg ${timeLeft < 60 ? 'border-red-500 text-red-600 animate-pulse' : 'border-indigo-600 text-indigo-700'}`}>
          <Timer size={18} /> {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-base font-black text-gray-800 mb-4 flex gap-2">
              <span className="text-indigo-600">Q{idx + 1}.</span> {q.prompt}
            </p>
            <div className="grid gap-2">
              {q.options.map(opt => (
                <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${answers[q.id] === opt.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-50 hover:border-gray-200'}`}>
                  <input type="radio" className="w-4 h-4 accent-indigo-600" checked={answers[q.id] === opt.id} onChange={() => handleSelectOption(q.id, opt.id)} />
                  <span className="font-bold text-gray-700 text-sm">{opt.content}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleSubmit} className="w-full py-4 bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest mt-4">Nộp bài thi</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
      <div className="p-6 bg-indigo-50 rounded-3xl text-indigo-600 shadow-inner">
        <HelpCircle className="w-14 h-14" />
      </div>
      <div>
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Bài kiểm tra trắc nghiệm</h3>
        <p className="text-gray-500 mt-1 text-sm font-medium">Hãy chuẩn bị sẵn sàng trước khi bắt đầu bài làm.</p>
      </div>
      <div className="flex flex-col gap-3">
        <button onClick={handleStart} className="px-10 py-3 bg-indigo-600 text-white font-black text-sm rounded-full shadow-xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest">
            Bắt đầu ngay
        </button>
        <button onClick={onBack} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest">Quay lại</button>
      </div>
    </div>
  );
}

export default StudentQuizView;