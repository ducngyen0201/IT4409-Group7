import React, { useState, useEffect } from 'react';

const CustomModal = ({ isOpen, onClose, type, title, message, defaultValue, onConfirm }) => {
  const [inputValue, setInputValue] = useState('');

  // Reset giá trị input khi mở modal
  useEffect(() => {
    if (isOpen && type === 'prompt') {
      setInputValue(defaultValue || '');
    }
  }, [isOpen, type, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputValue); // Trả về text đã nhập
    } else {
      onConfirm(); // Chỉ xác nhận
    }
    onClose();
  };

  return (
    // Overlay đen mờ
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      
      {/* Hộp thoại trắng ở giữa */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">{title || 'Thông báo'}</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-600 mb-4">{message}</p>

          {/* Ô nhập liệu cho loại 'prompt' (Đổi tên) */}
          {type === 'prompt' && (
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              autoFocus
            />
          )}
        </div>

        {/* Footer (Buttons) */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          {/* Nút Hủy / Đóng (Luôn hiện) */}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition"
          >
            {type === 'alert' ? 'Đóng' : 'Hủy bỏ'}
          </button>

          {/* Nút Xác nhận (Chỉ hiện cho confirm/prompt) */}
          {type !== 'alert' && (
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-white rounded-lg font-medium shadow-md transition
                ${type === 'confirm' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {type === 'confirm' ? 'Xóa ngay' : 'Lưu thay đổi'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomModal;