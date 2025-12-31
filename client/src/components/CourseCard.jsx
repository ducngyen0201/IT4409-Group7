import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Eye } from 'lucide-react'; // Thêm icon cho trực quan

const CourseCard = ({ course, isTeacherView = false }) => {
  // 1. Hàm hiển thị Status Badge (Giữ nguyên logic của bạn)
  const renderStatusBadge = () => {
    if (!isTeacherView || !course.status) return null;

    const statusMap = {
      'APPROVED': { text: 'Đã duyệt', class: 'bg-green-100 text-green-800' },
      'PENDING_REVIEW': { text: 'Chờ duyệt', class: 'bg-orange-100 text-orange-800' },
      'DRAFT': { text: 'Bản nháp', class: 'bg-gray-200 text-gray-800' },
    };
    
    const currentStatus = statusMap[course.status] || statusMap['DRAFT'];

    return (
      <span className={`absolute top-2 left-2 px-3 py-1 text-[10px] font-bold uppercase rounded-full z-10 shadow-sm border border-white ${currentStatus.class}`}>
        {currentStatus.text}
      </span>
    );
  };

  // 2. SỬA TẠI ĐÂY: Tất cả đều dẫn về trang chi tiết công khai
  // Khi vào trang này, Component CourseDetailPage sẽ tự nhận diện role và hiện nút "Sửa"
  const detailPath = `/course/${course.id}`;
  
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 overflow-hidden flex flex-col h-full relative group">
      
      {/* Thumbnail */}
      <div className="h-44 bg-gray-200 relative overflow-hidden">
        <Link to={detailPath} className="block w-full h-full">
          <img 
            src={course.thumbnail || course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-all flex items-center justify-center">
             <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
          </div>
        </Link>
        
        {/* HIỂN THỊ STATUS BADGE (CHỈ CHO GV) */}
        {renderStatusBadge()}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category/Role Badge */}
        <div className="mb-2">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${isTeacherView ? 'text-amber-600 bg-amber-50' : 'text-indigo-600 bg-indigo-50'}`}>
            {isTeacherView ? 'Khóa học của tôi' : 'Khóa học mới'}
          </span>
        </div>

        {/* Title */}
        <Link to={detailPath} className="block">
          <h3 className="text-md font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-tight">
            {course.title}
          </h3>
        </Link>
        
        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1 leading-relaxed">
          {course.description}
        </p>

        {/* Footer */}
        <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={course.instructor_avatar || `https://ui-avatars.com/api/?name=${course.instructor_name || 'GV'}&background=random`} 
              className="w-6 h-6 rounded-full border border-gray-100"
              alt=""
            />
            <span className="text-[11px] font-semibold text-gray-600 truncate max-w-[80px]">
              {course.instructor_name || "Giảng viên"}
            </span>
          </div>
          
          <Link 
            to={detailPath}
            className={`text-xs font-black flex items-center gap-1 transition-transform group-hover:translate-x-1 ${isTeacherView ? 'text-amber-600' : 'text-indigo-600'}`}
          >
            {isTeacherView ? (
              <><Settings size={14} /> QUẢN LÝ</>
            ) : (
              'CHI TIẾT'
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;