function LearningPage() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  const [lectures, setLectures] = useState([]);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [activeTab, setActiveTab] = useState('lectures'); 
  const [viewingQuizId, setViewingQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);

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

        if (data.length > 0) {
          const firstLec = data[0];
          setCurrentLecture(firstLec);
          // SỬA: Đảm bảo lấy đúng tài liệu đầu tiên nếu có
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
    fetchLectures();
  }, [courseId]);

  // 2. Xử lý chọn bài giảng / tài liệu / quiz
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

  const updateProgressAPI = async (percent) => {
    try {
      await axiosClient.post(`/api/lectures/${currentLecture.id}/progress`, {
        progress_percent: percent
      });
      // Cập nhật lại state danh sách bài giảng ở bên phải để hiện dấu tích xanh ngay lập tức
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

    // Chỉ gửi API khi tiến độ tăng lên ít nhất 5% so với lần lưu trước 
    // để tránh gửi request quá liên tục (spam server)
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
      
      {/* --- CỘT TRÁI (KHUNG XEM VIDEO/QUIZ) --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-black relative">
        {viewingQuizId ? (
            <div className="bg-white h-full overflow-y-auto p-4">
              <StudentQuizView quizId={viewingQuizId} />
            </div>
        ) : currentMaterial ? (
            <div className="flex-1 flex items-center justify-center bg-black h-full">
              <video 
                src={currentMaterial.storage_key} 
                controls 
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                key={currentMaterial.storage_key}
              >
                Trình duyệt không hỗ trợ video.
              </video>
            </div>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-400 italic">
              Chọn một bài giảng hoặc video bên phải để bắt đầu học.
            </div>
        )}
      </div>

      {/* --- CỘT PHẢI (THANH NAVIGATION) --- */}
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
            className={`flex-1 p-3 transition ${activeTab === 'lectures' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('lectures')}
          >
            Nội dung bài giảng
          </button>
          <button 
            className={`flex-1 p-3 transition ${activeTab === 'discussion' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('discussion')}
            disabled={!currentLecture}
          >
            Thảo luận
          </button>
        </div>

        {/* NỘI DUNG TAB */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'lectures' ? (
            lectures.map((lec, idx) => {
              const isActive = currentLecture?.id === lec.id;
              return (
                <div key={lec.id} className="border-b border-gray-100">
                  <div 
                    onClick={() => handleLectureClick(lec)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition flex justify-between items-center
                      ${isActive ? 'bg-indigo-50/30 border-l-4 border-l-indigo-600' : ''}`}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="flex flex-col items-center min-w-[24px]">
                        <span className="text-xs text-gray-500 font-mono">{idx + 1}.</span>
                        {lec.is_completed && <span className="text-green-500 text-lg">✓</span>}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{lec.title}</div>
                    </div>
                    <span className="text-gray-400 text-xs">{isActive ? '▼' : '▶'}</span>
                  </div>

                  {isActive && (
                    <div className="bg-gray-50/50 pb-2">
                      {lec.materials && lec.materials.map((mat) => (
                        <div 
                          key={mat.id}
                          onClick={() => handleMaterialClick(mat)}
                          className={`pl-10 pr-4 py-2 text-sm cursor-pointer flex items-center gap-2 hover:text-indigo-700
                            ${currentMaterial?.id === mat.id && !viewingQuizId ? 'text-indigo-700 font-semibold bg-indigo-100' : 'text-gray-600'}`}
                        >
                          {/* SỬA: Hiển thị icon theo loại tài liệu */}
                          <span>{mat.type === 'VIDEO' ? '🎥' : '📄'}</span>
                          <span className="truncate">{mat.title}</span>
                        </div>
                      ))}

                      {lec.quizzes && lec.quizzes.map((quiz) => (
                        <div 
                          key={quiz.id}
                          onClick={() => quiz.is_published ? handleQuizClick(quiz.id) : alert("Chưa mở")}
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
            <div className="h-full bg-white">
              <DiscussionSection lectureId={currentLecture.id} lectureTitle={currentLecture.title} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LearningPage;