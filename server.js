const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database configuration - Update with your cPanel MySQL details
const dbConfig = {
  host: 'localhost',
  user: 'astrotec_db',
  password: '@sTr0t3cH',
  database: 'astrotec_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
// Create connection pool
const pool = mysql.createPool(dbConfig);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Get counts by status
    const [stats] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM interventions 
      GROUP BY status
    `);
    
    // Format the stats for frontend
    const formattedStats = {
      received: 0,
      assigned: 0,
      inProgress: 0,
      completed: 0,
      billed: 0,
      paid: 0
    };
    
    stats.forEach(stat => {
      switch(stat.status.toLowerCase()) {
        case 'received':
          formattedStats.received = stat.count;
          break;
        case 'assigned':
          formattedStats.assigned = stat.count;
          break;
        case 'in progress':
          formattedStats.inProgress = stat.count;
          break;
        case 'completed':
          formattedStats.completed = stat.count;
          break;
        case 'billed':
          formattedStats.billed = stat.count;
          break;
        case 'paid':
          formattedStats.paid = stat.count;
          break;
      }
    });
    
    connection.release();
    res.json(formattedStats);
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// API endpoint to get urgent interventions (within 48h)
app.get('/api/urgent', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [urgent] = await connection.execute(`
      SELECT 
        intervention_id,
        client_name,
        service_type,
        description,
        status,
        due_date,
        assigned_to,
        TIMESTAMPDIFF(HOUR, NOW(), due_date) as hours_remaining
      FROM interventions 
      WHERE due_date <= DATE_ADD(NOW(), INTERVAL 48 HOUR)
      AND status NOT IN ('completed', 'billed', 'paid')
      ORDER BY due_date ASC
      LIMIT 10
    `);
    
    connection.release();
    res.json(urgent);
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// API endpoint to get recent interventions
app.get('/api/recent', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [recent] = await connection.execute(`
      SELECT 
        intervention_id,
        client_name,
        service_type,
        description,
        status,
        due_date,
        assigned_to
      FROM interventions 
      ORDER BY created_date DESC
      LIMIT 10
    `);
    
    connection.release();
    res.json(recent);
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    res.json({ success: true, message: 'Database connected successfully!' });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Dashboard available at: http://localhost:${PORT}`);
});

module.exports = app;