import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import CustomModal from '../CustomModal';
import { Plus, Trash2, Target, CheckCircle2, Circle, Loader2, AlertCircle, HelpCircle, Hash } from 'lucide-react';

function QuestionManager({ quizId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPrompt, setNewPrompt] = useState('');
  const [newPoints, setNewPoints] = useState(1);
  const [optionInputs, setOptionInputs] = useState({});
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {} });

  const closeModal = () => setModal({ ...modal, isOpen: false });
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => {} });
  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } });

  const fetchQuestions = async () => {
    try {
      const res = await axiosClient.get(`/api/quizzes/${quizId}/questions`, getAuthHeader());
      setQuestions(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if (quizId) fetchQuestions(); }, [quizId]);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;
    try {
      await axiosClient.post(`/api/quizzes/${quizId}/questions`, {
        prompt: newPrompt, points: newPoints, type: 'SINGLE_CHOICE', position: questions.length + 1
      }, getAuthHeader());
      setNewPrompt(''); fetchQuestions();
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err) { showAlert('Lỗi', 'Không thể thêm câu hỏi mới.'); }
  };

  const handleAddOption = async (questionId) => {
    const content = optionInputs[questionId];
    if (!content?.trim()) return;
    try {
      await axiosClient.post(`/api/questions/${questionId}/options`, {
        content: content, is_correct: false, position: 1
      }, getAuthHeader());
      setOptionInputs({ ...optionInputs, [questionId]: '' }); fetchQuestions();
    } catch (err) { showAlert('Lỗi', 'Không thể thêm đáp án.'); }
  };

  const handleSetCorrect = async (optionId, isCorrect) => {
    try {
      await axiosClient.patch(`/api/options/${optionId}`, { is_correct: isCorrect }, getAuthHeader());
      fetchQuestions();
    } catch (err) { showAlert('Lỗi', 'Cập nhật đáp án thất bại.'); }
  };

  const handleDeleteOption = (optionId) => {
    setModal({
      isOpen: true, type: 'confirm', title: 'Xóa đáp án',
      message: 'Lựa chọn này sẽ bị xóa vĩnh viễn khỏi câu hỏi. Bạn có chắc không?',
      onConfirm: async () => {
        try {
          await axiosClient.delete(`/api/options/${optionId}`, getAuthHeader());
          fetchQuestions();
          closeModal();
        } catch (err) { showAlert('Lỗi', 'Xóa đáp án thất bại.'); }
      }
    });
  };

  if (loading) return <div className="flex flex-col items-center py-24 space-y-4 text-indigo-600"><Loader2 className="w-12 h-12 animate-spin" /><p className="font-bold uppercase tracking-widest text-xs">Đang tải câu hỏi...</p></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-32 space-y-12 font-sans">
      <CustomModal {...modal} onClose={closeModal} />

      <div className="space-y-8">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3 border-b border-gray-100 pb-4">📋 Ngân hàng câu hỏi</h2>
        {questions.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 flex flex-col items-center">
            <AlertCircle className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">Danh sách trống</h3>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden">
              <div className="bg-gray-50/50 px-8 py-6 flex justify-between items-center border-b border-gray-50 text-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white border border-indigo-100 text-indigo-600 font-black rounded-xl flex items-center justify-center shadow-sm">{idx + 1}</div>
                  <h3 className="font-bold text-xl">{q.prompt}</h3>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl"><Target className="w-5 h-5 text-indigo-500" /><span className="text-sm font-black text-indigo-700">{q.points}đ</span></div>
              </div>

              <div className="p-8 space-y-4">
                <div className="grid gap-3">
                  {q.options?.map((opt) => (
                    <div key={opt.id} onClick={() => handleSetCorrect(opt.id, true)} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${opt.is_correct ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-50' : 'bg-white border-gray-50 hover:border-indigo-100'}`}>
                      <div className="flex items-center gap-4 flex-1">
                        {opt.is_correct ? <CheckCircle2 className="w-7 h-7 text-emerald-600 fill-emerald-100" /> : <Circle className="w-7 h-7 text-gray-200" />}
                        <span className={`text-lg ${opt.is_correct ? "text-emerald-900 font-black" : "text-gray-600 font-medium"}`}>{opt.content}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteOption(opt.id); }} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-dashed border-gray-100">
                  <div className="relative max-w-xl">
                    <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 w-6 h-6" />
                    <input type="text" placeholder="Thêm lựa chọn và Enter..." className="w-full pl-12 pr-16 py-4 bg-gray-50 border-none rounded-2xl text-base focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-bold text-gray-700" value={optionInputs[q.id] || ''} onChange={(e) => setOptionInputs({ ...optionInputs, [q.id]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleAddOption(q.id)} />
                    <button onClick={() => handleAddOption(q.id)} className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200"><Plus className="w-7 h-7" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/60 border border-indigo-50 p-8 md:p-12 mt-16 sticky bottom-6 z-10 ring-8 ring-indigo-50/20">
        <div className="flex items-center gap-5 mb-8">
          <div className="p-4 bg-indigo-600 rounded-[1.5rem] shadow-xl text-white"><Plus className="w-8 h-8" /></div>
          <div><h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Tạo câu hỏi mới</h2></div>
        </div>
        <form onSubmit={handleAddQuestion} className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-8 relative group">
            <HelpCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-indigo-500 transition-colors" />
            <input type="text" placeholder="Nội dung câu hỏi..." className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none text-gray-700 font-bold" value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} required />
          </div>
          <div className="md:col-span-2 relative group min-w-[120px]">
            <Target className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-indigo-500 transition-colors" />
            <input type="number" placeholder="Điểm" className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none font-black text-indigo-700" value={newPoints} onChange={(e) => setNewPoints(e.target.value)} />
          </div>
          <button type="submit" className="md:col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-[1.5rem] shadow-xl shadow-indigo-200 transition-all active:scale-95 py-5 uppercase tracking-widest">Thêm</button>
        </form>
      </section>
    </div>
  );
}

export default QuestionManager;