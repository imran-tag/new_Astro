// routes/index.js - Main route organization with Public Intervention
const express = require('express');
const router = express.Router();
const path = require('path');
const { getDashboardHTML } = require('../views/dashboard');
const { getUrgentInterventionsHTML } = require('../views/urgentInterventions');

// Import API routes
const apiRoutes = require('./api');

// Try to import the new views, with error handling
let getAllInterventionsHTML, getCreateInterventionHTML, getPublicInterventionHTML;
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

try {
    ({ getPublicInterventionHTML } = require('../views/publicIntervention'));
} catch (error) {
    console.error('Error importing publicIntervention view:', error.message);
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

// NEW: Public intervention page
router.get('/nodetest/interventions/public/:interventionId', (req, res) => {
    if (getPublicInterventionHTML) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(getPublicInterventionHTML());
    } else {
        res.status(500).send('Public intervention view not available');
    }
});

// NEW: Serve generated files (PDFs, documents)
router.use('/nodetest/generated', express.static(path.join(__dirname, '../generated')));

// API routes
router.use('/nodetest/api', apiRoutes);

router.get('/nodetest/chantiers-simple', (req, res) => {
    const { getSimpleChantiersHTML } = require('../views/simpleChantiers');
    res.send(getSimpleChantiersHTML());
});

module.exports = router;