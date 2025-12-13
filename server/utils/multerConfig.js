const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Đảm bảo thư mục 'uploads' tồn tại
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Cấu hình nơi lưu trữ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    // Đặt tên file
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// 3. [MỚI] Bộ lọc kiểm tra file có phải là ảnh không
const fileFilter = (req, file, cb) => {
  // Các đuôi file cho phép
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  // Kiểm tra đuôi file (extname)
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  // Kiểm tra kiểu MIME (mimetype)
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true); // Cho phép upload
  } else {
    cb(new Error('Chỉ được phép upload file ảnh (jpeg, jpg, png, gif)!'));
  }
};

// 4. Xuất ra middleware với cấu hình đầy đủ
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, //Giới hạn file tối đa 5MB
  fileFilter: fileFilter 
});

module.exports = upload;