// file: server/db.js

const { Pool } = require('pg');

// Khởi tạo Pool
// Thư viện 'pg' sẽ tự động tìm và sử dụng biến môi trường 'DATABASE_URL'
// khi chúng ta cấu hình nó bằng chuỗi kết nối.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Chúng ta export một object với một hàm 'query'
// Bất cứ khi nào chúng ta muốn truy vấn database, chúng ta sẽ gọi hàm này.
module.exports = {
  query: (text, params) => pool.query(text, params),
};