import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import DiscussionSection from '../components/learning/DiscussionSection';
import StudentQuizView from '../components/student/StudentQuizView';
import LoadingSpinner from '../components/LoadingSpinner';
import { Video } from 'lucide-react';

function LearningPage() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  const [lectures, setLectures] = useState([]);
  
  const [currentLecture, setCurrentLecture] = useState(null);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  // Dùng tabs: 'lectures' hoặc 'discussion'
  const [activeTab, setActiveTab] = useState('lectures'); 
  const [viewingQuizId, setViewingQuizId] = useState(null);

  const [loading, setLoading] = useState(true);

  // 1. Fetch dữ liệu
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axiosClient.get(`/api/courses/${courseId}/lectures`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data;
        setLectures(data);

        // Mặc định chọn bài đầu tiên
        if (data.length > 0) {
          const firstLec = data[0];
          setCurrentLecture(firstLec);
          if (firstLec.materials && firstLec.materials.length > 0) {
            setCurrentMaterial(firstLec.materials[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLectures();
  }, [courseId]);

  // Hàm xử lý khi xem hết video (Đánh dấu hoàn thành)
  const handleVideoEnded = async () => {
    if (!currentLecture || currentLecture.is_completed) return; 
    try {
      const token = sessionStorage.getItem('token');
      await axiosClient.post(`/api/lectures/${currentLecture.id}/progress`, 
        { progress_percent: 100 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setLectures(prev => prev.map(lec => 
        lec.id === currentLecture.id ? { ...lec, is_completed: true } : lec
      ));
      
      console.log("Đã hoàn thành bài học!");
    } catch (err) {
      console.error("Lỗi cập nhật tiến độ:", err);
    }
  };

  const handleLectureClick = (lec) => {
    setCurrentLecture(lec);
    if (lec.materials && lec.materials.length > 0) {
      handleMaterialClick(lec.materials[0]);
    } else {
      setCurrentMaterial(null);
    }
    setViewingQuizId(null);
    setActiveTab('lectures'); // Luôn quay về tab Bài giảng
  };

  const handleMaterialClick = (material) => {
    setCurrentMaterial(material);
    setViewingQuizId(null);
    setActiveTab('lectures');
  };

  const handleQuizClick = (quizId) => {
    setViewingQuizId(quizId);
    setCurrentMaterial(null);
    setActiveTab('lectures');
  };
  
  // Chuyển hướng vào phòng LIVE
  const handleJoinLive = () => {
    navigate(`/video-call/${courseId}`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-64px)] overflow-hidden bg-gray-900">
      
      {/* --- CỘT TRÁI (KHUNG XEM VIDEO/QUIZ) --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-black relative">
        {viewingQuizId ? (
            <div className="bg-white h-full overflow-y-auto p-4">
              <StudentQuizView quizId={viewingQuizId} />
            </div>
        ) : currentMaterial ? (
            <div className="flex-1 flex items-center justify-center bg-black h-full">
              <video 
                src={currentMaterial.url} 
                controls 
                className="w-full h-full object-contain"
                autoPlay
                key={currentMaterial.url}
                onEnded={handleVideoEnded}
              >
                Trình duyệt không hỗ trợ video.
              </video>
            </div>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Chọn nội dung bên phải để bắt đầu học.
            </div>
        )}
      </div>

      {/* --- CỘT PHẢI (THANH NAVIGATION BÀI GIẢNG & THẢO LUẬN) --- */}
      <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col h-full shrink-0">
        
        {/* NÚT LIVE STREAM */}
        <div className="p-3 border-b border-gray-200 bg-red-50">
           <button
             onClick={handleJoinLive}
             className="w-full py-2.5 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 flex items-center justify-center gap-2 transition animate-pulse"
           >
             <Video size={20} /> VÀO LỚP TRỰC TUYẾN
           </button>
        </div>

        {/* THANH TAB NAVIGATION */}
        <div className="flex border-b text-sm font-medium text-center text-gray-500 bg-gray-50">
          <button 
            className={`flex-1 p-3 ${activeTab === 'lectures' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('lectures')}
          >
            Nội dung bài giảng
          </button>
          <button 
            className={`flex-1 p-3 ${activeTab === 'discussion' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('discussion')}
            disabled={!currentLecture} 
            title={!currentLecture ? "Vui lòng chọn một bài giảng để thảo luận" : ""}
          >
            Thảo luận
          </button>
        </div>

        {/* KHU VỰC HIỂN THỊ NỘI DUNG TAB BÊN PHẢI */}
        <div className="flex-1 overflow-y-auto">
          {/* LOGIC ĐÃ SỬA: ẨN DANH SÁCH KHI CHỌN TAB DISCUSSION */}
          {activeTab === 'lectures' ? (
            // HIỂN THỊ DANH SÁCH BÀI GIẢNG
            lectures.map((lec, idx) => {
              const isActive = currentLecture?.id === lec.id;

              return (
                <div key={lec.id} className="border-b border-gray-100">
                  {/* Header Bài giảng */}
                  <div 
                    onClick={() => handleLectureClick(lec)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition flex justify-between items-center
                      ${isActive ? 'bg-gray-50 border-l-4 border-l-indigo-600' : ''}`}
                  >
                    <div className="flex gap-3 items-center">
                      {/* Số thứ tự & Dấu tích xanh */}
                      <div className="flex flex-col items-center min-w-[24px]">
                        <span className="text-xs text-gray-500 font-mono">{idx + 1}.</span>
                        {lec.is_completed && (
                          <span className="text-green-500 text-lg leading-none" title="Đã hoàn thành">✓</span>
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-medium text-gray-900">{lec.title}</div>
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs">{isActive ? '▼' : '▶'}</span>
                  </div>

                  {/* Nội dung mở rộng */}
                  {isActive && (
                    <div className="bg-indigo-50/50 pb-2">
                      {lec.materials && lec.materials.map((mat) => (
                        <div 
                          key={mat.id}
                          onClick={() => handleMaterialClick(mat)}
                          className={`pl-10 pr-4 py-2 text-sm cursor-pointer flex items-center gap-2 hover:text-indigo-700
                            ${currentMaterial?.id === mat.id && !viewingQuizId ? 'text-indigo-700 font-semibold bg-indigo-100' : 'text-gray-600'}`}
                        >
                          <span>🎥</span>
                          <span className="truncate">{mat.title}</span>
                        </div>
                      ))}

                      {lec.quizzes && lec.quizzes.map((quiz) => (
                        <div 
                          key={quiz.id}
                          onClick={() => {
                              if(quiz.is_published) handleQuizClick(quiz.id);
                              else alert("Bài tập chưa mở.");
                          }}
                          className={`pl-10 pr-4 py-2 text-sm cursor-pointer flex items-center gap-2 hover:text-purple-700
                            ${viewingQuizId === quiz.id ? 'text-purple-700 font-semibold bg-purple-100' : 'text-gray-600'}`}
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
            // HIỂN THỊ KHU VỰC THẢO LUẬN KHI activeTab === 'discussion'
            <div className="h-full bg-white">
              {currentLecture ? (
                <DiscussionSection lectureId={currentLecture.id} lectureTitle={currentLecture.title} />
              ) : (
                <div className="p-4 text-center text-gray-500 pt-8">Không có bài giảng nào được tải để thảo luận.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LearningPage;