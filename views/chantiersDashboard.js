// views/chantiersDashboard.js - Secondary dashboard view for chantiers only

function getChantiersHTML() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Chantiers - Astro Tech</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        .card-hover {
            transition: all 0.3s ease;
        }
        .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .chantier-card {
            cursor: pointer;
            border-left: 4px solid transparent;
            transition: all 0.3s ease;
        }
        .chantier-card:hover {
            border-left-color: #f59e0b;
            transform: translateY(-1px);
        }
        .stat-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .active-badge { background: #fee2e2; color: #dc2626; }
        .completed-badge { background: #d1fae5; color: #059669; }
        .total-badge { background: #dbeafe; color: #2563eb; }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="gradient-bg shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex items-center justify-between">
                <div>
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                            <i class="fas fa-hard-hat text-2xl text-orange-600"></i>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-white">Dashboard Chantiers</h1>
                            <p class="text-orange-100">Suivi des interventions par chantier</p>
                        </div>
                    </div>
                </div>
                <div class="flex space-x-3">
                    <a href="/nodetest" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all">
                        <i class="fas fa-home mr-2"></i>Dashboard Principal
                    </a>
                    <button onclick="refreshData()" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all">
                        <i class="fas fa-sync-alt mr-2"></i>Actualiser
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Stats Overview -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-xl shadow-md p-6 card-hover">
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
            
            <div class="bg-white rounded-xl shadow-md p-6 card-hover">
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
            
            <div class="bg-white rounded-xl shadow-md p-6 card-hover">
                <div class="flex items-center">
                    <div class="p-3 bg-yellow-100 rounded-full">
                        <i class="fas fa-clock text-2xl text-yellow-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">En Cours</p>
                        <p class="text-2xl font-bold text-gray-900" id="active-interventions">-</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-md p-6 card-hover">
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

        <!-- Chantiers List -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-4 border-b">
                <div class="flex items-center justify-between">
                    <h2 class="text-xl font-semibold text-gray-900">
                        <i class="fas fa-list mr-2 text-orange-600"></i>
                        Chantiers et Interventions
                    </h2>
                    <div class="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Cliquez sur un chantier pour voir les détails</span>
                        <i class="fas fa-info-circle"></i>
                    </div>
                </div>
            </div>
            
            <!-- Loading State -->
            <div id="loading-chantiers" class="p-8 text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
                <p class="text-gray-600">Chargement des chantiers...</p>
            </div>
            
            <!-- Chantiers Grid -->
            <div id="chantiers-grid" class="hidden grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                <!-- Chantiers will be loaded here -->
            </div>
            
            <!-- Empty State -->
            <div id="empty-chantiers" class="hidden p-8 text-center">
                <i class="fas fa-hard-hat text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-600">Aucun chantier avec interventions trouvé</p>
            </div>
        </div>
    </div>

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
                
                <!-- Filters -->
                <div class="bg-gray-50 px-6 py-4 border-b">
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <select id="filter-status" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="all">Tous les statuts</option>
                            <option value="2">Assigné</option>
                            <option value="3">En cours</option>
                            <option value="4">Terminé</option>
                        </select>
                        
                        <select id="filter-technician" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="all">Tous les techniciens</option>
                        </select>
                        
                        <select id="filter-priority" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="all">Toutes les priorités</option>
                            <option value="haute">Haute</option>
                            <option value="moyenne">Moyenne</option>
                            <option value="basse">Basse</option>
                        </select>
                        
                        <input type="date" id="filter-date-start" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                               placeholder="Date début">
                        
                        <input type="date" id="filter-date-end" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                               placeholder="Date fin">
                    </div>
                    
                    <div class="flex justify-between items-center mt-4">
                        <button onclick="applyFilters()" class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                            <i class="fas fa-filter mr-2"></i>Appliquer les Filtres
                        </button>
                        <button onclick="clearFilters()" class="text-gray-600 hover:text-gray-800 transition-colors">
                            <i class="fas fa-times mr-2"></i>Effacer
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
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                            </tr>
                        </thead>
                        <tbody id="interventions-table" class="bg-white divide-y divide-gray-200">
                            <!-- Interventions will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div class="bg-gray-50 px-6 py-3 border-t">
                    <div class="flex items-center justify-between">
                        <div id="pagination-info" class="text-sm text-gray-700">
                            <!-- Pagination info will be shown here -->
                        </div>
                        <div id="pagination-controls" class="flex space-x-2">
                            <!-- Pagination buttons will be shown here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="/nodetest/js/chantiersDashboard.js"></script>
</body>
</html>`;
}

module.exports = { getChantiersHTML };