// app.js - Production version with proper routes
const express = require('express');
const path = require('path');

// Import organized modules
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for nodetest
app.use('/nodetest', express.static('public'));
app.use('/', express.static('public')); // Fallback for root access

// Routes
app.use('/', routes);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`404 for path: ${req.path}`);
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Dashboard: astro-tech.fr/nodetest`);
    console.log(`📁 Static files served from: /nodetest/css/ and /nodetest/js/`);
}).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
});

module.exports = app;