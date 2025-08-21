// controllers/testController.js
const { pool } = require('../config/database');

exports.testDatabase = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            await connection.execute('SELECT 1');
            
            const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM interventions');
            const total = countResult[0].total;
            
            res.json({ 
                success: true, 
                message: `Database connected! Found ${total} interventions.`,
                totalInterventions: total,
                timestamp: new Date().toISOString()
            });
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Database connection failed: ' + error.message 
        });
    }
};