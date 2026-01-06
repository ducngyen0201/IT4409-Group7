import React, { useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

function VideoCallPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  // Ref để chứa instance của Zego, giúp dọn dẹp khi rời trang
  const zpRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Nếu chưa có user hoặc container chưa sẵn sàng thì không chạy
    if (!user || !containerRef.current) return;

    const myMeeting = async () => {
      try {
        const appID = import.meta.env.VITE_ZEGO_APP_ID; 
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

        // Đảm bảo roomId và userId là chuỗi hợp lệ (không dấu, không ký tự đặc biệt)
        const cleanRoomId = roomId.replace(/[^a-zA-Z0-9_]/g, '');
        const userId = user.id ? user.id.toString() : Math.random().toString(36).substring(7);
        const userName = user.full_name || "User_" + userId;

        // 1. Tạo Kit Token
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          cleanRoomId,
          userId,
          userName
        );

        // 2. Khởi tạo instance và lưu vào Ref
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        // 3. Tham gia phòng
        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall,
          },
          showScreenSharingButton: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          sharedLinks: [
            {
              name: 'Link tham gia',
              url: window.location.origin + window.location.pathname,
            },
          ],
          onLeaveRoom: () => {
            navigate(`/course/${roomId}`);
          },
        });
      } catch (error) {
        console.error("Lỗi khởi tạo cuộc gọi video:", error);
      }
    };

    myMeeting();

    // --- CLEANUP KHI RỜI TRANG ---
    return () => {
      if (zpRef.current) {
        // Phương thức chính thống để đóng kết nối và tắt Cam/Mic
        zpRef.current.destroy();
        zpRef.current = null;
        console.log("Đã đóng kết nối Video Call và giải phóng phần cứng.");
      }
    };
  }, [roomId, user, navigate]);

  if (!user) return <div className="pt-20 text-center">Vui lòng đăng nhập để tham gia...</div>;

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      {/* Nút thoát nhanh */}
      <button 
        onClick={() => navigate(`/course/${roomId}`)}
        className="absolute top-4 left-4 z-[999] bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition flex items-center gap-2 shadow-lg font-bold"
      >
        <ArrowLeft size={18} /> Rời khỏi cuộc họp
      </button>

      {/* Container hiển thị video */}
      <div
        className="w-full h-full"
        ref={containerRef}
      ></div>
    </div>
  );
}

export default VideoCallPage;