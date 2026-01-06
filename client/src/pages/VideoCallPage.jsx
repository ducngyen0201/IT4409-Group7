import React, { useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

function VideoCallPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  const zpRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!user || !containerRef.current) return;

    const myMeeting = async () => {
      try {
        // --- SỬA LỖI TẠI ĐÂY: Ép kiểu Number ---
        const appID = Number(import.meta.env.VITE_ZEGO_APP_ID); 
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

        if (!appID) {
          console.error("AppID không hợp lệ hoặc chưa được thiết lập trong .env");
          return;
        }

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

        // 2. Khởi tạo instance
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        
        // --- KIỂM TRA AN TOÀN ---
        if (!zp) {
          console.error("Không thể tạo đối tượng Zego. Kiểm tra lại AppID và Secret.");
          return;
        }
        
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
          turnOnCameraWhenJoining: true,
          turnOnMicrophoneWhenJoining: true, 
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

    return () => {
      if (zpRef.current) {
        zpRef.current.destroy();
        zpRef.current = null;
      }
    };
  }, [roomId, user, navigate]);

  if (!user) return <div className="pt-20 text-center font-bold">Vui lòng đăng nhập...</div>;

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      <button 
        onClick={() => navigate(`/course/${roomId}`)}
        className="absolute top-4 left-4 z-[999] bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition flex items-center gap-2 shadow-lg font-bold"
      >
        <ArrowLeft size={18} /> Thoát phòng
      </button>

      <div className="w-full h-full" ref={containerRef}></div>
    </div>
  );
}

export default VideoCallPage;