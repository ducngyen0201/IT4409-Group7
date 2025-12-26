import React from 'react';
import { Link } from 'react-router-dom';

// Thêm prop 'isTeacherView' và gán giá trị mặc định là false
const CourseCard = ({ course, isTeacherView = false }) => {
  // Hàm hiển thị Status Badge (Chỉ gọi khi là Giáo viên)
  const renderStatusBadge = () => {
    if (!isTeacherView || !course.status) return null;

    const statusMap = {
      'APPROVED': { text: 'Đã duyệt', class: 'bg-green-100 text-green-800' },
      'PENDING_REVIEW': { text: 'Chờ duyệt', class: 'bg-orange-100 text-orange-800' },
      'DRAFT': { text: 'Bản nháp', class: 'bg-gray-200 text-gray-800' },
      // Thêm các trạng thái khác nếu cần
    };
    
    // Lấy trạng thái hiện tại, mặc định là Bản nháp nếu không tìm thấy
    const currentStatus = statusMap[course.status] || statusMap['DRAFT'];

    return (
      <span className={`absolute top-2 left-2 px-3 py-1 text-xs font-semibold rounded-full z-10 shadow-md ${currentStatus.class}`}>
        {currentStatus.text}
      </span>
    );
  };

  // Xác định đường dẫn: Nếu là GV thì dẫn đến trang chỉnh sửa, nếu là HV thì dẫn đến trang chi tiết
  const detailPath = isTeacherView ? `/manage/courses/${course.id}` : `/course/${course.id}`;
  
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col h-full relative">
      
      {/* 1. Thumbnail */}
      <div className="h-48 bg-gray-200 relative overflow-hidden group">
        <Link to={detailPath}>
          <img 
            src={course.thumbnail || course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
        </Link>
        
        {/* HIỂN THỊ STATUS BADGE (CHỈ CHO GV) */}
        {renderStatusBadge()}
      </div>

      {/* 2. Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Category Badge (Giữ nguyên) */}
        <div className="mb-2">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider">
            {isTeacherView ? 'Quản lý' : 'Course'}
          </span>
        </div>

        {/* Title */}
        <Link to={detailPath} className="block">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
            {course.title}
          </h3>
        </Link>
        
        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
          {course.description}
        </p>

        {/* Instructor & Footer */}
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={course.instructor_avatar || `https://ui-avatars.com/api/?name=${course.instructor_name}&background=random`} 
              alt={course.instructor_name}
              className="w-8 h-8 rounded-full border border-gray-200"
            />
            <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
              {course.instructor_name || "Giảng viên"}
            </span>
          </div>
          
          <Link 
            to={detailPath}
            className={`text-sm font-bold ${isTeacherView ? 'text-blue-600 hover:text-blue-800' : 'text-indigo-600 hover:text-indigo-800'}`}
          >
            {isTeacherView ? 'Chỉnh sửa →' : 'Xem chi tiết →'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;