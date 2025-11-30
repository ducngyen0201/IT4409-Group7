// 1. Hàm Format để HIỂN THỊ
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// 2. Hàm Format cho Ô INPUT
export const formatForInput = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const pad = (n) => String(n).padStart(2, '0');
  
  // Trả về YYYY-MM-DDThh:mm
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};