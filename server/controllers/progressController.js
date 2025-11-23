const db = require('../db');

exports.updateLectureProgress = async (req, res) => {
  try {
    const { id: lectureId } = req.params;
    const studentId = req.user.userId;
    
    // progress_percent: Số từ 0 đến 100 (Frontend gửi lên)
    const { progress_percent } = req.body;

    // 1. Kiểm tra xem học sinh có quyền học bài này không
    const accessCheck = await db.query(
      `SELECT e.id 
       FROM enrollments e
       JOIN lectures l ON e.course_id = l.course_id
       WHERE l.id = $1 AND e.student_id = $2 AND e.status = 'APPROVED'`,
      [lectureId, studentId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn chưa đăng ký khóa học này.' });
    }

    // 2. XÁC ĐỊNH TRẠNG THÁI HOÀN THÀNH
    const isCompleted = parseFloat(progress_percent) >= 100;

    // 3. UPSERT (Cập nhật hoặc Thêm mới) vào bảng 'lecture_progress'
    const query = `
      INSERT INTO lecture_progress 
        (lecture_id, student_id, progress_percent, last_viewed_at, completed_at)
      VALUES 
        ($1, $2, $3, NOW(), ${isCompleted ? 'NOW()' : 'NULL'})
      ON CONFLICT (lecture_id, student_id) 
      DO UPDATE SET 
        progress_percent = EXCLUDED.progress_percent,
        last_viewed_at = NOW(),
        completed_at = CASE 
          WHEN lecture_progress.completed_at IS NOT NULL THEN lecture_progress.completed_at
          WHEN EXCLUDED.completed_at IS NOT NULL THEN EXCLUDED.completed_at
          ELSE lecture_progress.completed_at
        END
      RETURNING *
    `;

    const result = await db.query(query, [lectureId, studentId, progress_percent]);

    res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error("Lỗi cập nhật tiến độ:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.userId;

    // 1. Đếm tổng số bài giảng trong khóa học (chỉ tính bài đã publish)
    const totalLecturesQuery = await db.query(
      "SELECT COUNT(*) FROM lectures WHERE course_id = $1 AND is_published = true",
      [courseId]
    );
    const totalLectures = parseInt(totalLecturesQuery.rows[0].count) || 0;

    // 2. Đếm số bài giảng ĐÃ HOÀN THÀNH (completed_at IS NOT NULL)
    const completedLecturesQuery = await db.query(
      `SELECT COUNT(*) 
       FROM lecture_progress lp
       JOIN lectures l ON lp.lecture_id = l.id
       WHERE l.course_id = $1 AND lp.student_id = $2 AND lp.completed_at IS NOT NULL`,
      [courseId, studentId]
    );
    const completedLectures = parseInt(completedLecturesQuery.rows[0].count) || 0;

    // 3. Tính phần trăm tổng
    const percent = totalLectures === 0 ? 0 : Math.round((completedLectures / totalLectures) * 100);

    res.status(200).json({
      course_id: courseId,
      total_lectures: totalLectures,
      completed_lectures: completedLectures,
      course_progress_percent: percent
    });

  } catch (err) {
    console.error("Lỗi lấy tiến độ khóa học:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.getCourseProgressForTeacher = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    
    // 1. Đếm tổng số bài giảng trong khóa học
    const totalLecturesQuery = await db.query(
      "SELECT COUNT(*) FROM lectures WHERE course_id = $1 AND is_published = true",
      [courseId]
    );
    const totalLectures = parseInt(totalLecturesQuery.rows[0].count) || 1; // Tránh chia cho 0

    // 2. Lấy danh sách học viên và đếm số bài họ đã hoàn thành
    const result = await db.query(
      `SELECT 
          u.id as student_id,
          u.full_name,
          u.email,
          COUNT(lp.completed_at) as completed_count
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       LEFT JOIN lectures l ON l.course_id = e.course_id
       LEFT JOIN lecture_progress lp ON lp.lecture_id = l.id AND lp.student_id = u.id AND lp.completed_at IS NOT NULL
       WHERE e.course_id = $1 AND e.status = 'APPROVED'
       GROUP BY u.id, u.full_name, u.email`,
      [courseId]
    );

    // 3. Tính phần trăm cho từng học viên
    const studentProgress = result.rows.map(row => ({
      student_id: row.student_id,
      full_name: row.full_name,
      email: row.email,
      completed_lectures: parseInt(row.completed_count),
      total_lectures: totalLectures,
      progress_percent: Math.round((parseInt(row.completed_count) / totalLectures) * 100)
    }));

    res.status(200).json(studentProgress);

  } catch (err) {
    console.error("Lỗi xem tiến độ lớp học:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};