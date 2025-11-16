const db = require('../db');

exports.createLecture = async (req, res) => {
  try {
    // 1. Lấy thông tin từ client
    const { id: course_id } = req.params; // Lấy 'id' từ URL và đổi tên thành 'course_id'
    const { title, content, position } = req.body;

    // 2. Lấy ID của giáo viên (từ token)
    const teacherId = req.user.userId;

    // 3. KIỂM TRA QUYỀN: Giáo viên này có phải là giảng viên của khóa học này không?
    const checkOwnership = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [course_id, teacherId]
    );

    if (checkOwnership.rows.length === 0) {
      // Nếu không tìm thấy, giáo viên này không có quyền thêm bài giảng
      return res.status(403).json({ 
        error: 'Bạn không phải là giảng viên của khóa học này.' 
      });
    }

    // 4. Nếu có quyền -> Thêm bài giảng vào database
    const newLecture = await db.query(
      `INSERT INTO lectures (course_id, title, content, position) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        course_id, 
        title, 
        content || null,
        position || 1
      ]
    );

    // 5. Trả về bài giảng vừa tạo
    res.status(201).json(newLecture.rows[0]);

  } catch (err) {
    console.error("Lỗi khi tạo bài giảng:", err.message);
    // Lỗi nếu course_id không tồn tại
    if (err.code === '23503') {
       return res.status(400).json({ error: 'Khóa học (course_id) không tồn tại.' });
    }
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};