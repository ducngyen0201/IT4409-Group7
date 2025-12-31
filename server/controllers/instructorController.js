const db = require('../db');

exports.getInstructors = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const result = await db.query(
      `SELECT ci.*, u.full_name, u.email 
       FROM course_instructors ci
       JOIN users u ON ci.user_id = u.id
       WHERE ci.course_id = $1`,
      [courseId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

exports.addInstructor = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const ownerId = req.user.userId;
    const { user_id, role } = req.body; // role: 'ASSISTANT'

    // 1. Kiểm tra quyền OWNER
    const checkOwner = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2 AND role = 'OWNER'",
      [courseId, ownerId]
    );
    if (checkOwner.rows.length === 0) return res.status(403).json({ error: 'Chỉ chủ sở hữu mới được thêm giảng viên.' });

    // 2. Thêm
    const newInstructor = await db.query(
      `INSERT INTO course_instructors (course_id, user_id, role) VALUES ($1, $2, $3) RETURNING *`,
      [courseId, user_id, role || 'ASSISTANT']
    );
    res.status(201).json(newInstructor.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

exports.removeInstructor = async (req, res) => {
  try {
    const { id: courseId, userId: targetUserId } = req.params;
    const ownerId = req.user.userId;

    // 1. Kiểm tra quyền OWNER
    const checkOwner = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2 AND role = 'OWNER'",
      [courseId, ownerId]
    );
    if (checkOwner.rows.length === 0) return res.status(403).json({ error: 'Chỉ chủ sở hữu mới được xóa giảng viên.' });

    // 2. Xóa
    await db.query(
      "DELETE FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [courseId, targetUserId]
    );
    res.status(200).json({ message: "Đã xóa giảng viên." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

exports.checkInstructorPermission = async (req, res) => {
  try {
    // Lưu ý: Route là /:id nên params phải là id
    const { id } = req.params; 
    const userId = req.user.userId; // Lấy từ middleware protect

    // Truy vấn bảng course_instructors (sử dụng course_id và user_id)
    const result = await db.query(
      "SELECT id FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [id, userId]
    );

    // Trả về true nếu tìm thấy bản ghi, ngược lại false
    res.status(200).json({ isInstructor: result.rows.length > 0 });
  } catch (err) {
    console.error("Lỗi Backend:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ khi kiểm tra quyền" });
  }
};