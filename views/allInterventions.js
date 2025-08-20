// views/allInterventions.js - All interventions listing page
function getAllInterventionsHTML() {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Toutes les Interventions - Astro-Tech</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .urgent-row {
            background: linear-gradient(90deg, rgba(254, 202, 202, 0.3) 0%, rgba(252, 165, 165, 0.2) 100%);
        }
        .stat-card {
            cursor: pointer;
            transition: all 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .filter-input {
            transition: all 0.2s;
        }
        .filter-input:focus {
            ring-width: 2px;
            ring-color: #3b82f6;
        }
        
        /* Simple hover effect for truncated text */
        .truncate-hover {
            cursor: help;
            transition: all 0.2s ease;
        }
        
        .truncate-hover:hover {
            background-color: #f3f4f6;
            border-radius: 4px;
            padding: 2px 4px;
            margin: -2px -4px;
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <a href="/nodetest" class="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-6">
                        <i class="fas fa-arrow-left mr-2"></i>
                        <span class="font-medium">Retour au Tableau de Bord</span>
                    </a>
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center">
                        <span class="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                        Toutes les Interventions
                    </h1>
                </div>
                <div class="flex items-center space-x-4">
                    <span id="stats-display" class="text-sm text-gray-500">Chargement...</span>
                    <button onclick="refreshData()" class="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Filters Section -->
        <div class="bg-white rounded-lg shadow border border-gray-200 mb-6">
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <!-- Search -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                        <input type="text" id="search-input" placeholder="N°, titre, adresse..." 
                               class="filter-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <!-- Status Filter -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                        <select id="status-filter" class="filter-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Tous les statuts</option>
                            <option value="received">Reçues</option>
                            <option value="assigned">Assignées</option>
                            <option value="in-progress">En cours</option>
                            <option value="completed">Terminées</option>
                            <option value="billed">Facturées</option>
                            <option value="paid">Payées</option>
                        </select>
                    </div>
                    
                    <!-- Priority Filter -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                        <select id="priority-filter" class="filter-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Toutes les priorités</option>
                            <option value="normale">Normale</option>
                            <option value="importante">Importante</option>
                            <option value="urgente">Urgente</option>
                        </select>
                    </div>
                    
                    <!-- Technician Filter -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Technicien</label>
                        <select id="technician-filter" class="filter-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Tous les techniciens</option>
                            <option value="unassigned">Non assigné</option>
                            <!-- Technicians will be loaded dynamically -->
                        </select>
                    </div>
                </div>
                
                <!-- Second row for date filter -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <!-- Date Filter -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Date d'intervention</label>
                        <input type="date" id="date-filter" 
                               class="filter-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <!-- Date Range Presets -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Raccourcis de date</label>
                        <select id="date-preset" class="filter-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Sélectionner une période</option>
                            <option value="today">Aujourd'hui</option>
                            <option value="yesterday">Hier</option>
                            <option value="this-week">Cette semaine</option>
                            <option value="last-week">Semaine dernière</option>
                            <option value="this-month">Ce mois</option>
                            <option value="last-month">Mois dernier</option>
                        </select>
                    </div>
                    
                    <!-- Clear Date Filter -->
                    <div class="flex items-end">
                        <button onclick="clearDateFilter()" class="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
                            <i class="fas fa-calendar-times mr-2"></i>Effacer Date
                        </button>
                    </div>
                </div>
                
                <div class="flex justify-between items-center">
                    <div class="flex space-x-2">
                        <button onclick="applyFilters()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            <i class="fas fa-filter mr-2"></i>Appliquer les Filtres
                        </button>
                        <button onclick="clearFilters()" class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
                            <i class="fas fa-times mr-2"></i>Effacer
                        </button>
                    </div>
                    
                    <!-- Sort Options -->
                    <div class="flex items-center space-x-2">
                        <label class="text-sm font-medium text-gray-700">Trier par:</label>
                        <select id="sort-by" class="px-3 py-1 border border-gray-300 rounded-md text-sm">
                            <option value="created_at">Date de création</option>
                            <option value="date_time">Date intervention</option>
                            <option value="intervention_id">N° Intervention</option>
                            <option value="title">Titre</option>
                            <option value="status">Statut</option>
                            <option value="priority">Priorité</option>
                            <option value="assigned_to">Technicien</option>
                        </select>
                        <select id="sort-order" class="px-3 py-1 border border-gray-300 rounded-md text-sm">
                            <option value="desc">Décroissant</option>
                            <option value="asc">Croissant</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Results Table -->
        <div class="bg-white rounded-lg shadow border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <h2 class="text-lg font-semibold text-gray-900">Résultats</h2>
                    <div class="flex items-center space-x-4">
                        <span id="results-count" class="text-sm text-gray-500">-</span>
                        <div class="flex items-center space-x-2">
                            <label class="text-sm text-gray-700">Afficher:</label>
                            <select id="page-size" onchange="changePageSize()" class="px-2 py-1 border border-gray-300 rounded text-sm">
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gradient-to-r from-gray-50 to-blue-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Intervention</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Intervention</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigné à</th>
                        </tr>
                    </thead>
                    <tbody id="interventions-table" class="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                                <i class="fas fa-spinner fa-spin mr-2"></i>Chargement des interventions...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            <div id="pagination" class="px-6 py-4 border-t border-gray-200">
                <!-- Pagination will be inserted here -->
            </div>
        </div>
    </main>

    <script src="/nodetest/js/allInterventions.js"></script>
</body>
</html>`;
}

module.exports = { getAllInterventionsHTML };