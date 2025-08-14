const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (pathname === '/nodetest' || pathname === '/nodetest/') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(getDashboardHTML());
        
    } else if (pathname === '/nodetest/api/test-db') {
        handleTestDB(res);
        
    } else if (pathname === '/nodetest/api/stats') {
        handleStats(res);
        
    } else if (pathname === '/nodetest/api/urgent') {
        handleUrgent(res);
        
    } else if (pathname === '/nodetest/api/recent') {
        handleRecent(res);
        
    } else if (pathname === '/nodetest/api/date-debug') {
        handleDateDebug(res);
        
    } else if (pathname === '/nodetest/api/debug') {
        handleDebug(res);
        
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end(`
            <h2>Page Not Found</h2>
            <p>Path: ${pathname}</p>
            <p><a href="/nodetest">Go to Dashboard</a></p>
        `);
    }
});

function getDashboardHTML() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tableau de Bord - Interventions Techniques</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root {
            --brand-blue: #2563eb;
            --brand-red: #dc2626;
            --brand-blue-light: #dbeafe;
            --brand-red-light: #fee2e2;
            --brand-blue-dark: #1d4ed8;
            --brand-red-dark: #b91c1c;
        }
        
        .brand-gradient {
            background: linear-gradient(135deg, var(--brand-blue) 0%, var(--brand-red) 100%);
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
        
        .status-received { background-color: #fef3c7; color: #92400e; }
        .status-assigned { background-color: #dbeafe; color: #1e40af; }
        .status-in-progress { background-color: #fed7aa; color: #c2410c; }
        .status-completed { background-color: #d1fae5; color: #065f46; }
        .status-billed { background-color: #f3f4f6; color: #374151; }
        .status-paid { background-color: #d1fae5; color: #047857; }
        
        .urgent-row {
            border-left: 4px solid #dc2626;
            background-color: #fef2f2;
        }
        
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
        
        .btn-primary {
            background-color: #2563eb;
            color: white;
            font-weight: 500;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            transition: background-color 0.2s;
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
        }
        
        .btn-secondary:hover {
            background-color: #b91c1c;
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- En-tête -->
    <header class="bg-white shadow-sm border-b-2 border-blue-600">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-lg">TI</span>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-gray-900">Interventions Techniques</h1>
                            <p class="text-sm text-gray-500">Tableau de bord</p>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span id="connection-status" class="text-sm text-gray-500">Connexion...</span>
                    <div class="w-8 h-8 bg-gradient-to-r from-blue-400 to-red-400 rounded-full"></div>
                </div>
            </div>
        </div>
    </header>

    <!-- Contenu Principal -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <!-- Titre du Tableau de Bord -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
            <p class="text-gray-600">Suivi et gestion des interventions techniques</p>
        </div>

        <!-- Cartes de Statistiques -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div class="stat-card p-4" onclick="filterByStatus('received')">
                <div class="text-sm font-medium text-yellow-600">Reçues</div>
                <div id="stat-received" class="text-2xl font-bold text-gray-900">-</div>
            </div>
            <div class="stat-card p-4" onclick="filterByStatus('assigned')">
                <div class="text-sm font-medium text-blue-600">Assignées</div>
                <div id="stat-assigned" class="text-2xl font-bold text-gray-900">-</div>
            </div>
            <div class="stat-card active p-4" onclick="filterByStatus('in-progress')">
                <div class="text-sm font-medium text-orange-600">En Cours</div>
                <div id="stat-inProgress" class="text-2xl font-bold text-gray-900">-</div>
            </div>
            <div class="stat-card p-4" onclick="filterByStatus('completed')">
                <div class="text-sm font-medium text-green-600">Terminées</div>
                <div id="stat-completed" class="text-2xl font-bold text-gray-900">-</div>
            </div>
            <div class="stat-card p-4" onclick="filterByStatus('billed')">
                <div class="text-sm font-medium text-gray-600">Facturées</div>
                <div id="stat-billed" class="text-2xl font-bold text-gray-900">-</div>
            </div>
            <div class="stat-card p-4" onclick="filterByStatus('paid')">
                <div class="text-sm font-medium text-green-700">Payées</div>
                <div id="stat-paid" class="text-2xl font-bold text-gray-900">-</div>
            </div>
        </div>

        <!-- Interventions Urgentes -->
        <div class="mb-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold text-gray-900 flex items-center">
                    <span class="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                    Urgent : Action Requise (48h)
                </h2>
                <button class="btn-secondary text-sm">
                    Voir Tout
                </button>
            </div>
            <div class="bg-white rounded-lg shadow overflow-hidden border border-red-200">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-red-50 to-blue-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Intervention</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temps Restant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigné à</th>
                            </tr>
                        </thead>
                        <tbody id="urgent-table" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="7" class="px-6 py-4 text-center text-gray-500">Chargement...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Interventions Récentes -->
        <div>
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold text-gray-900 flex items-center">
                    <span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Interventions Récentes
                </h2>
                <button class="btn-primary text-sm">
                    Voir Tout
                </button>
            </div>
            <div class="bg-white rounded-lg shadow overflow-hidden border border-blue-200">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-blue-50 to-red-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Intervention</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'Échéance</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigné à</th>
                            </tr>
                        </thead>
                        <tbody id="recent-table" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="7" class="px-6 py-4 text-center text-gray-500">Chargement...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <script>
        function checkConnection() {
            fetch('/nodetest/api/test-db')
                .then(response => response.json())
                .then(result => {
                    const statusEl = document.getElementById('connection-status');
                    if (result.success) {
                        statusEl.textContent = 'Connecté';
                        statusEl.className = 'text-sm text-green-600 font-medium';
                    } else {
                        statusEl.textContent = 'Erreur DB';
                        statusEl.className = 'text-sm text-red-600 font-medium';
                    }
                    loadDashboardData();
                })
                .catch(error => {
                    const statusEl = document.getElementById('connection-status');
                    statusEl.textContent = 'Hors ligne';
                    statusEl.className = 'text-sm text-red-600 font-medium';
                    loadDashboardData();
                });
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

        function loadUrgent() {
            fetch('/nodetest/api/urgent')
                .then(response => response.json())
                .then(urgent => {
                    const tbody = document.getElementById('urgent-table');
                    
                    if (urgent.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">Aucune intervention urgente</td></tr>';
                        return;
                    }
                    
                    tbody.innerHTML = urgent.map(item => {
                        const fullDescription = item.description;
                        const truncatedDescription = fullDescription.length > 50 ? fullDescription.substring(0, 50) + '...' : fullDescription;
                        
                        const statusClass = item.status.toLowerCase().includes('terminé') ? 'status-completed' : 
                                          item.status.toLowerCase().includes('cours') ? 'status-in-progress' : 
                                          item.status.toLowerCase().includes('assigné') ? 'status-assigned' : 'status-received';
                        
                        const rowClass = item.hours_remaining < 24 ? 'urgent-row' : 'hover:bg-gray-50';
                        const timeClass = item.hours_remaining < 24 ? 'text-red-600 font-bold' : 'text-gray-900';
                        const timeText = item.hours_remaining > 0 ? Math.round(item.hours_remaining) + 'h' : 'En retard';
                        
                        return '<tr class="' + rowClass + '">' +
                            '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">' + item.intervention_id + '</td>' +
                            '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + item.client_name + '</td>' +
                            '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + item.service_type + '</td>' +
                            '<td class="px-6 py-4 text-sm text-gray-900 max-w-xs">' +
                                '<div class="relative group">' +
                                    '<div class="truncate cursor-help">' + truncatedDescription + '</div>' +
                                    '<div class="tooltip">' + fullDescription + '</div>' +
                                '</div>' +
                            '</td>' +
                            '<td class="px-6 py-4 whitespace-nowrap">' +
                                '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + statusClass + '">' + item.status + '</span>' +
                            '</td>' +
                            '<td class="px-6 py-4 whitespace-nowrap text-sm ' + timeClass + '">' + timeText + '</td>' +
                            '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.assigned_to || 'Non assigné') + '</td>' +
                        '</tr>';
                    }).join('');
                })
                .catch(error => {
                    console.error('Impossible de charger les interventions urgentes:', error);
                    document.getElementById('urgent-table').innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-red-500">Échec du chargement des données</td></tr>';
                });
        }

        function loadRecent() {
            fetch('/nodetest/api/recent')
                .then(response => response.json())
                .then(recent => {
                    const tbody = document.getElementById('recent-table');
                    
                    if (recent.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">Aucune intervention récente</td></tr>';
                        return;
                    }
                    
                    tbody.innerHTML = recent.map(item => {
                        const fullDescription = item.description;
                        const truncatedDescription = fullDescription.length > 50 ? fullDescription.substring(0, 50) + '...' : fullDescription;
                        
                        const statusClass = item.status.toLowerCase().includes('terminé') ? 'status-completed' : 
                                          item.status.toLowerCase().includes('cours') ? 'status-in-progress' : 
                                          item.status.toLowerCase().includes('assigné') ? 'status-assigned' : 'status-received';
                        
                        return '<tr class="hover:bg-gray-50">' +
                            '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">' + item.intervention_id + '</td>' +
                            '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + item.client_name + '</td>' +
                            '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + item.service_type + '</td>' +
                            '<td class="px-6 py-4 text-sm text-gray-900 max-w-xs">' +
                                '<div class="relative group">' +
                                    '<div class="truncate cursor-help">' + truncatedDescription + '</div>' +
                                    '<div class="tooltip">' + fullDescription + '</div>' +
                                '</div>' +
                            '</td>' +
                            '<td class="px-6 py-4 whitespace-nowrap">' +
                                '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + statusClass + '">' + item.status + '</span>' +
                            '</td>' +
                            '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.due_date || 'Pas de date') + '</td>' +
                            '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.assigned_to || 'Non assigné') + '</td>' +
                        '</tr>';
                    }).join('');
                })
                .catch(error => {
                    console.error('Impossible de charger les interventions récentes:', error);
                    document.getElementById('recent-table').innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-red-500">Échec du chargement des données</td></tr>';
                });
        }

        function loadDashboardData() {
            loadStats();
            loadUrgent();
            loadRecent();
        }

        function filterByStatus(status) {
            console.log('Filtrer par statut:', status);
        }

        document.addEventListener('DOMContentLoaded', function() {
            checkConnection();
            setInterval(loadDashboardData, 30000);
        });
    </script>
</body>
</html>`;
}

function handleTestDB(res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    
    try {
        const mysql = require('mysql2/promise');
        
        mysql.createConnection({
            host: 'localhost',
            user: 'astrotec_db',
            password: '@sTr0t3cH',
            database: 'astrotec_db'
        }).then(async connection => {
            // Test basic connection and get sample data
            await connection.execute('SELECT 1');
            
            // Get a few real interventions to verify data structure
            const [sample] = await connection.execute(`
                SELECT 
                    i.uid,
                    i.public_number,
                    i.number,
                    i.title,
                    i.description,
                    c.name as client_name,
                    it.name as intervention_type,
                    ist.name as status_name,
                    t.firstname,
                    t.lastname
                FROM interventions i
                LEFT JOIN clients c ON i.client_uid = c.uid
                LEFT JOIN interventions_types it ON i.type_uid = it.uid  
                LEFT JOIN interventions_status ist ON i.status_uid = ist.uid
                LEFT JOIN technicians t ON i.technician_uid = t.uid
                ORDER BY i.date_time DESC
                LIMIT 3
            `);
            
            // Get total count
            const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM interventions');
            const total = countResult[0].total;
            
            await connection.end();
            
            res.end(JSON.stringify({ 
                success: true, 
                message: `Database connected! Found ${total} interventions.`,
                totalInterventions: total,
                sampleData: sample,
                note: 'Check console for sample data structure'
            }));
        }).catch(error => {
            res.end(JSON.stringify({ 
                success: false, 
                error: error.message 
            }));
        });
        
    } catch (error) {
        res.end(JSON.stringify({ 
            success: false, 
            error: 'mysql2 package not installed: ' + error.message
        }));
    }
}

function handleStats(res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    
    try {
        const mysql = require('mysql2/promise');
        
        mysql.createConnection({
            host: 'localhost',
            user: 'astrotec_db',
            password: '@sTr0t3cH',
            database: 'astrotec_db'
        }).then(async connection => {
            // Get intervention counts by status from your actual database
            const [statusCounts] = await connection.execute(`
                SELECT 
                    s.name as status_name,
                    COUNT(i.uid) as count
                FROM interventions_status s
                LEFT JOIN interventions i ON i.status_uid = s.uid
                GROUP BY s.uid, s.name
                ORDER BY s.uid
            `);
            
            // Initialize stats object
            const stats = {
                received: 0,
                assigned: 0,
                inProgress: 0,
                completed: 0,
                billed: 0,
                paid: 0,
                total: 0
            };
            
            // Map your actual statuses to dashboard categories
            statusCounts.forEach(status => {
                const statusName = status.status_name.toLowerCase();
                stats.total += status.count;
                
                if (statusName.includes('reçu') || statusName.includes('nouveau') || statusName.includes('received')) {
                    stats.received += status.count;
                } else if (statusName.includes('assigné') || statusName.includes('assigned') || statusName.includes('planifié')) {
                    stats.assigned += status.count;
                } else if (statusName.includes('cours') || statusName.includes('progress') || statusName.includes('démarré')) {
                    stats.inProgress += status.count;
                } else if (statusName.includes('terminé') || statusName.includes('completed') || statusName.includes('fini')) {
                    stats.completed += status.count;
                } else if (statusName.includes('facturé') || statusName.includes('billed')) {
                    stats.billed += status.count;
                } else if (statusName.includes('payé') || statusName.includes('paid')) {
                    stats.paid += status.count;
                } else {
                    // If status doesn't match known categories, add to assigned
                    stats.assigned += status.count;
                }
            });
            
            await connection.end();
            res.end(JSON.stringify(stats));
            
        }).catch(error => {
            // Return sample data if database query fails
            res.end(JSON.stringify({
                received: 34,
                assigned: 22,
                inProgress: 15,
                completed: 87,
                billed: 58,
                paid: 29,
                _error: 'Database error: ' + error.message
            }));
        });
        
    } catch (error) {
        // Return sample data if mysql2 not available
        res.end(JSON.stringify({
            received: 34,
            assigned: 22,
            inProgress: 15,
            completed: 87,
            billed: 58,
            paid: 29,
            _error: 'mysql2 not installed'
        }));
    }
}

function handleUrgent(res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    
    try {
        const mysql = require('mysql2/promise');
        
        mysql.createConnection({
            host: 'localhost',
            user: 'astrotec_db',
            password: '@sTr0t3cH',
            database: 'astrotec_db'
        }).then(async connection => {
            // Get urgent interventions from real data
            const [urgent] = await connection.execute(`
                SELECT 
                    i.uid,
                    COALESCE(i.number, CONCAT('INT-', i.uid)) as intervention_id,
                    COALESCE(c.name, 'Client Non Spécifié') as client_name,
                    COALESCE(it.name, 'Service Général') as service_type,
                    COALESCE(NULLIF(i.description, ''), NULLIF(i.title, ''), 'Pas de description') as description,
                    COALESCE(ist.name, 'Statut inconnu') as status,
                    i.due_date,
                    i.address,
                    CASE 
                        WHEN t.firstname IS NOT NULL AND t.lastname IS NOT NULL AND t.uid > 0
                        THEN CONCAT(TRIM(t.firstname), ' ', TRIM(t.lastname))
                        WHEN t.firstname IS NOT NULL AND t.uid > 0
                        THEN TRIM(t.firstname)
                        WHEN t.lastname IS NOT NULL AND t.uid > 0
                        THEN TRIM(t.lastname)
                        ELSE NULL
                    END as assigned_to
                FROM interventions i
                LEFT JOIN clients c ON i.client_uid = c.uid AND c.uid > 0
                LEFT JOIN interventions_types it ON i.type_uid = it.uid AND it.uid > 0
                LEFT JOIN interventions_status ist ON i.status_uid = ist.uid AND ist.uid > 0
                LEFT JOIN technicians t ON i.technician_uid = t.uid AND t.uid > 0
                WHERE i.due_date IS NOT NULL 
                AND i.due_date != ''
                AND i.title NOT IN ('Y', '', 'NULL') 
                AND i.description NOT IN ('Y', '', 'NULL')
                AND (i.number IS NOT NULL AND i.number NOT IN ('Y', ''))
                AND COALESCE(ist.name, '') NOT IN ('Terminée', 'Completed', 'Facturé', 'Payé', 'Fini')
                ORDER BY i.uid DESC
                LIMIT 10
            `);
            
            // Format the data for frontend
            const formattedUrgent = urgent.map(item => {
                // Handle the date - your dates are already in DD/MM/YYYY format
                let formattedDate = item.due_date && item.due_date !== '' ? item.due_date : 'Pas de date';
                
                // Calculate hours remaining if date exists
                let hoursRemaining = 0;
                if (item.due_date && item.due_date !== '') {
                    try {
                        // Parse DD/MM/YYYY format
                        const parts = item.due_date.split('/');
                        if (parts.length === 3) {
                            const dueDate = new Date(parts[2], parts[1] - 1, parts[0]); // YYYY, MM-1, DD
                            const now = new Date();
                            hoursRemaining = Math.max(0, Math.round((dueDate - now) / (1000 * 60 * 60)));
                        }
                    } catch (e) {
                        // If date parsing fails, default to 0
                        hoursRemaining = 0;
                    }
                }
                
                return {
                    intervention_id: item.intervention_id,
                    client_name: item.client_name,
                    service_type: item.service_type,
                    description: item.description, // Send full description to frontend
                    status: item.status,
                    due_date: formattedDate,
                    assigned_to: item.assigned_to || 'Non assigné',
                    hours_remaining: hoursRemaining,
                    address: item.address || 'Adresse non spécifiée'
                };
            });
            
            await connection.end();
            res.end(JSON.stringify(formattedUrgent));
            
        }).catch(error => {
            // Return empty array if no urgent interventions or error
            res.end(JSON.stringify([]));
        });
        
    } catch (error) {
        // Return empty array if mysql2 not available
        res.end(JSON.stringify([]));
    }
}

function handleRecent(res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    
    try {
        const mysql = require('mysql2/promise');
        
        mysql.createConnection({
            host: 'localhost',
            user: 'astrotec_db',
            password: '@sTr0t3cH',
            database: 'astrotec_db'
        }).then(async connection => {
            // Get real recent interventions (exclude test data)
            const [recent] = await connection.execute(`
                SELECT 
                    i.uid,
                    COALESCE(i.number, CONCAT('INT-', i.uid)) as intervention_id,
                    COALESCE(c.name, 'Client Non Spécifié') as client_name,
                    COALESCE(it.name, 'Service Général') as service_type,
                    COALESCE(NULLIF(i.description, ''), NULLIF(i.title, ''), 'Pas de description') as description,
                    COALESCE(ist.name, 'Statut inconnu') as status,
                    i.due_date,
                    i.date_time as created_date,
                    i.address,
                    CASE 
                        WHEN t.firstname IS NOT NULL AND t.lastname IS NOT NULL AND t.uid > 0
                        THEN CONCAT(TRIM(t.firstname), ' ', TRIM(t.lastname))
                        WHEN t.firstname IS NOT NULL AND t.uid > 0
                        THEN TRIM(t.firstname)
                        WHEN t.lastname IS NOT NULL AND t.uid > 0
                        THEN TRIM(t.lastname)
                        ELSE NULL
                    END as assigned_to
                FROM interventions i
                LEFT JOIN clients c ON i.client_uid = c.uid AND c.uid > 0
                LEFT JOIN interventions_types it ON i.type_uid = it.uid AND it.uid > 0
                LEFT JOIN interventions_status ist ON i.status_uid = ist.uid AND ist.uid > 0
                LEFT JOIN technicians t ON i.technician_uid = t.uid AND t.uid > 0
                WHERE i.uid IS NOT NULL 
                AND i.title NOT IN ('Y', '', 'NULL') 
                AND i.description NOT IN ('Y', '', 'NULL')
                AND (i.number IS NOT NULL AND i.number NOT IN ('Y', ''))
                ORDER BY i.uid DESC
                LIMIT 15
            `);
            
            // Format the data for frontend
            const formattedRecent = recent.map(item => {
                // Handle the date formatting - your dates are DD/MM/YYYY strings
                let formattedDate = 'Pas de date';
                if (item.due_date && item.due_date !== '') {
                    formattedDate = item.due_date; // Already in DD/MM/YYYY format
                } else if (item.created_date && item.created_date !== '') {
                    formattedDate = item.created_date; // Already in DD/MM/YYYY format
                }
                
                return {
                    intervention_id: item.intervention_id,
                    client_name: item.client_name,
                    service_type: item.service_type,
                    description: item.description, // Send full description to frontend
                    status: item.status,
                    due_date: formattedDate,
                    assigned_to: item.assigned_to || 'Non assigné',
                    address: item.address || 'Adresse non spécifiée'
                };
            });
            
            await connection.end();
            res.end(JSON.stringify(formattedRecent));
            
        }).catch(error => {
            // Return sample recent data if database query fails
            res.end(JSON.stringify([
                {
                    intervention_id: 'DB-ERROR',
                    client_name: 'Erreur Base de Données',
                    service_type: 'Problème Système',
                    description: 'Impossible de charger les interventions: ' + error.message,
                    status: 'erreur',
                    due_date: 'Erreur',
                    assigned_to: 'Système'
                }
            ]));
        });
        
    } catch (error) {
        // Return sample data if mysql2 not available
        res.end(JSON.stringify([
            {
                intervention_id: 'SAMPLE-001',
                client_name: 'Client Exemple',
                service_type: 'Configuration Base',
                description: 'Installer le package mysql2 pour voir les vraies données',
                status: 'en attente',
                due_date: '31/12/2024',
                assigned_to: 'Admin'
            }
        ]));
    }
}

function handleDateDebug(res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    
    try {
        const mysql = require('mysql2/promise');
        
        mysql.createConnection({
            host: 'localhost',
            user: 'astrotec_db',
            password: '@sTr0t3cH',
            database: 'astrotec_db'
        }).then(async connection => {
            // Get sample dates to see the format
            const [dates] = await connection.execute(`
                SELECT 
                    i.uid,
                    i.number,
                    i.due_date,
                    i.date_time,
                    typeof(i.due_date) as due_date_type,
                    typeof(i.date_time) as date_time_type
                FROM interventions i
                WHERE i.number LIKE '%182%' OR i.number LIKE '%2451%'
                LIMIT 5
            `);
            
            await connection.end();
            
            res.end(JSON.stringify({ 
                success: true,
                sampleDates: dates,
                note: 'Check date formats and types'
            }));
            
        }).catch(error => {
            res.end(JSON.stringify({ 
                success: false, 
                error: error.message 
            }));
        });
        
    } catch (error) {
        res.end(JSON.stringify({ 
            success: false, 
            error: 'mysql2 package not installed: ' + error.message
        }));
    }
}

function handleDebug(res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    
    try {
        const mysql = require('mysql2/promise');
        
        mysql.createConnection({
            host: 'localhost',
            user: 'astrotec_db',
            password: '@sTr0t3cH',
            database: 'astrotec_db'
        }).then(async connection => {
            // Let's search for real interventions like the ones you showed me
            const [realInterventions] = await connection.execute(`
                SELECT 
                    i.uid,
                    i.public_number,
                    i.number,
                    i.title,
                    i.description,
                    i.date_time,
                    i.due_date,
                    i.address,
                    i.client_uid,
                    i.type_uid,
                    i.status_uid,
                    i.technician_uid
                FROM interventions i
                WHERE (i.number LIKE '%2452700%' 
                    OR i.number LIKE '%182%' 
                    OR i.number LIKE '%BALLONS%'
                    OR i.public_number LIKE '%2452700%'
                    OR i.title NOT IN ('Y', '', NULL)
                    OR i.description NOT IN ('Y', '', NULL))
                ORDER BY i.date_time DESC
                LIMIT 10
            `);
            
            // Also check what's in the related tables
            const [clientSample] = await connection.execute('SELECT uid, name FROM clients WHERE name IS NOT NULL AND name != "" LIMIT 5');
            const [statusSample] = await connection.execute('SELECT uid, name FROM interventions_status WHERE name IS NOT NULL AND name != "" LIMIT 5');
            const [typesSample] = await connection.execute('SELECT uid, name FROM interventions_types WHERE name IS NOT NULL AND name != "" LIMIT 5');
            const [techSample] = await connection.execute('SELECT uid, firstname, lastname FROM technicians WHERE firstname IS NOT NULL AND firstname != "" LIMIT 5');
            
            await connection.end();
            
            res.end(JSON.stringify({ 
                success: true,
                realInterventions: realInterventions,
                sampleClients: clientSample,
                sampleStatuses: statusSample,
                sampleTypes: typesSample,
                sampleTechnicians: techSample,
                note: 'Looking for real data vs test data'
            }));
            
        }).catch(error => {
            res.end(JSON.stringify({ 
                success: false, 
                error: error.message 
            }));
        });
        
    } catch (error) {
        res.end(JSON.stringify({ 
            success: false, 
            error: 'mysql2 package not installed: ' + error.message
        }));
    }
}

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Dashboard available at: /nodetest');
});

module.exports = server;