const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


module.exports = {
  // 1. Hàm 'query'
  query: (text, params) => pool.query(text, params),
  // 2. Hàm 'getClient' để lấy client cho transaction
  getClient: () => pool.connect(), 
};