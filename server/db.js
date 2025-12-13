const { Pool } = require('pg');

// Kiểm tra xem có đang chạy ở môi trường production (online) không
const isProduction = process.env.NODE_ENV === 'production';

// Cấu hình kết nối
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

module.exports = {
  // 1. Hàm 'query' dùng cho các lệnh đơn lẻ
  query: (text, params) => pool.query(text, params),
  
  // 2. Hàm 'getClient' dùng cho Transaction (BEGIN, COMMIT, ROLLBACK)
  getClient: () => pool.connect(), 
};