import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import DiscussionSection from '../components/learning/DiscussionSection';
import StudentQuizView from '../components/student/StudentQuizView';
import LoadingSpinner from '../components/LoadingSpinner';

function LearningPage() {
  const { id: courseId } = useParams();
  const [lectures, setLectures] = useState([]);
  
  // State quản lý nội dung đang hiển thị
  const [currentLecture, setCurrentLecture] = useState(null); // Bài giảng đang mở
  const [currentMaterial, setCurrentMaterial] = useState(null); // Video đang xem
  const [activeTab, setActiveTab] = useState('content'); // 'content' (video/quiz) hoặc 'discussion'
  const [viewingQuizId, setViewingQuizId] = useState(null); // ID quiz đang làm (nếu có)

  const [loading, setLoading] = useState(true);

  // 1. Fetch dữ liệu
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/courses/${courseId}/lectures`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data;
        setLectures(data);

        // Mặc định chọn bài đầu tiên và video đầu tiên
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

  // Hàm chuyển bài giảng (Mở accordion)
  const handleLectureClick = (lec) => {
    setCurrentLecture(lec);
    // Nếu bài này có video, tự động chọn video đầu tiên
    if (lec.materials && lec.materials.length > 0) {
      handleMaterialClick(lec.materials[0]);
    } else {
      setCurrentMaterial(null);
    }
    // Reset quiz view
    setViewingQuizId(null);
    setActiveTab('content');
  };

  // Hàm chọn Video cụ thể
  const handleMaterialClick = (material) => {
    setCurrentMaterial(material);
    setViewingQuizId(null); // Tắt quiz nếu đang xem
    setActiveTab('content'); // Chuyển về tab nội dung
  };

  // Hàm chọn Quiz cụ thể
  const handleQuizClick = (quizId) => {
    setViewingQuizId(quizId);
    setCurrentMaterial(null); // Tắt video
    setActiveTab('content');
  };

  if (loading) return (
    <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center bg-white-900">
      <div className="flex flex-col items-center gap-4">
        {/* Vòng tròn xoay (Spinner) */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent shadow-lg shadow-indigo-500/50"></div>
        
        {/* Chữ nhấp nháy */}
        <p className="text-indigo-400 font-medium animate-pulse text-sm tracking-wide">
          ĐANG TẢI DỮ LIỆU...
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-80px)] overflow-hidden bg-gray-900">
      
      {/* --- CỘT TRÁI: KHU VỰC HIỂN THỊ CHÍNH (Video hoặc Quiz) --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-black relative">
        {activeTab === 'discussion' ? (
           // Hiển thị Thảo luận (chiếm toàn màn hình trái)
           <div className="bg-white h-full overflow-y-auto">
             <DiscussionSection lectureId={currentLecture?.id} lectureTitle={currentLecture?.title} />
           </div>
        ) : viewingQuizId ? (
           // Hiển thị Quiz
           <div className="bg-white h-full overflow-y-auto p-4">
             <StudentQuizView quizId={viewingQuizId} />
           </div>
        ) : currentMaterial ? (
           // Hiển thị Video
           <div className="flex-1 flex items-center justify-center bg-black h-full">
             <video 
               src={currentMaterial.url} 
               controls 
               className="w-full h-full object-contain"
               autoPlay
               key={currentMaterial.url} // Key quan trọng để reload player khi đổi bài
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

      {/* --- CỘT PHẢI: DANH SÁCH BÀI GIẢNG (Accordion) --- */}
      <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col h-full shrink-0">
        
        {/* Thanh Tab chuyển đổi giữa Nội dung / Thảo luận */}
        <div className="flex border-b text-sm font-medium text-center text-gray-500 bg-gray-50">
          <button 
            className={`flex-1 p-3 ${activeTab === 'content' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('content')}
          >
            Nội dung
          </button>
          <button 
            className={`flex-1 p-3 ${activeTab === 'discussion' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('discussion')}
          >
            Thảo luận
          </button>
        </div>

        {/* Danh sách Accordion */}
        <div className="flex-1 overflow-y-auto">
          {lectures.map((lec, idx) => {
            const isActive = currentLecture?.id === lec.id;

            return (
              <div key={lec.id} className="border-b border-gray-100">
                {/* 1. Header Bài giảng (Luôn hiện) */}
                <div 
                  onClick={() => handleLectureClick(lec)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition flex justify-between items-center
                    ${isActive ? 'bg-gray-50 border-l-4 border-l-indigo-600' : ''}`}
                >
                  <div>
                    <div className="text-xs text-gray-500 font-bold mb-1">CHƯƠNG {idx + 1}</div>
                    <div className="text-sm font-medium text-gray-900">{lec.title}</div>
                  </div>
                  <span className="text-gray-400 text-xs">{isActive ? '▼' : '▶'}</span>
                </div>

                {/* 2. Nội dung mở rộng (Chỉ hiện khi Active) */}
                {isActive && (
                  <div className="bg-indigo-50/50 pb-2">
                    
                    {/* Danh sách Video/Tài liệu */}
                    {lec.materials && lec.materials.map((mat) => (
                      <div 
                        key={mat.id}
                        onClick={() => handleMaterialClick(mat)}
                        className={`pl-8 pr-4 py-2 text-sm cursor-pointer flex items-center gap-2 hover:text-indigo-700
                          ${currentMaterial?.id === mat.id && !viewingQuizId ? 'text-indigo-700 font-semibold bg-indigo-100' : 'text-gray-600'}`}
                      >
                        <span>🎥</span> {/* Icon Video */}
                        <span className="truncate">{mat.title}</span>
                        {/* Hiển thị thời lượng nếu có */}
                      </div>
                    ))}

                    {/* Danh sách Quiz */}
                    {lec.quizzes && lec.quizzes.map((quiz) => (
                      <div 
                        key={quiz.id}
                        onClick={() => {
                            if(quiz.is_published) handleQuizClick(quiz.id);
                            else alert("Bài tập chưa mở.");
                        }}
                        className={`pl-8 pr-4 py-2 text-sm cursor-pointer flex items-center gap-2 hover:text-purple-700
                          ${viewingQuizId === quiz.id ? 'text-purple-700 font-semibold bg-purple-100' : 'text-gray-600'}`}
                      >
                        <span>📝</span> {/* Icon Quiz */}
                        <span className="truncate">{quiz.title}</span>
                      </div>
                    ))}

                    {/* Thông báo nếu trống */}
                    {(!lec.materials?.length && !lec.quizzes?.length) && (
                      <div className="pl-8 py-2 text-xs text-gray-400 italic">
                        (Chưa có nội dung)
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LearningPage;