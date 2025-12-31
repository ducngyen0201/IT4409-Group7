import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import StudentQuizView from '../components/student/StudentQuizView';
import DiscussionSection from '../components/learning/DiscussionSection';
import { Video } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

function LearningPage() {
  const { user } = useContext(AuthContext);
  const isTeacher = user.role === 'TEACHER';
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  const [lectures, setLectures] = useState([]);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [activeTab, setActiveTab] = useState('lectures'); 
  const [viewingQuizId, setViewingQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);

  // 1. Fetch dữ liệu bài giảng khi vào trang
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const res = await axiosClient.get(`/api/courses/${courseId}/lectures`);
        const data = res.data;
        setLectures(data);

        // Tự động chọn bài giảng và tài liệu đầu tiên
        if (data.length > 0) {
          const firstLec = data[0];
          setCurrentLecture(firstLec);
          if (firstLec.materials && firstLec.materials.length > 0) {
            setCurrentMaterial(firstLec.materials[0]);
          }
        }
      } catch (err) {
        console.error("Lỗi fetch dữ liệu học tập:", err);
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchLectures();
  }, [courseId]);

  // 2. Xử lý các sự kiện Click
  const handleLectureClick = (lec) => {
    setCurrentLecture(lec);
    setViewingQuizId(null);
    if (lec.materials && lec.materials.length > 0) {
      setCurrentMaterial(lec.materials[0]);
    } else {
      setCurrentMaterial(null);
    }
  };

  const handleMaterialClick = (material) => {
    setCurrentMaterial(material);
    setViewingQuizId(null);
  };

  const handleQuizClick = (quizId) => {
    setViewingQuizId(quizId);
    setCurrentMaterial(null);
  };
  
  const handleJoinLive = () => {
    navigate(`/video-call/${courseId}`);
  };

  // 3. Logic lưu tiến độ học tập (Progress)
  const updateProgressAPI = async (percent) => {
    if (isTeacher) return;
    if (!currentLecture) return;
    try {
      await axiosClient.post(`/api/lectures/${currentLecture.id}/progress`, {
        progress_percent: percent
      });
      // Nếu hoàn thành 100%, cập nhật icon tích xanh ở danh sách bên phải
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
    const video = e.target;
    const percent = Math.floor((video.currentTime / video.duration) * 100);
    // Lưu mỗi khi tăng thêm 5% để tối ưu hiệu năng
    if (percent - lastSavedProgress >= 5) {
      setLastSavedProgress(percent);
      updateProgressAPI(percent);
    }
  }; 

  const handleVideoEnded = () => {
    updateProgressAPI(100);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-64px)] overflow-hidden bg-gray-900">
      
      {/* --- CỘT TRÁI: KHUNG XEM VIDEO / LÀM QUIZ --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-black relative shadow-inner">
        {viewingQuizId ? (
          <div className="bg-white h-full overflow-y-auto">
            <StudentQuizView quizId={viewingQuizId} onBack={() => setViewingQuizId(null)} />
          </div>
        ) : currentMaterial ? (
          <div className="flex-1 flex items-center justify-center bg-black h-full">
            <video 
              src={currentMaterial.storage_key} 
              controls 
              className="max-w-full max-h-full"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              key={currentMaterial.storage_key}
            >
              Trình duyệt không hỗ trợ xem video.
            </video>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <div className="text-6xl opacity-20">📺</div>
            <p className="italic">Vui lòng chọn bài giảng để bắt đầu học</p>
          </div>
        )}
      </div>

      {/* --- CỘT PHẢI: NAVIGATION LỚP HỌC --- */}
      <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col h-full shrink-0 shadow-xl">
        
        {/* KHU VỰC ĐIỀU KHIỂN RIÊNG CHO GIÁO VIÊN */}
        {isTeacher && (
          <div className="p-3 border-b bg-indigo-50/50">
            <button 
              onClick={() => navigate(`/manage/courses/${courseId}`)}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              ⚙️ QUẢN LÝ NỘI DUNG KHÓA HỌC
            </button>
          </div>
        )}

        {/* NÚT VÀO LỚP LIVE */}
        <div className="p-3 border-b border-gray-100">
          <button
            onClick={handleJoinLive}
            className="w-full py-2.5 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 flex items-center justify-center gap-2 transition-all active:scale-95 animate-pulse"
          >
            <Video size={18} /> VÀO PHÒNG HỌC LIVE
          </button>
        </div>

        {/* THANH TABS NAVIGATION */}
        <div className="flex border-b text-sm font-bold text-gray-500 bg-gray-50">
          <button 
            className={`flex-1 py-4 transition-all ${activeTab === 'lectures' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('lectures')}
          >
            Nội dung bài học
          </button>
          <button 
            className={`flex-1 py-4 transition-all ${activeTab === 'discussion' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('discussion')}
            disabled={!currentLecture}
          >
            Thảo luận lớp
          </button>
        </div>

        {/* NỘI DUNG TƯƠNG ỨNG VỚI TAB ĐANG CHỌN */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'lectures' ? (
            // HIỂN THỊ DANH SÁCH BÀI GIẢNG
            lectures.map((lec, idx) => {
              const isActive = currentLecture?.id === lec.id;
              return (
                <div key={lec.id} className="border-b border-gray-50">
                  <div 
                    onClick={() => handleLectureClick(lec)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition flex justify-between items-center
                      ${isActive ? 'bg-indigo-50/40 border-l-4 border-l-indigo-600' : ''}`}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="flex flex-col items-center min-w-[20px]">
                        <span className="text-[10px] text-gray-400 font-bold">{idx + 1}</span>
                        {lec.is_completed && <span className="text-green-500 font-bold text-sm">✓</span>}
                      </div>
                      <div className={`text-sm ${isActive ? 'font-bold text-indigo-900' : 'font-medium text-gray-700'}`}>
                        {lec.title}
                      </div>
                    </div>
                    <span className="text-gray-400 text-[10px]">{isActive ? '▼' : '▶'}</span>
                  </div>

                  {isActive && (
                    <div className="bg-gray-50/30 pb-2">
                      {/* Danh sách Materials */}
                      {lec.materials?.map((mat) => (
                        <div 
                          key={mat.id}
                          onClick={(e) => { e.stopPropagation(); handleMaterialClick(mat); }}
                          className={`pl-12 pr-4 py-2 text-xs cursor-pointer flex items-center gap-2 hover:text-indigo-600
                            ${currentMaterial?.id === mat.id && !viewingQuizId ? 'text-indigo-700 font-bold bg-indigo-50' : 'text-gray-500'}`}
                        >
                          <span>{mat.type === 'VIDEO' ? '🎥' : '📄'}</span>
                          <span className="truncate">{mat.title}</span>
                        </div>
                      ))}
                      {/* Danh sách Quizzes */}
                      {lec.quizzes?.map((quiz) => (
                        <div 
                          key={quiz.id}
                          onClick={(e) => { e.stopPropagation(); handleQuizClick(quiz.id); }}
                          className={`pl-12 pr-4 py-2 text-xs cursor-pointer flex items-center gap-2 hover:text-purple-600
                            ${viewingQuizId === quiz.id ? 'text-purple-700 font-bold bg-purple-50' : 'text-gray-500'}`}
                        >
                          <span>📝</span>
                          <span className="truncate">{quiz.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // HIỂN THỊ PHẦN THẢO LUẬN
            currentLecture && (
              <DiscussionSection 
                lectureId={currentLecture.id} 
                lectureTitle={currentLecture.title}
                isTeacher={isTeacher} // Truyền quyền giáo viên vào đây
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default LearningPage;