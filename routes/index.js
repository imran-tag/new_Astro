// routes/index.js - Main route organization (FIXED for Node.js v12)
const express = require('express');
const router = express.Router();
const { getDashboardHTML } = require('../views/dashboard');
const { getUrgentInterventionsHTML } = require('../views/urgentInterventions');

// Import API routes
const apiRoutes = require('./api');

// Try to import the new views, with error handling
let getAllInterventionsHTML, getCreateInterventionHTML;
try {
    ({ getAllInterventionsHTML } = require('../views/allInterventions'));
} catch (error) {
    console.error('Error importing allInterventions view:', error.message);
}

try {
    ({ getCreateInterventionHTML } = require('../views/createIntervention'));
} catch (error) {
    console.error('Error importing createIntervention view:', error.message);
}

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

// All interventions page
router.get('/nodetest/interventions', (req, res) => {
    if (getAllInterventionsHTML) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(getAllInterventionsHTML());
    } else {
        res.status(500).send('All interventions view not available');
    }
});

// Create intervention page
router.get('/nodetest/create-intervention', (req, res) => {
    if (getCreateInterventionHTML) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(getCreateInterventionHTML());
    } else {
        res.status(500).send('Create intervention view not available');
    }
});

// API routes
router.use('/nodetest/api', apiRoutes);

module.exports = router;