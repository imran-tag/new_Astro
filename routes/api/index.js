// routes/api/index.js - API route organization (FIXED)
const express = require('express');
const router = express.Router();

// Import API controllers
const testController = require('../../controllers/testController');
const statsController = require('../../controllers/statsController');
const interventionsController = require('../../controllers/interventionsController');

// API Routes
router.get('/test-db', testController.testDatabase);
router.get('/stats', statsController.getStats);
router.get('/urgent', interventionsController.getUrgent);
router.get('/recent', interventionsController.getRecent);
router.get('/interventions/:status?', interventionsController.getFiltered);

// New urgent interventions API with pagination - THIS WAS MISSING
router.get('/urgent-all', interventionsController.getUrgentAll);

module.exports = router;