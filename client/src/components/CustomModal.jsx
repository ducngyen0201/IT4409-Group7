import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, HelpCircle } from 'lucide-react';

const CustomModal = ({ 
  isOpen, 
  onClose, 
  type = 'alert',
  title, 
  message, 
  defaultValue, 
  onConfirm,
  confirmText,
  confirmColor
}) => {
  const [inputValue, setInputValue] = useState('');

  // Reset input khi mở modal prompt
  useEffect(() => {
    if (isOpen && type === 'prompt') {
      setInputValue(defaultValue || '');
    }
  }, [isOpen, type, defaultValue]);

  if (!isOpen) return null;

  // Xử lý khi bấm nút Confirm/Đồng ý
  const handleConfirm = () => {
    if (onConfirm) {
      if (type === 'prompt') {
        onConfirm(inputValue);
      } else {
        onConfirm();
      }
    }
  };

  // Chọn Icon dựa trên Type
  const renderIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500 w-12 h-12 mx-auto" />;
      case 'error': return <AlertCircle className="text-red-500 w-12 h-12 mx-auto" />;
      case 'confirm': 
      case 'prompt': return <HelpCircle className="text-yellow-500 w-12 h-12 mx-auto" />;
      default: return <Info className="text-blue-500 w-12 h-12 mx-auto" />;
    }
  };

  // Xác định màu nút Confirm
  const getConfirmButtonClass = () => {
    if (confirmColor) return confirmColor;
    if (type === 'error') return 'bg-red-600 hover:bg-red-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        
        {/* Nút tắt nhanh góc phải */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={20} />
        </button>

        <div className="px-6 py-8 text-center">
          {/* 1. Icon */}
          <div className="mb-4">
            {renderIcon()}
          </div>
          
          {/* 2. Title & Message */}
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {title || (type === 'success' ? 'Thành công' : type === 'error' ? 'Lỗi' : 'Thông báo')}
          </h3>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            {message}
          </p>

          {/* 3. Input cho loại Prompt */}
          {type === 'prompt' && (
            <div className="mb-6 text-left">
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                rows="3"
                placeholder="Nhập nội dung..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* 4. Action Buttons */}
          <div className="flex justify-center gap-3">
            {/* Logic hiển thị nút:
                - Nếu là 'confirm' hoặc 'prompt': Hiện 2 nút (Hủy & Đồng ý)
                - Các trường hợp còn lại (success, error, alert): Chỉ hiện 1 nút (Đóng)
            */}
            {(type === 'confirm' || type === 'prompt') ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium text-sm shadow-md transition ${getConfirmButtonClass()}`}
                >
                  {confirmText || 'Đồng ý'}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-md transition"
              >
                Đóng
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomModal;