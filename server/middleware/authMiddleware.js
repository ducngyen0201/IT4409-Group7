const jwt = require('jsonwebtoken');

// 1. Bảo vệ Cấp 1: Kiểm tra xem người dùng đã đăng nhập chưa (có token hợp lệ không)
exports.protect = async (req, res, next) => {
  let token;

  // Kiểm tra xem header 'Authorization' có tồn tại và bắt đầu bằng 'Bearer' không
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 1. Tách lấy token (bỏ chữ 'Bearer ')
      token = req.headers.authorization.split(' ')[1];

      // 2. Xác thực token (dùng 'JWT_SECRET' từ file .env)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Gắn thông tin user (payload) vào đối tượng 'req'
      req.user = decoded; 

      // 4. Cho phép đi tiếp
      next();
    } catch (error) {
      console.error('Lỗi xác thực token:', error);
      res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Chưa xác thực, không có token.' });
  }
};

// 2. Bảo vệ Cấp 2: Kiểm tra xem người dùng có phải là Giáo viên không
exports.isTeacher = (req, res, next) => {
  // Cho phép cả 'TEACHER' và 'ADMIN' tạo khóa học
  if (req.user && (req.user.role === 'TEACHER' || req.user.role === 'ADMIN')) {
    next(); // Là giáo viên hoặc admin, cho phép đi tiếp
  } else {
    res.status(403).json({ error: 'Bạn không có quyền (Không phải Giáo viên).' });
  }
};

// 3. Bảo vệ Cấp 2: Kiểm tra xem người dùng có phải là Học sinh không
exports.isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'STUDENT') {
    next(); // Là học sinh, cho phép đi tiếp
  } else {
    res.status(403).json({ error: 'Bạn không có quyền (Không phải Học sinh).' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Quyền truy cập bị từ chối. Yêu cầu quyền Admin.' });
  }
};