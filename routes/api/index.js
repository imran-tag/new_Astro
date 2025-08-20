// routes/api/index.js - API route organization (FIXED for Node.js v12)
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

// Urgent interventions API with pagination
router.get('/urgent-all', interventionsController.getUrgentAll);

// All recent interventions API with pagination and filters
router.get('/all-recent', interventionsController.getAllRecent);

// Get technicians for filter dropdown
router.get('/technicians', interventionsController.getTechnicians);

// Assignment endpoints
router.post('/assign-technician', interventionsController.assignTechnician);
router.post('/assign-date', interventionsController.assignDate);

// Create intervention endpoints (with error handling)
try {
    router.get('/intervention-number', interventionsController.getInterventionNumber);
    router.get('/intervention-statuses', interventionsController.getInterventionStatuses);
    router.get('/intervention-types', interventionsController.getInterventionTypes);
    router.get('/businesses', interventionsController.getBusinesses);
    router.get('/clients', interventionsController.getClients);
    router.post('/create-intervention', interventionsController.createIntervention);
} catch (error) {
    console.error('Error setting up create intervention routes:', error);
}

module.exports = router;