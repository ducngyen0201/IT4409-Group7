import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Vòng tròn xoay */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-lg shadow-indigo-500/50"></div>
        
        {/* Chữ nhấp nháy (Màu tối cho nền sáng) */}
        <p className="text-indigo-700 font-medium animate-pulse text-sm tracking-wide uppercase">
          Đang tải dữ liệu...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;