import React, { useState, useEffect } from 'react';

const CustomModal = ({ 
  isOpen, 
  onClose, 
  type, // 'alert' | 'confirm' | 'prompt'
  title, 
  message, 
  defaultValue, 
  onConfirm,
  confirmText,
  confirmColor
}) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen && type === 'prompt') {
      setInputValue(defaultValue || '');
    }
  }, [isOpen, type, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputValue); 
    } else {
      onConfirm();
    }
    onClose();
  };

  // Xác định màu nút mặc định nếu không truyền vào
  const getButtonColor = () => {
    if (confirmColor) return confirmColor; // Ưu tiên màu truyền vào
    if (type === 'confirm') return 'bg-red-600 hover:bg-red-700';
    return 'bg-indigo-600 hover:bg-indigo-700';
  };

  // Xác định chữ trên nút mặc định
  const getButtonText = () => {
    if (confirmText) return confirmText; // Ưu tiên chữ truyền vào
    if (type === 'confirm') return 'Xóa ngay';
    return 'Lưu thay đổi';
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-fade-in-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">{title || 'Thông báo'}</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-600 mb-4">{message}</p>

          {/* Ô nhập liệu (Prompt) */}
          {type === 'prompt' && (
            <div>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                rows="3"
                placeholder="Nhập nội dung tại đây..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition"
          >
            {type === 'alert' ? 'Đóng' : 'Hủy bỏ'}
          </button>

          {type !== 'alert' && (
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-white rounded-lg font-medium shadow-md transition ${getButtonColor()}`}
            >
              {getButtonText()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomModal;