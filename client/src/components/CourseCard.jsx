import React from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
  // Tạo ảnh ngẫu nhiên nếu không có ảnh (Dùng dịch vụ picsum hoặc placeholder màu)
  const randomImage = `https://ui-avatars.com/api/?name=${course.title}&background=random&size=400&font-size=0.33`;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col h-full">
      {/* 1. Thumbnail */}
      <div className="h-48 bg-gray-200 relative overflow-hidden group">
        <img 
          src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} // Ảnh demo mặc định
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
      </div>

      {/* 2. Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Category Badge (Ví dụ) */}
        <div className="mb-2">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider">
            Course
          </span>
        </div>

        {/* Title */}
        <Link to={`/course/${course.id}`} className="block">
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
              {course.instructor_name}
            </span>
          </div>
          
          <Link 
            to={`/course/${course.id}`}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
          >
            Xem chi tiết →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;