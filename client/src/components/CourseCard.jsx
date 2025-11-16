import React from 'react';
import { Link } from 'react-router-dom';

function CourseCard({ course }) {
  return (
    // Bọc toàn bộ thẻ bằng <Link>
    <Link 
      to={`/course/${course.id}`} 
      className="block overflow-hidden bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      <div className="p-6">
        {/* Mã khóa học (code) */}
        <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold tracking-wide text-indigo-600 uppercase bg-indigo-100 rounded-full">
          {course.code}
        </span>
        {/* Tiêu đề */}
        <h3 className="mb-2 text-xl font-bold text-gray-900">
          {course.title}
        </h3>
        {/* Mô tả */}
        <p className="text-base text-gray-700 line-clamp-3">
          {course.description}
        </p>
      </div>
    </Link>
  );
}

export default CourseCard;