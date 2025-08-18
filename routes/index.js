// routes/index.js - Main route organization (FIXED for Node.js v12)
const express = require('express');
const router = express.Router();
const { getDashboardHTML } = require('../views/dashboard');
const { getUrgentInterventionsHTML } = require('../views/urgentInterventions');

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

// Urgent interventions page
router.get('/nodetest/urgent', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(getUrgentInterventionsHTML());
});

// API routes
router.use('/nodetest/api', apiRoutes);

module.exports = router;