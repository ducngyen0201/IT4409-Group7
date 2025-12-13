require('dotenv').config();

// ----- 1. IMPORT CÁC THƯ VIỆN -----
const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const meRoutes = require('./routes/meRoutes');
const quizRoutes = require('./routes/quizRoutes');
const questionRoutes = require('./routes/questionRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const systemRoutes = require('./routes/systemRoutes');
const materialRoutes = require('./routes/materialRoutes');
const optionRoutes = require('./routes/optionRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ----- 2. CẤU HÌNH MIDDLEWARE -----
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true 
}));

app.use(express.json());
app.use('/uploads', express.static('uploads')); 

// ----- 3. TẠO ROUTE ĐỂ KIỂM TRA -----
app.get('/api/test', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT NOW();');
    res.json({ message: 'Kết nối database thành công!', time: rows[0].now });
  } catch (err) {
    console.error('Lỗi kết nối database:', err.message);
    res.status(500).json({ error: 'Không thể kết nối đến database.' });
  }
});

// ----- 4. SỬ DỤNG CÁC ROUTE -----
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/me', meRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/threads', discussionRoutes);
app.use('/api', systemRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/options', optionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Đã xảy ra lỗi hệ thống!', 
    details: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ----- 5. KHỞI CHẠY SERVER -----
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
  console.log(`Chấp nhận request từ: ${process.env.CLIENT_URL || 'All sources'}`);
});
