const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Hàm làm sạch tên file (Sanitizer) - xóa dấu tiếng Việt, khoảng trắng
const sanitizeFilename = (filename) => {
  const originalName = path.parse(filename).name;
  return originalName
    .toLowerCase()
    .normalize("NFD")               // Tách dấu
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
    .replace(/[đĐ]/g, "d")           // Sửa chữ đ
    .replace(/[^a-z0-9]/g, "_")      // Ký tự đặc biệt thành _
    .replace(/_+/g, "_");            // Xóa gạch dưới thừa
};

// 1. Cấu hình Storage đi thẳng lên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = sanitizeFilename(file.originalname);
    const uniqueName = `${cleanName}-${Date.now()}`;

    // Tự động phân loại thư mục và resource_type trên Cloudinary
    let folder = 'elearning/others';
    let resource_type = 'raw'; // Mặc định cho PDF, docx, zip...

    if (['.jpg', '.png', '.jpeg', '.webp'].includes(ext)) {
      resource_type = 'image';
      folder = 'elearning/avatars';
    } else if (['.mp4', '.mkv', '.mov'].includes(ext)) {
      resource_type = 'video';
      folder = 'elearning/videos';
    }

    return {
      folder: folder,
      resource_type: resource_type,
      public_id: uniqueName, // Cloudinary sẽ dùng cái này làm tên file trên Cloud
    };
  },
});

// 2. Bộ lọc (Vẫn có thể giữ để giới hạn loại file nếu cần)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.mp4'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true); // Chấp nhận file, cho phép tải lên Cloudinary
  } else {
    cb(new Error('Định dạng file không được hỗ trợ!'), false); // Chặn ngay lập tức
  }
};

// 3. Xuất middleware
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Tăng giới hạn lên 20MB
  fileFilter: fileFilter 
});

module.exports = upload;