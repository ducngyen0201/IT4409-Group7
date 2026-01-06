import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import StudentQuizView from '../components/student/StudentQuizView';
import DiscussionSection from '../components/learning/DiscussionSection';
import { Video, FileText, Download, ChevronLeft, Layout } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

function LearningPage() {
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  const [lectures, setLectures] = useState([]);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [activeTab, setActiveTab] = useState('lectures'); 
  const [viewingQuizId, setViewingQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const res = await axiosClient.get(`/api/courses/${courseId}/lectures`);
        setLectures(res.data);
        if (res.data.length > 0) {
          const firstLec = res.data[0];
          setCurrentLecture(firstLec);
          if (firstLec.materials?.length > 0) setCurrentMaterial(firstLec.materials[0]);
        }
      } catch (err) { console.error("Lỗi tải dữ liệu:", err); }
      finally { setLoading(false); }
    };
    if (courseId) fetchLectures();
  }, [courseId]);

  const handleLectureClick = (lec) => {
    setCurrentLecture(lec);
    setViewingQuizId(null);
    setCurrentMaterial(lec.materials?.length > 0 ? lec.materials[0] : null);
  };

  const updateProgressAPI = async (percent) => {
    if (isTeacher || !currentLecture) return;
    try {
      await axiosClient.post(`/api/lectures/${currentLecture.id}/progress`, { progress_percent: percent });
      if (percent >= 100) {
        setLectures(prev => prev.map(lec => lec.id === currentLecture.id ? { ...lec, is_completed: true } : lec));
      }
    } catch (err) { console.error("Lỗi lưu tiến độ:", err); }
  };

  const handleTimeUpdate = (e) => {
    const percent = Math.floor((e.target.currentTime / e.target.duration) * 100);
    if (percent - lastSavedProgress >= 5) {
      setLastSavedProgress(percent);
      updateProgressAPI(percent);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-64px)] overflow-hidden bg-[#0f172a]">
      
      <div className="flex-1 flex flex-col min-w-0 bg-black relative">
        {viewingQuizId ? (
          <div className="bg-white h-full overflow-y-auto">
            <StudentQuizView quizId={viewingQuizId} onBack={() => setViewingQuizId(null)} />
          </div>
        ) : currentMaterial ? (
          <div className="flex-1 flex items-center justify-center h-full">
            {currentMaterial.type === 'VIDEO' ? (
              <video 
                src={currentMaterial.storage_key} 
                controls 
                className="max-w-full max-h-full"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => updateProgressAPI(100)}
                key={currentMaterial.storage_key}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center gap-6">
                <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
                    <FileText size={48} className="text-indigo-400" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">{currentMaterial.title}</h2>
                    <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Tài liệu học tập</p>
                </div>
                <a 
                  href={currentMaterial.storage_key} 
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                >
                  <Download size={18} /> TẢI XUỐNG TÀI LIỆU
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
            <Layout className="w-12 h-12 opacity-20" />
            <p className="text-sm italic font-medium">Chọn một bài học để bắt đầu</p>
          </div>
        )}
      </div>

      <div className="w-full lg:w-80 bg-white border-l border-gray-200 flex flex-col h-full shrink-0">
        {isTeacher && (
          <div className="p-3 border-b bg-indigo-50/50">
            <button onClick={() => navigate(`/manage/courses/${courseId}`)} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black hover:bg-indigo-700 transition-colors uppercase tracking-widest">⚙️ Quản lý nội dung</button>
          </div>
        )}

        <div className="p-3 border-b border-gray-100">
          <button onClick={() => navigate(`/video-call/${courseId}`)} className="w-full py-2.5 bg-red-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-red-100 hover:bg-red-700 flex items-center justify-center gap-2 transition-all active:scale-95 animate-pulse uppercase tracking-widest">
            <Video size={14} /> Vào lớp LIVE
          </button>
        </div>

        <div className="flex border-b text-[11px] font-black uppercase tracking-tighter text-gray-500 bg-gray-50">
          <button className={`flex-1 py-3 transition-all ${activeTab === 'lectures' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:bg-gray-100'}`} onClick={() => setActiveTab('lectures')}>Bài học</button>
          <button className={`flex-1 py-3 transition-all ${activeTab === 'discussion' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:bg-gray-100'}`} onClick={() => setActiveTab('discussion')}>Thảo luận</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'lectures' ? (
            lectures.map((lec, idx) => (
              <div key={lec.id} className="border-b border-gray-50">
                <div onClick={() => handleLectureClick(lec)} className={`p-3 cursor-pointer hover:bg-gray-50 transition flex justify-between items-center ${currentLecture?.id === lec.id ? 'bg-indigo-50/40 border-l-4 border-l-indigo-600' : ''}`}>
                  <div className="flex gap-2 items-center overflow-hidden">
                    <span className="text-[10px] text-gray-400 font-bold min-w-[15px]">{idx + 1}</span>
                    <span className={`text-[11px] truncate ${currentLecture?.id === lec.id ? 'font-black text-indigo-900' : 'font-bold text-gray-600'}`}>{lec.title}</span>
                  </div>
                  {lec.is_completed && <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />}
                </div>
                {currentLecture?.id === lec.id && (
                  <div className="bg-gray-50/30 pb-1">
                    {lec.materials?.map(mat => (
                      <div key={mat.id} onClick={(e) => { e.stopPropagation(); setCurrentMaterial(mat); setViewingQuizId(null); }} className={`pl-8 pr-3 py-1.5 text-[10px] cursor-pointer flex items-center gap-2 hover:text-indigo-600 ${currentMaterial?.id === mat.id && !viewingQuizId ? 'text-indigo-700 font-black bg-indigo-50' : 'text-gray-500 font-bold'}`}>
                        <span>{mat.type === 'VIDEO' ? '🎥' : '📄'}</span><span className="truncate">{mat.title}</span>
                      </div>
                    ))}
                    {lec.quizzes?.map(quiz => (
                      <div key={quiz.id} onClick={(e) => { e.stopPropagation(); setViewingQuizId(quiz.id); setCurrentMaterial(null); }} className={`pl-8 pr-3 py-1.5 text-[10px] cursor-pointer flex items-center gap-2 hover:text-purple-600 ${viewingQuizId === quiz.id ? 'text-purple-700 font-black bg-purple-50' : 'text-gray-500 font-bold'}`}>
                        <span>📝</span><span className="truncate">{quiz.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            currentLecture && <DiscussionSection lectureId={currentLecture.id} lectureTitle={currentLecture.title} isTeacher={isTeacher} />
          )}
        </div>
      </div>
    </div>
  );
}

export default LearningPage;