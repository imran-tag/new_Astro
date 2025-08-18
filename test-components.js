// test-components.js - Test each component individually
console.log('🧪 Testing each component...\n');

// Test 1: urgentInterventions view
console.log('1️⃣ Testing urgentInterventions view...');
try {
    const { getUrgentInterventionsHTML } = require('./views/urgentInterventions');
    const html = getUrgentInterventionsHTML();
    console.log('✅ urgentInterventions works, HTML length:', html.length);
} catch (error) {
    console.log('❌ urgentInterventions ERROR:', error.message);
}

// Test 2: interventionsController
console.log('\n2️⃣ Testing interventionsController...');
try {
    const controller = require('./controllers/interventionsController');
    console.log('✅ Controller loaded, exports:', Object.keys(controller));
    
    if (controller.getUrgentAll) {
        console.log('✅ getUrgentAll function exists');
    } else {
        console.log('❌ getUrgentAll function MISSING');
    }
} catch (error) {
    console.log('❌ Controller ERROR:', error.message);
}

// Test 3: queryBuilder
console.log('\n3️⃣ Testing queryBuilder...');
try {
    const { buildInterventionQuery, buildUrgentAllQuery } = require('./utils/queryBuilder');
    console.log('✅ QueryBuilder loaded');
    
    // Test buildUrgentAllQuery
    const testFilters = {
        search: '',
        status: '',
        missing: '',
        timeFilter: '',
        sortBy: 'hours_remaining',
        sortOrder: 'asc',
        limit: 25,
        offset: 0
    };
    
    const { query, countQuery } = buildUrgentAllQuery(testFilters);
    console.log('✅ buildUrgentAllQuery works');
    console.log('📏 Query length:', query.length);
    console.log('📏 Count query length:', countQuery.length);
} catch (error) {
    console.log('❌ QueryBuilder ERROR:', error.message);
    console.log('Stack:', error.stack);
}

// Test 4: Database connection
console.log('\n4️⃣ Testing database connection...');
try {
    const { pool } = require('./config/database');
    console.log('✅ Database config loaded');
    
    // Test actual connection
    (async () => {
        try {
            const connection = await pool.getConnection();
            console.log('✅ Database connection works');
            
            // Test simple query
            const [result] = await connection.execute('SELECT 1 as test');
            console.log('✅ Database query works:', result[0]);
            
            connection.release();
        } catch (dbError) {
            console.log('❌ Database connection ERROR:', dbError.message);
        }
    })();
    
} catch (error) {
    console.log('❌ Database config ERROR:', error.message);
}

// Test 5: Routes (main)
console.log('\n5️⃣ Testing main routes...');
try {
    const routes = require('./routes/index');
    console.log('✅ Main routes loaded');
} catch (error) {
    console.log('❌ Main routes ERROR:', error.message);
    console.log('Stack:', error.stack);
}

// Test 6: Routes (API)
console.log('\n6️⃣ Testing API routes...');
try {
    const apiRoutes = require('./routes/api/index');
    console.log('✅ API routes loaded');
} catch (error) {
    console.log('❌ API routes ERROR:', error.message);
    console.log('Stack:', error.stack);
}

console.log('\n🏁 Component testing complete!');
console.log('\n💡 Next steps:');
console.log('1. If all tests pass: use app-debug.js to see exact error');
console.log('2. If tests fail: fix the failing component first');
console.log('3. Run: node test-components.js');
console.log('4. Then run: node app-debug.js');
console.log('5. Visit http://localhost:3000/nodetest/urgent to see detailed error');