// setup.js - Create required directories for the application
const fs = require('fs').promises;
const path = require('path');

async function createDirectories() {
    const directories = [
        'generated',
        'generated/interventions'
    ];

    for (const dir of directories) {
        try {
            await fs.mkdir(path.join(__dirname, dir), { recursive: true });
            console.log(`✅ Directory created: ${dir}`);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                console.error(`❌ Error creating directory ${dir}:`, error.message);
            } else {
                console.log(`✅ Directory already exists: ${dir}`);
            }
        }
    }
}

// Run setup
createDirectories()
    .then(() => {
        console.log('🎉 Setup completed successfully!');
    })
    .catch((error) => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });

module.exports = { createDirectories };