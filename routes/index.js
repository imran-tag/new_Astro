// routes/index.js - Main route organization
const express = require('express');
const router = express.Router();
const { getDashboardHTML } = require('../views/dashboard');

// Import API routes
const apiRoutes = require('./api');

// Main routes
router.get('/', (req, res) => {
    res.redirect('/nodetest');
});

router.get('/nodetest', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(getDashboardHTML());
});

router.get('/nodetest/', (req, res) => {
    res.redirect('/nodetest');
});

// API routes
router.use('/nodetest/api', apiRoutes);

module.exports = router;