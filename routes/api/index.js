// routes/api/index.js - Updated with file upload middleware

const express = require('express');
const router = express.Router();

// Import API controllers
const testController = require('../../controllers/testController');
const statsController = require('../../controllers/statsController');
const interventionsController = require('../../controllers/interventionsController');

// File upload middleware (if not already configured in main app)
const fileUpload = require('express-fileupload');

// Configure file upload middleware for this router
router.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    abortOnLimit: true,
    createParentPath: true
}));

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

// Action endpoints for interventions
router.post('/generate-rapport', interventionsController.generateRapport);
router.post('/generate-quitus', interventionsController.generateQuitus);
router.delete('/delete-intervention', interventionsController.deleteIntervention);
router.get('/public-intervention/:interventionId', interventionsController.getPublicIntervention);

// Debug endpoints
router.get('/debug-images/:interventionId', interventionsController.debugImagePaths);
router.get('/test-public/:interventionId', interventionsController.testPublicIntervention);
router.get('/debug-dropdowns', interventionsController.debugDropdownData);

// Create intervention endpoints
router.get('/intervention-number', interventionsController.getInterventionNumber);
router.get('/intervention-statuses', interventionsController.getInterventionStatuses);
router.get('/intervention-types', interventionsController.getInterventionTypes);
router.get('/businesses', interventionsController.getBusinesses);
router.get('/clients', interventionsController.getClients);

// CREATE INTERVENTION - with file upload support
router.post('/create-intervention', interventionsController.createIntervention);

module.exports = router;