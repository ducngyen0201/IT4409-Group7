import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext); // Lấy user hiện tại
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');

        const courseRequest = axios.get(`http://localhost:5000/api/courses/${id}`, {
           headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        // Chỉ gọi API enrollments nếu là STUDENT
        const enrollmentRequest = (user && user.role === 'STUDENT') 
          ? axios.get('http://localhost:5000/api/me/enrollments', {
              headers: { Authorization: `Bearer ${token}` }
            })
          : Promise.resolve(null); // Nếu không phải student, trả về null ngay

        const [courseRes, enrollRes] = await Promise.all([courseRequest, enrollmentRequest]);

        // 1. Xử lý dữ liệu khóa học
        setCourse(courseRes.data.course);
        setLectures(courseRes.data.lectures);

        // 2. Xử lý dữ liệu đăng ký (nếu có)
        if (enrollRes) {
          const myEnrollment = enrollRes.data.find(e => String(e.course_id) === String(id));
          if (myEnrollment) {
            setEnrollmentStatus(myEnrollment.status);
          }
        }

      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  // Xử lý Đăng ký học
  const handleEnroll = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để đăng ký.");
      navigate('/login');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      // POST /api/courses/:id/enroll
      await axios.post(
        `http://localhost:5000/api/courses/${id}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Đăng ký thành công! Vui lòng chờ giáo viên duyệt (nếu cần).");
      setEnrollmentStatus('PENDING'); // Cập nhật tạm thời
    } catch (err) {
      alert(err.response?.data?.error || "Lỗi đăng ký.");
    }
  };

  if (loading) return <div className="p-8">Đang tải...</div>;
  if (!course) return <div className="p-8">Không tìm thấy khóa học.</div>;

  return (
    <div className="container p-8 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
          <p className="text-gray-600">{course.description}</p>
        </div>

        {/* --- KHU VỰC NÚT HÀNH ĐỘNG --- */}
        <div className="flex-shrink-0">
          {enrollmentStatus === 'APPROVED' ? (
            <Link 
              to={`/course/${id}/learn`} // Link sang trang học
              className="inline-block px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 font-bold shadow"
            >
              Vào học ngay
            </Link>
          ) : enrollmentStatus === 'PENDING' ? (
            <button disabled className="px-6 py-3 text-white bg-yellow-500 rounded-lg font-bold cursor-not-allowed">
              Đang chờ duyệt
            </button>
          ) : enrollmentStatus === 'REJECTED' ? (
             <button disabled className="px-6 py-3 text-white bg-red-500 rounded-lg font-bold cursor-not-allowed">
              Bị từ chối
            </button>
          ) : (
            <button 
              onClick={handleEnroll}
              className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-bold shadow"
            >
              Đăng ký học
            </button>
          )}
        </div>
      </div>

      {/* Danh sách bài giảng (Preview) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Nội dung khóa học</h2>
        <div className="space-y-2">
          {lectures.map((lec, index) => {
            // Kiểm tra xem có được phép học không
            const canLearn = enrollmentStatus === 'APPROVED';

            return (
              <div 
                key={lec.id} 
                // Nếu được học -> Thêm sự kiện click chuyển trang
                onClick={() => {
                  if (canLearn) {
                    navigate(`/course/${id}/learn`);
                  } else {
                    alert("Bạn cần đăng ký khóa học để xem bài này.");
                  }
                }}
                // Style động: Nếu được học thì hiện con trỏ tay (pointer) và hiệu ứng hover
                className={`flex justify-between p-3 border-b last:border-0 transition duration-200
                  ${canLearn 
                    ? 'cursor-pointer hover:bg-indigo-50 hover:text-indigo-700' 
                    : 'opacity-75 cursor-not-allowed bg-gray-50'
                  }`}
              >
                <span className="font-medium">
                  Bài {index + 1}: {lec.title}
                </span>
                
                {/* Icon trạng thái */}
                <span className="text-sm">
                  {canLearn ? (
                    <span className="text-indigo-600 font-semibold">▶️ Học ngay</span>
                  ) : (
                    <span className="text-gray-500">🔒 Khóa</span>
                  )}
                </span>
              </div>
            );
          })}
          
          {lectures.length === 0 && <p className="text-gray-500">Chưa có bài giảng.</p>}
        </div>
      </div>
    </div>
  );
}

export default CourseDetailPage;