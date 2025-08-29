// Replace your views/simpleChantiers.js with this enhanced version:

function getSimpleChantiersHTML() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Chantiers - Astro Tech</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .chantier-card {
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .chantier-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body class="bg-gray-50">
    <header class="bg-orange-600 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-white">Dashboard Chantiers</h1>
                    <p class="text-orange-100">Interventions groupées par chantier</p>
                </div>
                <div class="flex space-x-3">
                    <a href="/nodetest" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-home mr-2"></i>Dashboard Principal
                    </a>
                    <button onclick="refreshData()" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-sync-alt mr-2"></i>Actualiser
                    </button>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-xl shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-blue-100 rounded-full">
                        <i class="fas fa-building text-2xl text-blue-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Total Chantiers</p>
                        <p class="text-2xl font-bold text-gray-900" id="total-chantiers">-</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-orange-100 rounded-full">
                        <i class="fas fa-tools text-2xl text-orange-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Total Interventions</p>
                        <p class="text-2xl font-bold text-gray-900" id="total-interventions">-</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-yellow-100 rounded-full">
                        <i class="fas fa-clock text-2xl text-yellow-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">planifiée/En Cours</p>
                        <p class="text-2xl font-bold text-gray-900" id="active-interventions">-</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-green-100 rounded-full">
                        <i class="fas fa-check-circle text-2xl text-green-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Terminées</p>
                        <p class="text-2xl font-bold text-gray-900" id="completed-interventions">-</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chantiers Grid -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-4 border-b">
                <h2 class="text-xl font-semibold text-gray-900">
                    <i class="fas fa-list mr-2 text-orange-600"></i>
                    Chantiers et Interventions
                </h2>
            </div>
            
            <!-- Loading State -->
            <div id="loading" class="p-8 text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
                <p class="text-gray-600">Chargement des chantiers...</p>
            </div>
            
            <!-- Chantiers Grid -->
            <div id="chantiers-grid" class="hidden grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                <!-- Chantiers will be loaded here -->
            </div>
        </div>
    </main>

    <!-- Modal for Chantier Details -->
    <div id="chantier-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                <div class="bg-gradient-to-r from-orange-500 to-yellow-500 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xl font-bold text-white" id="modal-title">
                            <i class="fas fa-hard-hat mr-2"></i>
                            Détails du Chantier
                        </h3>
                        <button onclick="closeModal()" class="text-white hover:text-gray-200 transition-colors">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Table -->
                <div class="overflow-y-auto max-h-96">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50 sticky top-0">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Inter.</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technicien</th>
                            </tr>
                        </thead>
                        <tbody id="interventions-modal-table" class="bg-white divide-y divide-gray-200">
                            <!-- Interventions will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        let allInterventions = [];
        let groupedChantiers = {};

        document.addEventListener('DOMContentLoaded', function() {
            loadChantiers();
        });

        function refreshData() {
            loadChantiers();
        }

        function loadChantiers() {
            console.log('Loading chantiers...');
            
            document.getElementById('loading').classList.remove('hidden');
            document.getElementById('chantiers-grid').classList.add('hidden');
            
            fetch('/nodetest/api/chantiers-only')
                .then(response => response.json())
                .then(data => {
                    console.log('Data loaded:', data.length, 'interventions');
                    allInterventions = data;
                    groupInterventionsByChantier(data);
                    displayChantiersGrid();
                    updateStats();
                })
                .catch(error => {
                    console.error('Error loading chantiers:', error);
                    displayError('Erreur lors du chargement des chantiers');
                });
        }

        function groupInterventionsByChantier(interventions) {
            groupedChantiers = {};
            
            interventions.forEach(intervention => {
                const key = \`\${intervention.business_number}-\${intervention.business_title}\`;
                
                if (!groupedChantiers[key]) {
                    groupedChantiers[key] = {
                        number: intervention.business_number,
                        title: intervention.business_title,
                        interventions: []
                    };
                }
                
                groupedChantiers[key].interventions.push(intervention);
            });
            
            console.log('Grouped chantiers:', Object.keys(groupedChantiers).length);
        }

        function displayChantiersGrid() {
            const grid = document.getElementById('chantiers-grid');
            const loading = document.getElementById('loading');
            
            loading.classList.add('hidden');
            
            if (Object.keys(groupedChantiers).length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">Aucun chantier trouvé</div>';
                grid.classList.remove('hidden');
                return;
            }
            
            const cardsHTML = Object.values(groupedChantiers).map(chantier => {
                const totalCount = chantier.interventions.length;
                const activeCount = chantier.interventions.filter(i => 
                    i.status && (i.status.toLowerCase().includes('planifié') || i.status.toLowerCase().includes('cours') || i.status.toLowerCase().includes('assigné'))
                ).length;
                const completedCount = chantier.interventions.filter(i => 
                    i.status && (i.status.toLowerCase().includes('terminé') || i.status.toLowerCase().includes('fini'))
                ).length;
                
                return \`
                    <div class="chantier-card bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                        <div class="flex items-start justify-between mb-4" onclick="openChantierModal('\${chantier.number}', '\${chantier.title}')">
                            <div>
                                <h3 class="font-bold text-lg text-gray-900 mb-1">
                                    <span class="text-orange-600">#\${chantier.number}</span>
                                </h3>
                                <p class="text-sm text-gray-600" title="\${chantier.title}">
                                    \${chantier.title}
                                </p>
                            </div>
                            <i class="fas fa-hard-hat text-2xl text-orange-500"></i>
                        </div>
                        
                        <div class="grid grid-cols-3 gap-3 mb-4">
                            <div class="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors" 
                                 onclick="event.stopPropagation(); openChantierModalWithFilter('\${chantier.number}', '\${chantier.title}', 'all')">
                                <div class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                                    \${totalCount}
                                </div>
                                <p class="text-xs text-gray-500 mt-1">Total</p>
                            </div>
                            <div class="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors" 
                                 onclick="event.stopPropagation(); openChantierModalWithFilter('\${chantier.number}', '\${chantier.title}', 'active')">
                                <div class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-semibold">
                                    \${activeCount}
                                </div>
                                <p class="text-xs text-gray-500 mt-1">Planifiée/En cours</p>
                            </div>
                            <div class="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors" 
                                 onclick="event.stopPropagation(); openChantierModalWithFilter('\${chantier.number}', '\${chantier.title}', 'completed')">
                                <div class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">
                                    \${completedCount}
                                </div>
                                <p class="text-xs text-gray-500 mt-1">Terminées</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between text-sm" onclick="openChantierModal('\${chantier.number}', '\${chantier.title}')">
                            <span class="text-gray-500">
                                <i class="fas fa-chart-bar mr-1"></i>
                                \${totalCount} interventions
                            </span>
                            <span class="text-orange-600 font-medium">
                                Voir détails <i class="fas fa-arrow-right ml-1"></i>
                            </span>
                        </div>
                    </div>
                \`;
            }).join('');
            
            grid.innerHTML = cardsHTML;
            grid.classList.remove('hidden');
        }

        function updateStats() {
            const totalChantiers = Object.keys(groupedChantiers).length;
            const totalInterventions = allInterventions.length;
            const activeInterventions = allInterventions.filter(i => 
                i.status && (i.status.toLowerCase().includes('planifié') || i.status.toLowerCase().includes('cours') || i.status.toLowerCase().includes('assigné'))
            ).length;
            const completedInterventions = allInterventions.filter(i => 
                i.status && (i.status.toLowerCase().includes('terminé') || i.status.toLowerCase().includes('fini'))
            ).length;
            
            document.getElementById('total-chantiers').textContent = totalChantiers;
            document.getElementById('total-interventions').textContent = totalInterventions;
            document.getElementById('active-interventions').textContent = activeInterventions;
            document.getElementById('completed-interventions').textContent = completedInterventions;
        }

        function openChantierModalWithFilter(chantierNumber, chantierTitle, filter) {
            console.log('Opening modal for chantier:', chantierNumber, chantierTitle, 'with filter:', filter);
            
            const key = \`\${chantierNumber}-\${chantierTitle}\`;
            const chantier = groupedChantiers[key];
            
            if (!chantier) {
                console.error('Chantier not found:', key);
                return;
            }
            
            let filteredInterventions = chantier.interventions;
            
            // Apply filter
            if (filter === 'active') {
                filteredInterventions = chantier.interventions.filter(i => 
                    i.status && (i.status.toLowerCase().includes('planifié') || i.status.toLowerCase().includes('cours') || i.status.toLowerCase().includes('assigné'))
                );
            } else if (filter === 'completed') {
                filteredInterventions = chantier.interventions.filter(i => 
                    i.status && (i.status.toLowerCase().includes('terminé') || i.status.toLowerCase().includes('fini'))
                );
            }
            
            // Update modal title with filter info
            let titleSuffix = '';
            if (filter === 'active') {
                titleSuffix = ' - En cours/Planifiées';
            } else if (filter === 'completed') {
                titleSuffix = ' - Terminées';
            }
            
            document.getElementById('modal-title').innerHTML = \`
                <i class="fas fa-hard-hat mr-2"></i>
                \${chantierNumber} - \${chantierTitle}\${titleSuffix}
            \`;
            
            displayInterventionsInModal(filteredInterventions);
            document.getElementById('chantier-modal').classList.remove('hidden');
        }

        function openChantierModal(chantierNumber, chantierTitle) {
            openChantierModalWithFilter(chantierNumber, chantierTitle, 'all');
        }

        function displayInterventionsInModal(interventions) {
            const tableBody = document.getElementById('interventions-modal-table');
            
            if (!interventions || interventions.length === 0) {
                tableBody.innerHTML = \`
                    <tr>
                        <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                            Aucune intervention trouvée
                        </td>
                    </tr>
                \`;
                return;
            }
            
            const rows = interventions.map(intervention => \`
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #\${intervention.intervention_id}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">
                        <div class="max-w-xs truncate" title="\${intervention.title}">
                            \${intervention.title}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        \${intervention.date_time || 'Non définie'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            \${intervention.status || 'Inconnu'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        \${intervention.assigned_to || 'Non assigné'}
                    </td>
                </tr>
            \`).join('');
            
            tableBody.innerHTML = rows;
        }

        function closeModal() {
            document.getElementById('chantier-modal').classList.add('hidden');
        }

        function displayError(message) {
            const loading = document.getElementById('loading');
            const grid = document.getElementById('chantiers-grid');
            
            loading.classList.add('hidden');
            grid.innerHTML = \`
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
                    <p class="text-red-600">\${message}</p>
                    <button onclick="loadChantiers()" class="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                        Réessayer
                    </button>
                </div>
            \`;
            grid.classList.remove('hidden');
        }

        // Close modal when clicking outside
        document.getElementById('chantier-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    </script>
</body>
</html>`;
}

module.exports = { getSimpleChantiersHTML };