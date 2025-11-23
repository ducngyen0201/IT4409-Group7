const db = require('../db');

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await db.query(
      `SELECT a.*, u.email as actor_email 
       FROM audit_logs a
       LEFT JOIN users u ON a.actor_id = u.id
       ORDER BY a.created_at DESC 
       LIMIT 100`
    );
    res.status(200).json(logs.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

exports.getHealth = async (req, res) => {
  try {
    const startTime = Date.now();
    await db.query("SELECT 1");
    const duration = Date.now() - startTime;

    res.status(200).json({
      status: 'OK',
      timestamp: new Date(),
      database: {
        status: 'Connected',
        latency_ms: duration
      },
      server_uptime: process.uptime()
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'ERROR', 
      database: 'Disconnected', 
      error: err.message 
    });
  }
};


exports.getVersion = (req, res) => {
  res.status(200).json({
    version: '1.0.0',
    name: 'E-Learning API',
    description: 'API phục vụ hệ thống học trực tuyến'
  });
};