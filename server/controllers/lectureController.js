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

exports.getLectureDetails = async (req, res) => {
  try {
    const { id: lectureId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // 1. Lấy thông tin bài giảng để biết nó thuộc khóa học nào (course_id)
    const lectureQuery = await db.query(
      "SELECT * FROM lectures WHERE id = $1",
      [lectureId]
    );

    if (lectureQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bài giảng.' });
    }

    const lecture = lectureQuery.rows[0];
    const courseId = lecture.course_id;

    // 2. KIỂM TRA QUYỀN TRUY CẬP
    let hasAccess = false;

    if (userRole === 'TEACHER' || userRole === 'ADMIN') {
      // Nếu là Giáo viên: Kiểm tra xem có dạy khóa này không
      const instructorCheck = await db.query(
        "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
        [courseId, userId]
      );
      if (instructorCheck.rows.length > 0) {
        hasAccess = true;
      }

    } else if (userRole === 'STUDENT') {
      // Nếu là Học sinh: Kiểm tra xem đã đăng ký và được duyệt chưa
      const enrollmentCheck = await db.query(
        "SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2 AND status = 'APPROVED'",
        [courseId, userId]
      );
      if (enrollmentCheck.rows.length > 0) {
        hasAccess = true;
      }
    }

    // Nếu không có quyền
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Bạn chưa đăng ký khóa học này hoặc chưa được duyệt.' 
      });
    }

    // 3. NẾU CÓ QUYỀN -> Lấy thêm tài liệu của bài giảng đó
    const materialsQuery = await db.query(
      "SELECT * FROM materials WHERE lecture_id = $1",
      [lectureId]
    );

    // 4. Trả về kết quả 
    res.status(200).json({
      lecture: lecture,
      materials: materialsQuery.rows
    });

  } catch (err) {
    console.error("Lỗi khi lấy chi tiết bài giảng:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.getLecturesByCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    
    // Logic phân quyền
    let isInstructor = false;
    if (req.user && (req.user.role === 'TEACHER' || req.user.role === 'ADMIN')) {
       const check = await db.query(
         "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
         [courseId, req.user.userId]
       );
       if (check.rows.length > 0) isInstructor = true;
    }

    let query = `
      SELECT 
        l.*,
        COALESCE(
          json_agg(DISTINCT m.*) FILTER (WHERE m.id IS NOT NULL), 
          '[]'
        ) as materials,
        COALESCE(
          json_agg(DISTINCT q.*) FILTER (WHERE q.id IS NOT NULL), 
          '[]'
        ) as quizzes
      FROM lectures l
      LEFT JOIN materials m ON l.id = m.lecture_id
      LEFT JOIN quizzes q ON l.id = q.lecture_id
      WHERE l.course_id = $1
    `;
    
    // Nếu KHÔNG phải giáo viên -> Chỉ lấy bài đã publish
    if (!isInstructor) {
      query += " AND l.is_published = true";
    }

    query += " GROUP BY l.id ORDER BY l.position ASC";

    const lectures = await db.query(query, [courseId]);
    res.status(200).json(lectures.rows);

  } catch (err) {
    console.error("Lỗi lấy danh sách bài giảng:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

exports.updateLecture = async (req, res) => {
  try {
    const { id: lectureId } = req.params;
    const teacherId = req.user.userId;
    const { title, content, position, video_url, duration_sec } = req.body;

    // 1. Kiểm tra quyền sở hữu (Join lectures -> course_instructors)
    const checkOwner = await db.query(
      `SELECT l.id 
       FROM lectures l
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE l.id = $1 AND ci.user_id = $2`,
      [lectureId, teacherId]
    );

    if (checkOwner.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa bài giảng này.' });
    }

    // 2. Update động
    const fields = [];
    const values = [];
    let idx = 1;

    if (title) { fields.push(`title = $${idx++}`); values.push(title); }
    if (content) { fields.push(`content = $${idx++}`); values.push(content); }
    if (position) { fields.push(`position = $${idx++}`); values.push(position); }
    if (video_url) { fields.push(`video_url = $${idx++}`); values.push(video_url); } // Nếu bạn có cột này
    if (duration_sec) { fields.push(`duration_sec = $${idx++}`); values.push(duration_sec); }
    
    fields.push(`updated_at = NOW()`); // Luôn cập nhật thời gian

    if (fields.length === 0) return res.status(400).json({ error: 'Không có dữ liệu cập nhật.' });

    values.push(lectureId);
    const query = `UPDATE lectures SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;

    const updatedLecture = await db.query(query, values);
    res.status(200).json(updatedLecture.rows[0]);

  } catch (err) {
    console.error("Lỗi cập nhật bài giảng:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

exports.publishLecture = async (req, res) => {
  try {
    const { id: lectureId } = req.params;
    const teacherId = req.user.userId;

    // 1. Kiểm tra quyền
    const checkOwner = await db.query(
      `SELECT l.id 
       FROM lectures l
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE l.id = $1 AND ci.user_id = $2`,
      [lectureId, teacherId]
    );

    if (checkOwner.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền.' });
    }

    // 2. Update is_published = true
    const result = await db.query(
      "UPDATE lectures SET is_published = true, updated_at = NOW() WHERE id = $1 RETURNING *",
      [lectureId]
    );

    res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error("Lỗi xuất bản bài giảng:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};