const db = require('../db');
const bcrypt = require('bcrypt');

// 1. Lấy danh sách khóa học đã tham gia
exports.getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const myEnrollments = await db.query(
      `SELECT e.status, e.requested_at, e.approved_at,
              c.id as course_id, c.code, c.title, c.description
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = $1
       ORDER BY e.requested_at DESC`,
      [studentId]
    );
    res.status(200).json(myEnrollments.rows);
  } catch (err) {
    console.error("Lỗi getMyEnrollments:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

// 2. Lấy thông tin cá nhân hiện tại
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const query = "SELECT id, email, full_name, avatar, role, is_active, created_at FROM users WHERE id = $1";
    const { rows } = await db.query(query, [userId]);

    if (rows.length === 0) return res.status(404).json({ error: 'User không tồn tại' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

// 3. Cập nhật thông tin cá nhân (không bao gồm avatar)
exports.updateInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { full_name } = req.body; // Chỉ lấy các trường text

    if (!full_name) {
      return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });
    }

    const query = `
      UPDATE users 
      SET full_name = $1
      WHERE id = $2
      RETURNING id, full_name, email, avatar, role
    `;

    const { rows } = await db.query(query, [full_name, userId]);
    
    res.json({ 
      message: 'Cập nhật thông tin thành công', 
      user: rows[0] 
    });

  } catch (err) {
    console.error("Lỗi updateInfo:", err);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
};

// 4. Cập nhật ảnh đại diện
exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Kiểm tra xem Middleware Multer đã bắt được file chưa
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file ảnh' });
    }

    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const avatarUrl = `${serverUrl}/uploads/${req.file.filename}`;

    const query = `
      UPDATE users 
      SET avatar = $1
      WHERE id = $2
      RETURNING id, full_name, email, avatar, role
    `;

    const { rows } = await db.query(query, [avatarUrl, userId]);

    res.json({ 
      message: 'Đổi ảnh đại diện thành công', 
      avatar: rows[0].avatar,
      user: rows[0]
    });

  } catch (err) {
    console.error("Lỗi updateAvatar:", err);
    res.status(500).json({ error: "Lỗi server khi upload ảnh" });
  }
};

// 5. Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const { rows } = await db.query("SELECT password_hash FROM users WHERE id = $1", [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User không tồn tại' });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);
    
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// 6. Lấy danh sách bài Quiz đã làm
exports.getMyQuizzes = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const result = await db.query(
      `SELECT qa.*, q.title as quiz_title, c.title as course_title
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       JOIN lectures l ON q.lecture_id = l.id
       JOIN courses c ON l.course_id = c.id
       WHERE qa.student_id = $1
       ORDER BY qa.started_at DESC`,
      [studentId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

// 7. Lấy danh sách khóa học tôi dạy
exports.getMyTeachingCourses = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const result = await db.query(
      `SELECT c.*, ci.role as instructor_role
       FROM courses c
       JOIN course_instructors ci ON c.id = ci.course_id
       WHERE ci.user_id = $1
       ORDER BY c.created_at DESC`,
      [teacherId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};