const db = require('../db');

exports.createQuiz = async (req, res) => {
  try {
    const { id: lectureId } = req.params;
    const teacherId = req.user.userId;
    
    const {
      title, 
      time_limit_sec, 
      attempts_allowed, 
      grading_policy,
      due_at,
      shuffle_questions
    } = req.body;

    // 1. KIỂM TRA QUYỀN: Giáo viên này có sở hữu bài giảng này không?
    const ownershipCheck = await db.query(
      `SELECT l.id 
       FROM lectures l
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE l.id = $1 AND ci.user_id = $2`,
      [lectureId, teacherId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền thêm Quiz vào bài giảng này.' });
    }

    // 2. KIỂM TRA TRÙNG LẶP: Bài giảng này đã có Quiz chưa?
    const existingQuiz = await db.query(
      "SELECT id FROM quizzes WHERE lecture_id = $1",
      [lectureId]
    );

    if (existingQuiz.rows.length > 0) {
      return res.status(400).json({ error: 'Bài giảng này đã có bài trắc nghiệm rồi.' });
    }

    // 3. TẠO QUIZ MỚI
    const newQuiz = await db.query(
      `INSERT INTO quizzes 
       (lecture_id, title, time_limit_sec, attempts_allowed, grading_policy, due_at, is_published, shuffle_questions)
       VALUES ($1, $2, $3, $4, $5, $6, false, $7) 
       RETURNING *`,
      [
        lectureId,
        title,
        time_limit_sec || null,
        attempts_allowed || 1,
        grading_policy || 'HIGHEST',
        due_at || null,
        shuffle_questions || false
      ]
    );

    res.status(201).json(newQuiz.rows[0]);

  } catch (err) {
    console.error("Lỗi khi tạo quiz:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.getQuizByLecture = async (req, res) => {
  try {
    const { id: lectureId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    // 1. Lấy Quiz
    const quizQuery = await db.query("SELECT * FROM quizzes WHERE lecture_id = $1", [lectureId]);
    if (quizQuery.rows.length === 0) return res.status(404).json({ error: 'Bài giảng này chưa có Quiz.' });
    
    const quiz = quizQuery.rows[0];

    // 2. Logic Quyền xem:
    // - Giáo viên: Xem được hết (để sửa).
    // - Học sinh: Chỉ xem được nếu quiz đã PUBLIC (is_published = true).
    
    if (role === 'STUDENT' && !quiz.is_published) {
      return res.status(403).json({ error: 'Quiz chưa được xuất bản.' });
    }

    res.status(200).json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const userId = req.user.userId;
    const { title, time_limit_sec, attempts_allowed, grading_policy, due_at, shuffle_questions } = req.body;

    const cleanDueAt = due_at === "" ? null : due_at;
    // Check quyền sở hữu (Join quizzes -> lectures -> courses -> instructors)
    const checkOwner = await db.query(
      `SELECT q.id FROM quizzes q
       JOIN lectures l ON q.lecture_id = l.id
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE q.id = $1 AND ci.user_id = $2`,
      [quizId, userId]
    );
    if (checkOwner.rows.length === 0) return res.status(403).json({ error: 'Không có quyền.' });

    // Update động
    const result = await db.query(
      `UPDATE quizzes SET 
          title = COALESCE($1, title),
          time_limit_sec = COALESCE($2, time_limit_sec),
          attempts_allowed = COALESCE($3, attempts_allowed),
          grading_policy = COALESCE($4, grading_policy),
          due_at = COALESCE($5, due_at),
          shuffle_questions = COALESCE($6, shuffle_questions)
        WHERE id = $7 RETURNING *`,
      [title, time_limit_sec, attempts_allowed, grading_policy, cleanDueAt, shuffle_questions, quizId]
      // Truyền cleanDueAt vào thay vì due_at trực tiếp
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

exports.publishQuiz = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const userId = req.user.userId;

    // Check quyền
    const checkOwner = await db.query(
      `SELECT q.id FROM quizzes q
       JOIN lectures l ON q.lecture_id = l.id
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE q.id = $1 AND ci.user_id = $2`,
      [quizId, userId]
    );
    if (checkOwner.rows.length === 0) return res.status(403).json({ error: 'Không có quyền.' });

    // Update
    const result = await db.query(
      "UPDATE quizzes SET is_published = true WHERE id = $1 RETURNING *", 
      [quizId]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

exports.getQuizGrade = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    // Logic:
    // - Giáo viên: Xem điểm trung bình của TẤT CẢ học sinh.
    // - Học sinh: Xem điểm (cao nhất/trung bình) của CHÍNH MÌNH.

    let query = "";
    const params = [quizId];

    if (role === 'TEACHER' || role === 'ADMIN') {
      // Giáo viên: Tính trung bình cộng tất cả bài nộp
      query = `
        SELECT 
          COUNT(*) as total_attempts,
          AVG(score) as average_score,
          MIN(score) as min_score,
          MAX(score) as max_score
        FROM quiz_attempts 
        WHERE quiz_id = $1 AND status = 'SUBMITTED'
      `;
    } else {
      // Học sinh: Lấy thống kê của chính mình
      query = `
        SELECT 
          COUNT(*) as my_attempts,
          MAX(score) as highest_score,
          AVG(score) as average_score
        FROM quiz_attempts 
        WHERE quiz_id = $1 AND student_id = $2 AND status = 'SUBMITTED'
      `;
      params.push(userId);
    }

    const result = await db.query(query, params);
    res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error("Lỗi lấy điểm quiz:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

// [API Bổ sung] Lấy chi tiết Quiz theo ID
exports.getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const quizQuery = await db.query("SELECT * FROM quizzes WHERE id = $1", [id]);

    if (quizQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy Quiz.' });
    }

    res.status(200).json(quizQuery.rows[0]);
  } catch (err) {
    console.error("Lỗi lấy quiz theo ID:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};