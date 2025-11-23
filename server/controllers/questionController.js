const db = require('../db');

// [STT 36] Thêm câu hỏi vào quiz
// POST /api/quizzes/:id/questions
exports.createQuestion = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const teacherId = req.user.userId;
    
    // Lấy thông tin câu hỏi từ body
    const { type, prompt, points, position } = req.body;

    // 1. KIỂM TRA QUYỀN SỞ HỮU
    // Phải join qua 3 bảng: quizzes -> lectures -> courses -> course_instructors
    const ownershipCheck = await db.query(
      `SELECT q.id 
       FROM quizzes q
       JOIN lectures l ON q.lecture_id = l.id
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE q.id = $1 AND ci.user_id = $2`,
      [quizId, teacherId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa Quiz này.' });
    }

    // 2. THÊM CÂU HỎI
    const newQuestion = await db.query(
      `INSERT INTO questions (quiz_id, type, prompt, points, position)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        quizId,
        type,
        prompt,
        points || 1.0,
        position || 1 
      ]
    );

    res.status(201).json(newQuestion.rows[0]);

  } catch (err) {
    console.error("Lỗi khi tạo câu hỏi:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { id: questionId } = req.params;
    const userId = req.user.userId;
    const { prompt, points, type, position } = req.body;

    // Check quyền (Join questions -> quizzes -> lectures -> courses -> instructors)
    const checkOwner = await db.query(
      `SELECT q.id FROM questions q
       JOIN quizzes z ON q.quiz_id = z.id
       JOIN lectures l ON z.lecture_id = l.id
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE q.id = $1 AND ci.user_id = $2`,
      [questionId, userId]
    );
    if (checkOwner.rows.length === 0) return res.status(403).json({ error: 'Không có quyền.' });

    // Update
    const result = await db.query(
      `UPDATE questions SET 
         prompt = COALESCE($1, prompt),
         points = COALESCE($2, points),
         type = COALESCE($3, type),
         position = COALESCE($4, position)
       WHERE id = $5 RETURNING *`,
      [prompt, points, type, position, questionId]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};