// routes/api/index.js - Updated with chantiers API routes

const express = require('express');
const router = express.Router();

// Import API controllers
const testController = require('../../controllers/testController');
const statsController = require('../../controllers/statsController');
const interventionsController = require('../../controllers/interventionsController');

// Import chantiers controller with error handling
let chantiersController;
try {
    chantiersController = require('../../controllers/chantiersController');
} catch (error) {
    console.error('Error importing chantiersController:', error.message);
}

// File upload middleware (if not already configured in main app)
const fileUpload = require('express-fileupload');

// Configure file upload middleware for this router
router.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    abortOnLimit: true,
    createParentPath: true
}));

// Basic API Routes
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

// EXISTING business/client routes (now with fixed number display)
router.get('/businesses', interventionsController.getBusinesses); // Now shows "104 - Business Title"
router.get('/clients', interventionsController.getClients);

// Business filtering routes for maintenance/chantier separation
router.post('/get-businesses-by-status-and-type', interventionsController.getBusinessesByStatusAndType);
router.get('/business-categories', interventionsController.getBusinessCategories);
router.get('/businesses-array', interventionsController.getBusinessesArray); // Alternative format

// CREATE INTERVENTION - with file upload support
router.post('/create-intervention', interventionsController.createIntervention);

// NEW: Chantiers API Routes
if (chantiersController) {
    // Chantiers dashboard stats
    router.get('/chantiers/stats', chantiersController.getChantiersStats);
    
    // Chantier interventions with filters and pagination
    router.get('/chantiers/:chantier_uid/interventions', chantiersController.getChantierInterventions);
    
    console.log('Chantiers API routes registered successfully');
} else {
    // Fallback routes if controller not available
    router.get('/chantiers/stats', (req, res) => {
        console.error('Chantiers stats requested but controller not available');
        res.status(500).json({
            success: false,
            message: 'Chantiers controller not available. Please check if controllers/chantiersController.js exists.'
        });
    });
    
    router.get('/chantiers/:chantier_uid/interventions', (req, res) => {
        console.error('Chantier interventions requested but controller not available');
        res.status(500).json({
            success: false,
            message: 'Chantiers controller not available. Please check if controllers/chantiersController.js exists.'
        });
    });
    
    console.log('Chantiers API fallback routes registered');
}
// Add this to your routes/api/index.js for debugging chantier 122

