// ----- 1. LOAD BIẾN MÔI TRƯỜNG -----
// Nó sẽ đọc file .env và đưa DATABASE_URL vào 'process.env'
require('dotenv').config();

// ----- 2. IMPORT CÁC THƯ VIỆN -----
const express = require('express');
const cors = require('cors');
// Import file db.js (sau khi đã load .env)
const db = require('./db'); 

// Import routes
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ----- 3. SỬ DỤNG MIDDLEWARE -----
app.use(cors());
app.use(express.json());

// ----- 4. TẠO ROUTE ĐỂ KIỂM TRA (TEST) -----
// API endpoint này dùng để kiểm tra xem kết nối có thành công không
app.get('/api/test', async (req, res) => {
  try {
    // Sử dụng hàm 'query' từ db.js để gửi lệnh SQL
    const { rows } = await db.query('SELECT NOW();');
    
    // Nếu thành công, trả về ngày giờ hiện tại từ database
    res.json({ message: 'Kết nối database thành công!', time: rows[0].now });
  } catch (err) {
    console.error('Lỗi kết nối database:', err.message);
    res.status(500).json({ error: 'Không thể kết nối đến database.' });
  }
});

// Bất kỳ request nào bắt đầu bằng /api/auth sẽ được gửi đến authRoutes
app.use('/api/auth', authRoutes);

// ----- 5. KHỞI CHẠY SERVER -----
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
});