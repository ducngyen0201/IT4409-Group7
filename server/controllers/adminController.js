const db = require('../db');
const notificationController = require('./notificationController');

// 1. Lấy danh sách tất cả khóa học (Kèm tên giáo viên)
exports.getAllCourses = async (req, res) => {
  try {
    const query = `
      SELECT c.*, u.full_name as instructor_name, u.email as instructor_email
      FROM courses c
      JOIN course_instructors ci ON c.id = ci.course_id
      JOIN users u ON ci.user_id = u.id
      ORDER BY 
        CASE WHEN c.status = 'PENDING_REVIEW' THEN 0 ELSE 1 END, 
        c.updated_at ASC
    `;
    const result = await db.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Lỗi lấy danh sách khóa học (Admin):", err.message);
    res.status(500).json({ error: 'Lỗi Server' });
  }
};

// 2. Cập nhật trạng thái khóa học (Duyệt/Từ chối)
exports.updateCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; 

    // 1. Cập nhật trạng thái trong DB
    const result = await db.query(
      "UPDATE courses SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length > 0) {
      const course = result.rows[0];
      const instructorId = course.created_by; // Giả định cột này lưu ID giáo viên

      // 2. Gửi thông báo cho Giáo viên
      const message = status === 'APPROVED' 
        ? `Chúc mừng! Khóa học "${course.title}" của bạn đã được duyệt và công khai.` 
        : `Khóa học "${course.title}" của bạn bị từ chối. Lý do: ${reason || 'Vui lòng kiểm tra lại nội dung.'}`;
      
      await notificationController.createNotification(
        instructorId, 
        'COURSE_STATUS', 
        message, 
        { course_id: id, status: status }
      );
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

// 3. Lấy danh sách tất cả người dùng
exports.getAllUsers = async (req, res) => {
  try {
    // Không lấy password_hash để đảm bảo bảo mật
    const query = `
      SELECT id, email, full_name, role, is_active, avatar, created_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Lỗi lấy danh sách người dùng:", err.message);
    res.status(500).json({ error: 'Lỗi Server' });
  }
};

// 4. Khóa hoặc Mở khóa tài khoản người dùng
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const adminId = req.user.id; // ID của Admin đang thực hiện lệnh

    // 1. Kiểm tra xem đối tượng bị tác động có phải là Admin không
    const userCheck = await db.query("SELECT role FROM users WHERE id = $1", [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const targetUser = userCheck.rows[0];

    // 2. NGĂN CHẶN: Nếu đối tượng là ADMIN, không cho phép khóa
    if (targetUser.role === 'ADMIN') {
      return res.status(403).json({ 
        error: 'Vi phạm bảo mật', 
        message: 'Không thể khóa tài khoản của quản trị viên khác.' 
      });
    }

    // 3. Thực hiện cập nhật nếu đối tượng là STUDENT hoặc TEACHER
    const result = await db.query(
      "UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, full_name, is_active",
      [is_active, id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi thay đổi trạng thái người dùng:", err.message);
    res.status(500).json({ error: 'Lỗi Server' });
  }
};