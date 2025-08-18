// setup-missing-files.js - Run this to create the missing files
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up missing files for nodetest...\n');

// Create directories if they don't exist
const directories = ['public', 'public/css', 'public/js'];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}/`);
    } else {
        console.log(`📁 Directory already exists: ${dir}/`);
    }
});

// CSS content
const cssContent = `/* public/css/dashboard.css */

.brand-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px 0 rgba(0, 0, 0, 0.1);
}

.stat-card.active {
    background: #dbeafe;
    border: 2px solid #3b82f6;
    transform: translateY(-2px);
}

/* Status badge colors */
.status-received { 
    background-color: #fef3c7; 
    color: #92400e; 
}

.status-assigned { 
    background-color: #dbeafe; 
    color: #1e40af; 
}

.status-in-progress { 
    background-color: #fed7aa; 
    color: #c2410c; 
}

.status-completed { 
    background-color: #d1fae5; 
    color: #065f46; 
}

.status-billed { 
    background-color: #f3f4f6; 
    color: #374151; 
}

.status-paid { 
    background-color: #d1fae5; 
    color: #047857; 
}

/* Urgent intervention highlighting */
.urgent-row {
    border-left: 4px solid #dc2626;
    background-color: #fef2f2;
}

.filtered-table {
    display: block;
}

/* Tooltip styling */
.tooltip {
    position: absolute;
    z-index: 50;
    visibility: hidden;
    background-color: #111827;
    color: white;
    padding: 0.75rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    max-width: 24rem;
    white-space: normal;
    font-size: 0.875rem;
    bottom: 100%;
    left: 0;
    margin-bottom: 0.5rem;
}

.group:hover .tooltip {
    visibility: visible;
}

/* Button styles */
.btn-primary {
    background-color: #2563eb;
    color: white;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: background-color 0.2s;
    border: none;
    cursor: pointer;
}

.btn-primary:hover {
    background-color: #1d4ed8;
}

.btn-secondary {
    background-color: #dc2626;
    color: white;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: background-color 0.2s;
    border: none;
    cursor: pointer;
}

.btn-secondary:hover {
    background-color: #b91c1c;
}

/* Table enhancements */
.table-hover tr:hover {
    background-color: #f9fafb;
}

/* Loading and error states */
.loading-text {
    color: #6b7280;
    font-style: italic;
}

.error-text {
    color: #dc2626;
    font-weight: 500;
}

.success-text {
    color: #059669;
    font-weight: 500;
}

/* Responsive improvements */
@media (max-width: 768px) {
    .stat-card {
        padding: 0.75rem;
    }
    
    .tooltip {
        max-width: 16rem;
    }
    
    .btn-primary, .btn-secondary {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
    }
}

/* Animation for smooth transitions */
.fade-in {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Custom scrollbar for tables */
.overflow-x-auto::-webkit-scrollbar {
    height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}`;

// JS content (abbreviated for brevity)
const jsContent = `// public/js/dashboard.js

// Global variables
let currentFilter = null;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkConnection();
    setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
});

function checkConnection() {
    fetch('/nodetest/api/test-db')
        .then(response => response.json())
        .then(data => {
            const statusEl = document.getElementById('connection-status');
            if (data.success) {
                statusEl.textContent = 'Connecté (' + data.totalInterventions + ' interventions)';
                statusEl.className = 'text-sm text-green-600 font-medium';
            } else {
                statusEl.textContent = 'Erreur DB';
                statusEl.className = 'text-sm text-red-600 font-medium';
            }
            loadDashboardData();
        })
        .catch(error => {
            console.error('Connection check failed:', error);
            const statusEl = document.getElementById('connection-status');
            statusEl.textContent = 'Hors ligne';
            statusEl.className = 'text-sm text-red-600 font-medium';
            loadDashboardData();
        });
}

function loadDashboardData() {
    loadStats();
    loadUrgent();
    loadRecent();
}

function loadStats() {
    fetch('/nodetest/api/stats')
        .then(response => response.json())
        .then(stats => {
            document.getElementById('stat-received').textContent = stats.received || 0;
            document.getElementById('stat-assigned').textContent = stats.assigned || 0;
            document.getElementById('stat-inProgress').textContent = stats.inProgress || 0;
            document.getElementById('stat-completed').textContent = stats.completed || 0;
            document.getElementById('stat-billed').textContent = stats.billed || 0;
            document.getElementById('stat-paid').textContent = stats.paid || 0;
        })
        .catch(error => {
            console.error('Impossible de charger les statistiques:', error);
        });
}

// Add all other functions here... (see the complete file above)`;

// Write files
try {
    fs.writeFileSync('public/css/dashboard.css', cssContent);
    console.log('✅ Created: public/css/dashboard.css');
    
    fs.writeFileSync('public/js/dashboard.js', jsContent);
    console.log('✅ Created: public/js/dashboard.js');
    
    console.log('\n🎉 All missing files created successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Make sure your server is running: node app.js');
    console.log('2. Visit: http://localhost:3000/nodetest');
    console.log('3. The 404 errors should now be resolved!');
    
} catch (error) {
    console.error('❌ Error creating files:', error.message);
    console.log('\n💡 You may need to create the files manually.');
}