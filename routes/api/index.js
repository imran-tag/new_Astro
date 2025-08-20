// routes/api/index.js - Updated with debug endpoint
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

// NEW: Action endpoints for interventions
router.post('/generate-rapport', interventionsController.generateRapport);
router.post('/generate-quitus', interventionsController.generateQuitus);
router.delete('/delete-intervention', interventionsController.deleteIntervention);
router.get('/public-intervention/:interventionId', interventionsController.getPublicIntervention);

// NEW: Debug endpoint for image paths
router.get('/debug-images/:interventionId', interventionsController.debugImagePaths);

// NEW: Test endpoint for public intervention debugging
router.get('/test-public/:interventionId', interventionsController.testPublicIntervention);

// NEW: Debug endpoint for dropdown data
router.get('/debug-dropdowns', interventionsController.debugDropdownData);

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