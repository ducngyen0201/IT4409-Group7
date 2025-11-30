import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import DiscussionSection from '../components/learning/DiscussionSection';

function LearningPage() {
  const { id: courseId } = useParams();
  const [lectures, setLectures] = useState([]);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lectures');

  // 1. Fetch danh sách bài giảng
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/courses/${courseId}/lectures`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        setLectures(response.data);
        if (response.data.length > 0) setCurrentLecture(response.data[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLectures();
  }, [courseId]);

  // 2. Fetch chi tiết bài giảng (Video URL)
  useEffect(() => {
    const fetchLectureDetail = async () => {
      if (!currentLecture) return;
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/lectures/${currentLecture.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const materials = response.data.materials;
        if (materials.length > 0) setVideoUrl(materials[0].url); 
        else setVideoUrl('');

      } catch (err) {
        console.error(err);
        setVideoUrl('');
      }
    };
    fetchLectureDetail();
  }, [currentLecture]);

  if (loading) return <div className="p-8">Đang tải lớp học...</div>;

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-80px)] overflow-hidden bg-gray-900">
      
      {/* --- CỘT TRÁI: VIDEO PLAYER --- */}
      <div className="flex-1 bg-black flex items-center justify-center p-0 overflow-hidden relative">
        {currentLecture ? (
          videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              className="w-full h-full object-contain" // Video tự co giãn vừa khung, không bị méo
              autoPlay
            >
              Trình duyệt không hỗ trợ video.
            </video>
          ) : (
            <div className="text-white text-lg">Bài này chưa có video.</div>
          )
        ) : (
          <div className="text-white text-lg">Chưa có bài giảng nào.</div>
        )}
      </div>

      {/* --- CỘT PHẢI: TABS (Bài giảng / Thảo luận) --- */}
      <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col h-full shrink-0">
        
        {/* THANH TAB */}
        <div className="flex border-b text-sm font-medium text-center text-gray-500 bg-gray-50">
          <button 
            className={`flex-1 p-4 ${activeTab === 'lectures' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('lectures')}
          >
            Nội dung
          </button>
          <button 
            className={`flex-1 p-4 ${activeTab === 'discussion' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'hover:text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('discussion')}
          >
            Thảo luận
          </button>
        </div>
        
        {/* NỘI DUNG TAB */}
        <div className="flex-1 overflow-y-auto relative">
          
          {/* TAB 1: DANH SÁCH BÀI GIẢNG */}
          {activeTab === 'lectures' && (
            <ul>
              {lectures.map((lec, idx) => (
                <li 
                  key={lec.id}
                  onClick={() => setCurrentLecture(lec)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition flex items-start gap-3
                    ${currentLecture?.id === lec.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                >
                  <div className="mt-1 text-xs text-gray-500 font-mono">
                    {idx + 1}.
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${currentLecture?.id === lec.id ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {lec.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {lec.duration_sec ? `${Math.floor(lec.duration_sec / 60)} phút` : 'Video'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* TAB 2: THẢO LUẬN */}
          {activeTab === 'discussion' && currentLecture && (
            <DiscussionSection lectureId={currentLecture.id} lectureTitle={currentLecture.title}/>
          )}
          
          {activeTab === 'discussion' && !currentLecture && (
            <div className="p-4 text-center text-gray-500">Vui lòng chọn bài giảng để xem thảo luận.</div>
          )}

        </div>
      </div>
    </div>
  );
}

export default LearningPage;