// app-debug.js - Debug version to find the exact 500 error
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced error logging
app.use((req, res, next) => {
    console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Middleware
app.use('/nodetest', express.static('public'));
app.use('/', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test the urgent route directly first
app.get('/nodetest/urgent', (req, res) => {
    console.log('🎯 Urgent route hit!');
    try {
        const { getUrgentInterventionsHTML } = require('./views/urgentInterventions');
        console.log('✅ urgentInterventions imported successfully');
        
        const html = getUrgentInterventionsHTML();
        console.log('✅ HTML generated successfully, length:', html.length);
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) {
        console.error('❌ Error in urgent route:', error);
        res.status(500).send(`
            <h1>500 Error in Urgent Route</h1>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Stack:</strong></p>
            <pre>${error.stack}</pre>
            <a href="/nodetest">Back to Dashboard</a>
        `);
    }
});

// Test the API route
app.get('/nodetest/api/urgent-all', (req, res) => {
    console.log('🎯 API urgent-all route hit!');
    try {
        const interventionsController = require('./controllers/interventionsController');
        console.log('✅ interventionsController imported');
        
        if (interventionsController.getUrgentAll) {
            console.log('✅ getUrgentAll function exists');
            interventionsController.getUrgentAll(req, res);
        } else {
            console.log('❌ getUrgentAll function missing');
            res.status(500).json({ error: 'getUrgentAll function not found' });
        }
    } catch (error) {
        console.error('❌ Error in API route:', error);
        res.status(500).json({ 
            error: 'API Error',
            message: error.message,
            stack: error.stack
        });
    }
});

// Import routes with error handling
try {
    console.log('📂 Loading routes...');
    const routes = require('./routes');
    console.log('✅ Routes loaded successfully');
    app.use('/', routes);
} catch (error) {
    console.error('❌ Error loading routes:', error);
    
    // Fallback routes if main routes fail
    app.get('/nodetest', (req, res) => {
        res.send(`
            <h1>Dashboard (Fallback)</h1>
            <p>Main routes failed to load: ${error.message}</p>
            <a href="/nodetest/urgent">Test Urgent Page</a><br>
            <a href="/nodetest/api/urgent-all">Test API</a>
        `);
    });
}

// Enhanced error handling
app.use((error, req, res, next) => {
    console.error('🚨 GLOBAL ERROR HANDLER:', error);
    console.error('Request URL:', req.url);
    console.error('Request method:', req.method);
    console.error('Error stack:', error.stack);
    
    if (req.url.includes('/api/')) {
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            url: req.url,
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(500).send(`
            <h1>500 Internal Server Error</h1>
            <p><strong>URL:</strong> ${req.url}</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Stack:</strong></p>
            <pre>${error.stack}</pre>
            <a href="/nodetest">Back to Dashboard</a>
        `);
    }
});

// 404 handler
app.use((req, res) => {
    console.log('❌ 404 for:', req.url);
    res.status(404).send(`
        <h1>404 Not Found</h1>
        <p>Path: ${req.url}</p>
        <a href="/nodetest">Back to Dashboard</a>
    `);
});

// Start server with enhanced logging
app.listen(PORT, () => {
    console.log(`✅ Debug server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/nodetest`);
    console.log(`🚨 Urgent page: http://localhost:${PORT}/nodetest/urgent`);
    console.log(`📡 API test: http://localhost:${PORT}/nodetest/api/urgent-all`);
    console.log(`\n📝 Watch console for detailed error logs...`);
}).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
});

module.exports = app;