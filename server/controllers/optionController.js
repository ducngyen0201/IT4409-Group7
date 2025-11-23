const db = require('../db');

exports.createOption = async (req, res) => {
  try {
    const { id: questionId } = req.params;
    const teacherId = req.user.userId;
    
    // Lấy thông tin đáp án từ body
    const { content, is_correct, position } = req.body;

    // 1. KIỂM TRA QUYỀN SỞ HỮU
    const ownershipCheck = await db.query(
      `SELECT q.id 
       FROM questions q
       JOIN quizzes z ON q.quiz_id = z.id
       JOIN lectures l ON z.lecture_id = l.id
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE q.id = $1 AND ci.user_id = $2`,
      [questionId, teacherId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa câu hỏi này.' });
    }

    // 2. THÊM ĐÁP ÁN
    const newOption = await db.query(
      `INSERT INTO options (question_id, content, is_correct, position)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        questionId,
        content,
        is_correct || false, // Mặc định là sai
        position || 1        // Thứ tự hiển thị
      ]
    );

    res.status(201).json(newOption.rows[0]);

  } catch (err) {
    console.error("Lỗi khi tạo đáp án:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.updateOption = async (req, res) => {
  try {
    const { id: optionId } = req.params;
    const teacherId = req.user.userId;
    const { content, is_correct, position } = req.body;

    // 1. KIỂM TRA QUYỀN SỞ HỮU (Join qua 5 bảng)
    const checkOwner = await db.query(
      `SELECT o.id 
       FROM options o
       JOIN questions q ON o.question_id = q.id
       JOIN quizzes z ON q.quiz_id = z.id
       JOIN lectures l ON z.lecture_id = l.id
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE o.id = $1 AND ci.user_id = $2`,
      [optionId, teacherId]
    );

    if (checkOwner.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa đáp án này.' });
    }

    // 2. CẬP NHẬT
    const result = await db.query(
      `UPDATE options SET 
         content = COALESCE($1, content),
         is_correct = COALESCE($2, is_correct),
         position = COALESCE($3, position)
       WHERE id = $4 RETURNING *`,
      [content, is_correct, position, optionId]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

exports.deleteOption = async (req, res) => {
  try {
    const { id: optionId } = req.params;
    const teacherId = req.user.userId;

    // 1. KIỂM TRA QUYỀN SỞ HỮU (Y hệt ở trên)
    const checkOwner = await db.query(
      `SELECT o.id 
       FROM options o
       JOIN questions q ON o.question_id = q.id
       JOIN quizzes z ON q.quiz_id = z.id
       JOIN lectures l ON z.lecture_id = l.id
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE o.id = $1 AND ci.user_id = $2`,
      [optionId, teacherId]
    );

    if (checkOwner.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa đáp án này.' });
    }

    // 2. XÓA
    await db.query("DELETE FROM options WHERE id = $1", [optionId]);

    res.status(200).json({ message: 'Đã xóa đáp án.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};