// DEBUG: Test specific chantier endpoint
router.get('/debug-chantier/:chantier_uid', async (req, res) => {
    const { chantier_uid } = req.params;
    console.log(`=== DEBUGGING CHANTIER ${chantier_uid} ===`);
    
    try {
        // Get database connection
        let pool;
        try {
            ({ pool } = require('../../config/database'));
        } catch (error) {
            const mysql = require('mysql2/promise');
            pool = mysql.createPool({
                host: 'localhost',
                user: 'astrotec_db',
                password: '@sTr0t3cH',
                database: 'astrotec_db',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            // Check if business exists
            const [businessResult] = await connection.execute(`
                SELECT b.uid, b.number, b.title, b.agency_uid, b.client_uid, b.tenant_uid
                FROM businesses b 
                WHERE b.uid = ?
            `, [chantier_uid]);
            
            // Check interventions for this business
            const [interventionsResult] = await connection.execute(`
                SELECT i.uid, i.number, i.title, i.status_uid, i.business_uid, i.agency_uid,
                       st.name as status_name
                FROM interventions i
                LEFT JOIN interventions_status st ON i.status_uid = st.uid
                WHERE i.business_uid = ? AND i.uid != 0
                LIMIT 5
            `, [chantier_uid]);
            
            // Check if this business number is in chantier range
            const chantierNumbers = [144, 146, 150, 155, 156, 157, 158, 159, 160, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184];
            const isChantier = businessResult.length > 0 && chantierNumbers.includes(parseInt(businessResult[0].number));
            
            // Check table structure
            const [businessColumns] = await connection.execute(`
                DESCRIBE businesses
            `);
            
            const [interventionsColumns] = await connection.execute(`
                DESCRIBE interventions
            `);
            
            const response = {
                success: true,
                debug_info: {
                    requested_chantier_uid: chantier_uid,
                    business_found: businessResult.length > 0,
                    business_data: businessResult[0] || null,
                    is_chantier: isChantier,
                    interventions_count: interventionsResult.length,
                    interventions_sample: interventionsResult,
                    chantier_numbers: chantierNumbers,
                    table_structures: {
                        businesses_columns: businessColumns.map(col => col.Field),
                        interventions_columns: interventionsColumns.map(col => col.Field)
                    }
                }
            };
            
            console.log('Debug response:', response);
            res.json(response);
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Add this to your routes/api/index.js to test the exact query that's failing

router.get('/test-interventions/:chantier_uid', async (req, res) => {
    const { chantier_uid } = req.params;
    console.log(`=== TESTING INTERVENTIONS QUERY FOR CHANTIER ${chantier_uid} ===`);
    
    try {
        // Get database connection
        let pool;
        try {
            ({ pool } = require('../../config/database'));
        } catch (error) {
            const mysql = require('mysql2/promise');
            pool = mysql.createPool({
                host: 'localhost',
                user: 'astrotec_db',
                password: '@sTr0t3cH',
                database: 'astrotec_db',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            // Test 1: Simple count
            console.log('TEST 1: Simple count');
            const [countTest] = await connection.execute(`
                SELECT COUNT(*) as total 
                FROM interventions i 
                WHERE i.uid != 0 AND i.agency_uid = 1 AND i.business_uid = ?
            `, [chantier_uid]);
            console.log('Count result:', countTest);
            
            // Test 2: Basic interventions without joins
            console.log('TEST 2: Basic interventions without joins');
            const [basicTest] = await connection.execute(`
                SELECT 
                    i.uid as intervention_id,
                    i.number,
                    i.title,
                    i.status_uid,
                    i.business_uid
                FROM interventions i
                WHERE i.uid != 0 AND i.agency_uid = 1 AND i.business_uid = ?
                LIMIT 5
            `, [chantier_uid]);
            console.log('Basic interventions:', basicTest);
            
            // Test 3: Check what status table actually exists
            console.log('TEST 3: Check status tables');
            const [tables] = await connection.execute(`SHOW TABLES LIKE '%status%'`);
            console.log('Tables containing "status":', tables);
            
            // Test 4: Try different status table names
            let statusTableName = null;
            const statusTableOptions = ['intervention_status', 'interventions_status', 'interventions_statuses', 'status'];
            
            for (const tableName of statusTableOptions) {
                try {
                    const [testTable] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName} LIMIT 1`);
                    console.log(`Table ${tableName} exists with ${testTable[0].count} records`);
                    statusTableName = tableName;
                    break;
                } catch (error) {
                    console.log(`Table ${tableName} does not exist`);
                }
            }
            
            // Test 5: Try the join with correct status table
            let joinTest = null;
            if (statusTableName) {
                console.log(`TEST 4: Testing join with status table: ${statusTableName}`);
                try {
                    const [joinResult] = await connection.execute(`
                        SELECT 
                            i.uid as intervention_id,
                            i.number,
                            i.title,
                            i.description,
                            i.status_uid,
                            st.name as status
                        FROM interventions i
                        LEFT JOIN ${statusTableName} st ON i.status_uid = st.uid
                        WHERE i.uid != 0 AND i.agency_uid = 1 AND i.business_uid = ?
                        LIMIT 3
                    `, [chantier_uid]);
                    console.log('Join test result:', joinResult);
                    joinTest = joinResult;
                } catch (error) {
                    console.log('Join test failed:', error.message);
                }
            }
            
            // Test 6: Check technicians table
            let techniciansTest = null;
            try {
                const [techTest] = await connection.execute(`SELECT COUNT(*) as count FROM technicians LIMIT 1`);
                console.log(`Technicians table exists with ${techTest[0].count} records`);
                techniciansTest = 'exists';
            } catch (error) {
                console.log('Technicians table does not exist:', error.message);
                techniciansTest = 'missing';
            }
            
            const response = {
                success: true,
                tests: {
                    count_test: countTest[0],
                    basic_interventions: basicTest,
                    status_tables_found: tables,
                    correct_status_table: statusTableName,
                    join_test: joinTest,
                    technicians_table: techniciansTest
                },
                debug_info: {
                    chantier_uid: chantier_uid,
                    agency_uid: 1
                }
            };
            
            console.log('All tests completed');
            res.json(response);
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});
// Add this SIMPLE test endpoint to your routes/api/index.js file:

// MINIMAL TEST - Add this line in routes/api/index.js
router.get('/chantiers/:chantier_uid/interventions', (req, res) => {
    console.log('🔥 ENDPOINT HIT - Chantier interventions requested for:', req.params.chantier_uid);
    
    // Just return fake data to test if the endpoint is working
    res.json({
        success: true,
        interventions: [
            {
                intervention_id: 12345,
                number: "TEST-123",
                title: "Test Intervention",
                description: "This is a test",
                date_time: "2024-01-01",
                status: "Test Status",
                technician_firstname: "Test",
                technician_lastname: "User",
                priority: "normale",
                address: "Test Address",
                city: "Test City"
            }
        ],
        pagination: {
            current_page: 1,
            total_pages: 1,
            total_records: 1,
            per_page: 20
        },
        debug: {
            endpoint_reached: true,
            chantier_uid: req.params.chantier_uid,
            query_params: req.query
        }
    });
});

// Add this line BEFORE the module.exports line in your routes/api/index.js
// Add this before module.exports in your routes/api/index.js

// Add this before the module.exports line in routes/api/index.js
module.exports = router;