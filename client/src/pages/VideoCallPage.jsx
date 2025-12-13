import React, { useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

function VideoCallPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Lấy Room ID từ URL (sẽ là Course ID)
  const { roomId } = useParams();
  const activeRoomId = roomId;

  // Ref để lưu trữ Stream cục bộ (cần cho việc cleanup thủ công nếu Zego không tự tắt)
  const localStreamRef = useRef(null); 
  
  // Hàm tạo ID ngẫu nhiên (chỉ dùng nếu user không tồn tại)
  function randomID(len) {
    let result = '';
    var chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP',
      maxPos = chars.length,
      i;
    len = len || 5;
    for (i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return result;
  }

  // --- HÀM KHỞI TẠO VÀ THAM GIA PHÒNG (ZegoCloud) ---
  const myMeeting = async (element) => {
    // 1. CẤU HÌNH APP ID (THAY THẾ BẰNG THÔNG TIN CỦA BẠN)
    const appID = 1637996395; // <-- Thay bằng AppID thật của bạn
    const serverSecret = "06a7751939105436340662660d210517"; // <-- Thay bằng ServerSecret thật của bạn
    
    // 2. Tạo Kit Token (Xác thực người dùng và phòng)
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      activeRoomId,
      user?.id ? user.id.toString() : randomID(5), // User ID (Dùng ID thật)
      user?.full_name || "Người dùng ẩn danh"      // Tên hiển thị
    );

    // 3. Khởi tạo instance
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    // 4. Tham gia phòng
    zp.joinRoom({
      container: element,
      
      // --- CẤU HÌNH GỌI NHÓM (GROUP CALL) ---
      scenario: {
        mode: ZegoUIKitPrebuilt.GroupCall,
      },
      
      // Cài đặt giao diện (để có nút tắt/bật Cam/Mic)
      showScreenSharingButton: true,
      showMyCameraToggleButton: true,
      showMyMicrophoneToggleButton: true,
      showAudioVideoSettingsButton: true,
      
      // Tạo link để mời người khác
      sharedLinks: [
        {
          name: 'Link tham gia',
          url:
           window.location.protocol + '//' + 
           window.location.host + window.location.pathname,
           // Link này có thể copy và gửi cho học viên
        },
      ],

      // Xử lý khi rời phòng
      onLeaveRoom: () => {
        // Có thể navigate về trang chi tiết khóa học thay vì trang chủ
        navigate(`/course/${activeRoomId}`);
      },
      
      // Lấy local stream để chuẩn bị cho Cleanup (chỉ áp dụng nếu user chưa tắt cam/mic thủ công)
      onJoinRoom: (users) => {
        // Cần truy cập stream của người dùng hiện tại
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStreamRef.current = stream;
            })
            .catch(err => {
                console.warn("Không thể lấy stream để lưu tham chiếu cleanup:", err);
            });
      }
    });
  };

  // --- LOGIC CLEANUP (TẮT MIC/CAM KHI RỜI TRANG) ---
  useEffect(() => {
    
    // Hàm này sẽ chạy khi component unmount (rời khỏi trang /video-call)
    const cleanupCameraAndMic = () => {
      // 1. Dọn dẹp Stream đã lưu trữ (nếu có)
      if (localStreamRef.current) {
         localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // 2. Phương pháp dự phòng: Tìm và tắt mọi stream đang chạy (Hiệu quả nhất)
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          console.log("Cleanup: Đã tắt Camera và Microphone thủ công.");
        })
        .catch(err => {
          console.warn("Cleanup: Không cần tắt thủ công vì đã tắt hoặc quyền bị từ chối.");
        });
    };
    
    // Trả về hàm cleanup, nó sẽ chạy khi component unmount
    return () => {
      cleanupCameraAndMic();
    };

  }, [activeRoomId, navigate]);


  // Nếu user chưa đăng nhập, không nên render
  if (!user) return <div className="pt-20 text-center">Đang tải...</div>;


  return (
    <div className="w-full h-screen bg-gray-100 relative">
        {/* Nút quay lại */}
        <button 
            onClick={() => navigate(`/course/${activeRoomId}`)}
            className="absolute top-4 left-4 z-50 bg-gray-600/50 text-white p-2 rounded-full hover:bg-gray-800 transition flex items-center gap-1 text-sm"
        >
            <ArrowLeft size={16} /> Thoát phòng
        </button>

        <div
            className="myCallContainer w-full h-full"
            ref={myMeeting}
        ></div>
    </div>
  );
}

export default VideoCallPage;