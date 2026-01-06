import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import StudentQuizView from '../components/student/StudentQuizView';
import DiscussionSection from '../components/learning/DiscussionSection';
import { Video, FileText, Download, Layout, CheckCircle, Settings, MessageSquare, BookOpen } from 'lucide-react';
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

  // 1. Tải dữ liệu bài giảng và tài liệu
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
      } catch (err) { 
        console.error("Lỗi tải dữ liệu học tập:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    if (courseId) fetchLectures();
  }, [courseId]);

  // 2. Xử lý chuyển đổi nội dung học tập
  const handleLectureClick = (lec) => {
    setCurrentLecture(lec);
    setViewingQuizId(null);
    setCurrentMaterial(lec.materials?.length > 0 ? lec.materials[0] : null);
  };

  // 3. Logic lưu tiến độ học tập
  const updateProgressAPI = async (percent) => {
    if (isTeacher || !currentLecture) return;
    try {
      await axiosClient.post(`/api/lectures/${currentLecture.id}/progress`, { 
        progress_percent: percent 
      });
      if (percent >= 100) {
        setLectures(prev => prev.map(lec => 
          lec.id === currentLecture.id ? { ...lec, is_completed: true } : lec
        ));
      }
    } catch (err) { 
      console.error("Không thể lưu tiến độ:", err); 
    }
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
      
      {/* --- CỘT TRÁI: KHUNG XEM VIDEO / TÀI LIỆU --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-black relative shadow-2xl">
        {viewingQuizId ? (
          <div className="bg-white h-full overflow-y-auto animate-fade-in">
            <StudentQuizView quizId={viewingQuizId} onBack={() => setViewingQuizId(null)} />
          </div>
        ) : currentMaterial ? (
          <div className="flex-1 flex flex-col bg-white h-full animate-fade-in">
            {currentMaterial.type === 'VIDEO' ? (
              <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
                <video 
                  src={currentMaterial.storage_key} 
                  controls 
                  className="w-full h-full object-contain outline-none" 
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => updateProgressAPI(100)}
                  key={currentMaterial.storage_key}
                >
                  Trình duyệt không hỗ trợ xem video.
                </video>
              </div>
            ) : (
              /* --- TRÌNH XEM TÀI LIỆU TRỰC TIẾP QUA GOOGLE DOCS --- */
              <div className="flex-1 flex flex-col h-full bg-gray-100">
                <div className="bg-white px-6 py-3 border-b flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <FileText size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 truncate">{currentMaterial.title}</h3>
                  </div>
                  <a 
                    href={currentMaterial.storage_key} 
                    target="_blank" rel="noreferrer"
                    className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all uppercase tracking-widest border border-indigo-100"
                  >
                    Tải bản gốc
                  </a>
                </div>
                
                <div className="flex-1 w-full bg-white overflow-hidden relative">
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(currentMaterial.storage_key)}&embedded=true`}
                    className="w-full h-full border-none shadow-inner"
                    title="Document Preview"
                    onLoad={() => updateProgressAPI(100)}
                  >
                    Trình duyệt không hỗ trợ nhúng tài liệu.
                  </iframe>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4">
            <Layout className="w-16 h-16 opacity-10" />
            <p className="text-xs italic font-bold uppercase tracking-[0.3em] opacity-40">Chọn nội dung để bắt đầu</p>
          </div>
        )}
      </div>

      {/* --- CỘT PHẢI: ĐIỀU HƯỚNG & THẢO LUẬN (Đã làm to hơn) --- */}
      <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col h-full shrink-0 shadow-2xl z-10">
        
        {/* Nút quản lý cho giáo viên */}
        {isTeacher && (
          <div className="p-4 border-b bg-indigo-50/30">
            <button 
                onClick={() => navigate(`/manage/courses/${courseId}`)} 
                className="w-full py-3 bg-white border border-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
            >
              <Settings size={14} /> Quản lý nội dung
            </button>
          </div>
        )}

        {/* Nút vào lớp Live */}
        <div className="p-4 border-b bg-white">
          <button 
            onClick={() => navigate(`/video-call/${courseId}`)} 
            className="w-full py-3.5 bg-red-600 text-white text-[10px] font-black rounded-xl shadow-xl shadow-red-100 hover:bg-red-700 flex items-center justify-center gap-2 transition-all active:scale-95 animate-pulse uppercase tracking-widest"
          >
            <Video size={16} /> Vào phòng học trực tuyến
          </button>
        </div>

        {/* Thanh chuyển Tab */}
        <div className="flex border-b text-[11px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
          <button 
            className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all ${activeTab === 'lectures' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:text-gray-600'}`} 
            onClick={() => setActiveTab('lectures')}
          >
            <BookOpen size={14} /> Nội dung
          </button>
          <button 
            className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all ${activeTab === 'discussion' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:text-gray-600'}`} 
            onClick={() => setActiveTab('discussion')}
          >
            <MessageSquare size={14} /> Thảo luận
          </button>
        </div>

        {/* Danh sách bài học/Thảo luận */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'lectures' ? (
            <div className="divide-y divide-gray-50">
              {lectures.map((lec, idx) => {
                const isActive = currentLecture?.id === lec.id;
                return (
                  <div key={lec.id} className="group">
                    <div 
                        onClick={() => handleLectureClick(lec)} 
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-all flex justify-between items-center ${isActive ? 'bg-indigo-50/40 border-l-4 border-l-indigo-600' : ''}`}
                    >
                      <div className="flex gap-3 items-center overflow-hidden">
                        <span className="text-[10px] text-gray-400 font-black min-w-[18px]">{idx + 1}</span>
                        <span className={`text-xs truncate ${isActive ? 'font-black text-indigo-900' : 'font-bold text-gray-600 group-hover:text-gray-900'}`}>{lec.title}</span>
                      </div>
                      {lec.is_completed && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 shadow-sm" />}
                    </div>
                    
                    {/* Danh sách tài liệu/Quiz con */}
                    {isActive && (
                      <div className="bg-gray-50/30 pb-2 animate-slide-down">
                        {lec.materials?.map(mat => (
                          <div 
                            key={mat.id} 
                            onClick={(e) => { e.stopPropagation(); setCurrentMaterial(mat); setViewingQuizId(null); }} 
                            className={`pl-11 pr-4 py-2.5 text-[11px] cursor-pointer flex items-center gap-3 hover:text-indigo-600 transition-colors ${currentMaterial?.id === mat.id && !viewingQuizId ? 'text-indigo-700 font-black bg-white shadow-sm mx-2 rounded-lg' : 'text-gray-500 font-bold'}`}
                          >
                            <span className="opacity-60">{mat.type === 'VIDEO' ? '🎥' : '📄'}</span>
                            <span className="truncate">{mat.title}</span>
                          </div>
                        ))}
                        {lec.quizzes?.map(quiz => (
                          <div 
                            key={quiz.id} 
                            onClick={(e) => { e.stopPropagation(); setViewingQuizId(quiz.id); setCurrentMaterial(null); }} 
                            className={`pl-11 pr-4 py-2.5 text-[11px] cursor-pointer flex items-center gap-3 hover:text-purple-600 transition-colors ${viewingQuizId === quiz.id ? 'text-purple-700 font-black bg-white shadow-sm mx-2 rounded-lg' : 'text-gray-500 font-bold'}`}
                          >
                            <span className="opacity-60">📝</span>
                            <span className="truncate">{quiz.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            currentLecture && <DiscussionSection lectureId={currentLecture.id} lectureTitle={currentLecture.title} isTeacher={isTeacher} />
          )}
        </div>
      </div>
    </div>
  );
}

export default LearningPage;