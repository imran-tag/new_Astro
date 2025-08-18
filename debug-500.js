// debug-500.js - Run this to debug the 500 error
const fs = require('fs');
const path = require('path');

console.log('🐞 DEBUG: Finding 500 error cause...\n');

// Check if all required files exist
const requiredNewFiles = [
    'views/urgentInterventions.js',
    'public/js/urgent.js'
];

console.log('📄 Checking new files:');
requiredNewFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
        
        // Check if file has content
        const stats = fs.statSync(file);
        if (stats.size === 0) {
            console.log(`   ⚠️  File is empty!`);
        } else {
            console.log(`   📏 Size: ${stats.size} bytes`);
        }
    } else {
        console.log(`❌ ${file} - MISSING (this could cause 500 error)`);
    }
});

// Check if the module exports are correct
console.log('\n🔍 Checking module exports:');

try {
    const dashboard = require('./views/dashboard.js');
    console.log('✅ views/dashboard.js exports:', Object.keys(dashboard));
} catch (error) {
    console.log('❌ views/dashboard.js error:', error.message);
}

try {
    if (fs.existsSync('views/urgentInterventions.js')) {
        const urgent = require('./views/urgentInterventions.js');
        console.log('✅ views/urgentInterventions.js exports:', Object.keys(urgent));
    } else {
        console.log('❌ views/urgentInterventions.js not found');
    }
} catch (error) {
    console.log('❌ views/urgentInterventions.js error:', error.message);
}

try {
    const queryBuilder = require('./utils/queryBuilder.js');
    console.log('✅ utils/queryBuilder.js exports:', Object.keys(queryBuilder));
} catch (error) {
    console.log('❌ utils/queryBuilder.js error:', error.message);
}

try {
    const interventionsController = require('./controllers/interventionsController.js');
    console.log('✅ controllers/interventionsController.js exports:', Object.keys(interventionsController));
} catch (error) {
    console.log('❌ controllers/interventionsController.js error:', error.message);
}

// Check database connection
console.log('\n🗄️  Testing database connection:');
try {
    const { pool } = require('./config/database.js');
    console.log('✅ Database config loaded');
    
    // Test connection
    (async () => {
        try {
            const connection = await pool.getConnection();
            console.log('✅ Database connection successful');
            
            // Test if interventions table exists
            const [tables] = await connection.execute("SHOW TABLES LIKE 'interventions'");
            if (tables.length > 0) {
                console.log('✅ interventions table exists');
            } else {
                console.log('❌ interventions table not found');
            }
            
            connection.release();
        } catch (dbError) {
            console.log('❌ Database connection failed:', dbError.message);
        }
    })();
    
} catch (error) {
    console.log('❌ Database config error:', error.message);
}

// Check routes
console.log('\n🛣️  Checking routes:');
try {
    const routes = require('./routes/index.js');
    console.log('✅ Main routes loaded');
} catch (error) {
    console.log('❌ Main routes error:', error.message);
}

try {
    const apiRoutes = require('./routes/api/index.js');
    console.log('✅ API routes loaded');
} catch (error) {
    console.log('❌ API routes error:', error.message);
}

console.log('\n💡 COMMON 500 ERROR CAUSES:');
console.log('1. Missing views/urgentInterventions.js file');
console.log('2. Missing public/js/urgent.js file');
console.log('3. Syntax error in queryBuilder.js (buildUrgentAllQuery function)');
console.log('4. Missing getUrgentAll function in interventionsController.js');
console.log('5. Database connection issues');

console.log('\n🚀 QUICK FIXES:');
console.log('1. Make sure all files from the artifacts are created');
console.log('2. Check server logs: node app.js (look for detailed error)');
console.log('3. Test specific URLs:');
console.log('   - http://localhost:3000/nodetest (should work)');
console.log('   - http://localhost:3000/nodetest/urgent (500 error here?)');
console.log('   - http://localhost:3000/nodetest/api/urgent-all (API endpoint)');

console.log('\n⚡ If still getting 500, run: node -e "console.log(require(\'./views/urgentInterventions.js\'))"');
console.log('   This will show the exact error in the urgent interventions file.');