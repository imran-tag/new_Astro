// views/urgentInterventions.js - SIMPLIFIED to avoid 500 errors

function getUrgentInterventionsHTML() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interventions Urgentes - 48h Pile</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/nodetest/css/dashboard.css">
</head>
<body class="bg-gray-50">
    <header class="bg-white shadow-sm border-b-2 border-blue-600">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <a href="/nodetest" class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-lg">TI</span>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-gray-900">Interventions Techniques</h1>
                            <p class="text-sm text-gray-500">Interventions urgentes - 48h pile</p>
                        </div>
                    </a>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/nodetest" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">
                        <i class="fa fa-arrow-left mr-2"></i>Retour au tableau de bord
                    </a>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 flex items-center">
                <span class="w-4 h-4 bg-red-500 rounded-full mr-3 animate-pulse"></span>
                Interventions Urgentes - 48h Pile
            </h1>
            <p class="text-gray-600 mt-2">Interventions créées dans les 48h nécessitant une assignation</p>
        </div>

        <!-- Simple Filters -->
        <div class="bg-white rounded-lg shadow mb-6 p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                    <input 
                        type="text" 
                        id="search-input"
                        placeholder="N°, titre, adresse..." 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select id="status-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="">Tous les statuts</option>
                        <option value="planifie">Planifiée</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Actions</label>
                    <button onclick="loadData()" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        <i class="fa fa-refresh mr-2"></i>Actualiser
                    </button>
                </div>
            </div>
        </div>

        <!-- Results Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gradient-to-r from-red-50 to-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Intervention</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manquant</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temps Restant</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigné à</th>
                        </tr>
                    </thead>
                    <tbody id="urgent-table" class="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colspan="6" class="px-6 py-4 text-center text-gray-500">Chargement...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Simple Pagination -->
        <div class="mt-6 flex items-center justify-between">
            <div class="text-sm text-gray-700">
                <span id="total-count">Chargement...</span>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="previousPage()" class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">Précédent</button>
                <span id="page-info" class="px-3 py-2 text-sm">Page 1</span>
                <button onclick="nextPage()" class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">Suivant</button>
            </div>
        </div>
    </main>

    <script>
        let currentPage = 1;
        let currentData = [];

        document.addEventListener('DOMContentLoaded', function() {
            loadData();
        });

        function loadData() {
            console.log('Loading urgent interventions...');
            
            fetch('/nodetest/api/urgent-all?page=' + currentPage + '&limit=25')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status);
                    }
                    return response.json();
                })
                .then(result => {
                    console.log('Data loaded:', result);
                    displayData(result.data || []);
                    updateStats(result.pagination || {});
                })
                .catch(error => {
                    console.error('Error loading data:', error);
                    document.getElementById('urgent-table').innerHTML = 
                        '<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Erreur: ' + error.message + '</td></tr>';
                });
        }

        function displayData(data) {
            const tbody = document.getElementById('urgent-table');
            
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Aucune intervention trouvée</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(item => {
                const hoursRemaining = parseInt(item.hours_remaining) || 0;
                let timeDisplay = hoursRemaining + 'h';
                let rowClass = '';
                
                if (hoursRemaining <= 6) {
                    timeDisplay = '🔥 ' + timeDisplay;
                    rowClass = 'bg-red-50';
                } else if (hoursRemaining <= 12) {
                    timeDisplay = '⚡ ' + timeDisplay;
                    rowClass = 'bg-orange-50';
                } else if (hoursRemaining <= 24) {
                    timeDisplay = '⏳ ' + timeDisplay;
                    rowClass = 'bg-yellow-50';
                } else {
                    timeDisplay = '✅ ' + timeDisplay;
                    rowClass = 'bg-green-50';
                }

                return \`
                    <tr class="hover:bg-gray-50 \${rowClass}">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">\${item.intervention_id || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${item.title || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${item.status || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${item.missing_info || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">\${timeDisplay}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${item.assigned_to || 'Non assigné'}</td>
                    </tr>
                \`;
            }).join('');
        }

        function updateStats(pagination) {
            document.getElementById('total-count').textContent = 
                (pagination.totalCount || 0) + ' intervention(s) urgente(s)';
            document.getElementById('page-info').textContent = 
                'Page ' + (pagination.currentPage || 1) + ' sur ' + (pagination.totalPages || 1);
        }

        function previousPage() {
            if (currentPage > 1) {
                currentPage--;
                loadData();
            }
        }

        function nextPage() {
            currentPage++;
            loadData();
        }
    </script>
</body>
</html>`;
}

module.exports = { getUrgentInterventionsHTML };