// check-files.js - Run this to verify your file structure
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking file structure...\n');

const requiredFiles = [
    'app.js',
    'package.json',
    'config/database.js',
    'routes/index.js',
    'routes/api/index.js',
    'controllers/testController.js',
    'controllers/statsController.js',
    'controllers/interventionsController.js',
    'utils/queryBuilder.js',
    'views/dashboard.js',
    'public/css/dashboard.css',
    'public/js/dashboard.js'
];

const requiredFolders = [
    'config',
    'routes',
    'routes/api',
    'controllers',
    'utils',
    'views',
    'public',
    'public/css',
    'public/js'
];

// Check folders
console.log('📁 Checking folders:');
requiredFolders.forEach(folder => {
    if (fs.existsSync(folder)) {
        console.log(`✅ ${folder}/`);
    } else {
        console.log(`❌ ${folder}/ - MISSING`);
    }
});

console.log('\n📄 Checking files:');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
        
        // Check if file has content
        const stats = fs.statSync(file);
        if (stats.size === 0) {
            console.log(`   ⚠️  File is empty!`);
        }
    } else {
        console.log(`❌ ${file} - MISSING`);
    }
});

console.log('\n🔍 Checking package.json dependencies:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = packageJson.dependencies || {};
    
    if (deps.express) {
        console.log(`✅ express: ${deps.express}`);
    } else {
        console.log(`❌ express - MISSING`);
    }
    
    if (deps.mysql2) {
        console.log(`✅ mysql2: ${deps.mysql2}`);
    } else {
        console.log(`❌ mysql2 - MISSING`);
    }
} catch (error) {
    console.log(`❌ Could not read package.json: ${error.message}`);
}

console.log('\n🚀 Next steps:');
console.log('1. Create any missing folders');
console.log('2. Create any missing files');
console.log('3. Run: npm install express mysql2');
console.log('4. Replace app.js with the debug version');
console.log('5. Start server and go to /thetest');

// Show current directory contents
console.log('\n📋 Current directory contents:');
try {
    const files = fs.readdirSync('.');
    files.forEach(file => {
        const stats = fs.statSync(file);
        const type = stats.isDirectory() ? '📁' : '📄';
        console.log(`${type} ${file}`);
    });
} catch (error) {
    console.log(`❌ Could not read directory: ${error.message}`);
}