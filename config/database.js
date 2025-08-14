// config/database.js - Database configuration
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'astrotec_db',
    password: '@sTr0t3cH',
    database: 'astrotec_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

module.exports = { dbConfig, pool };