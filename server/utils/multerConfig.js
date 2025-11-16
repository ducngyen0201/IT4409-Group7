const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục 'uploads' tồn tại
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình nơi lưu trữ (Storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Lưu file vào thư mục 'uploads/'
  },
  filename: (req, file, cb) => {
    // Tạo một tên file duy nhất: fieldname-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Xuất ra middleware 'upload'
const upload = multer({ storage: storage });
module.exports = upload;