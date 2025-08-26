// views/allInterventions.js - All interventions listing page with Actions
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
        
        .modal {
            backdrop-filter: blur(4px);
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
                    <a href="/nodetest/create-intervention" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
                        <i class="fas fa-plus mr-2"></i>
                        Nouvelle Intervention
                    </a>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <!-- Page Description -->
        <div class="mb-8">
            <p class="text-gray-600">
                <i class="fas fa-info-circle mr-2"></i>
                Consultez et gérez toutes vos interventions avec des filtres avancés et des outils de recherche.
            </p>
        </div>

        <!-- Stats Summary -->
        <div class="mb-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
                <div class="flex items-center justify-between">
                    <span id="total-count" class="text-lg font-semibold text-gray-900">Chargement...</span>
                    <button onclick="loadInterventions()" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        <i class="fa fa-refresh mr-1"></i>Actualiser
                    </button>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="mb-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Filtres et Recherche</h3>
                
                <!-- First row for basic filters -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <!-- Search -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
                        <input type="text" id="search-input" placeholder="N°, titre, description..." 
                               class="filter-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <!-- Status Filter -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                        <select id="status-filter" class="filter-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Tous les statuts</option>
                            <option value="received">Reçu</option>
                            <option value="assigned">Assigné</option>
                            <option value="in-progress">En cours</option>
                            <option value="completed">Terminé</option>
                            <option value="billed">Facturé</option>
                            <option value="paid">Payé</option>
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
                        <select id="sort-by" class="px-3 py-1 border border-gray-300 rounded text-sm">
                            <option value="created_at">Date de création</option>
                            <option value="date_time">Date d'intervention</option>
                            <option value="title">Titre</option>
                            <option value="status">Statut</option>
                            <option value="priority">Priorité</option>
                            <option value="price">Prix</option>

                        </select>
                        <select id="sort-order" class="px-3 py-1 border border-gray-300 rounded text-sm">
                            <option value="desc">Décroissant</option>
                            <option value="asc">Croissant</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Table -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gradient-to-r from-gray-50 to-blue-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Intervention</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Intervention</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigné à</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="interventions-table" class="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colspan="9" class="px-6 py-8 text-center text-gray-500">
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

    <!-- Download Choice Modal -->
    <div id="download-modal" class="hidden fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity modal" onclick="closeModal('download-modal')"></div>
            
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                            <i class="fa fa-download text-green-600"></i>
                        </div>
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                            <h3 class="text-lg leading-6 font-medium text-gray-900">
                                Télécharger le document
                            </h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500">
                                    Voulez-vous télécharger le rapport ou le quitus ?
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button onclick="downloadQuitus()" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm">
                        <i class="fa fa-file-text mr-2"></i>Quitus
                    </button>
                    <button onclick="downloadRapport()" class="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        <i class="fa fa-file mr-2"></i>Rapport
                    </button>
                    <button onclick="closeModal('download-modal')" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Annuler
                    </button>
                </div>
                <input type="hidden" id="download-intervention-id" value="">
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="delete-modal" class="hidden fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity modal" onclick="closeModal('delete-modal')"></div>
            
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <i class="fa fa-exclamation-triangle text-red-600"></i>
                        </div>
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 class="text-lg leading-6 font-medium text-gray-900">
                                Supprimer l'intervention
                            </h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500">
                                    Voulez-vous vraiment supprimer cette intervention ? Cette action ne peut pas être annulée.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button onclick="confirmDelete()" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
                        <i class="fa fa-check mr-2"></i>Oui, supprimer
                    </button>
                    <button onclick="closeModal('delete-modal')" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        <i class="fa fa-times mr-2"></i>Annuler
                    </button>
                </div>
                <input type="hidden" id="delete-intervention-id" value="">
            </div>
        </div>
    </div>

    <script src="/nodetest/js/allInterventions.js"></script>
</body>
</html>`;
}

module.exports = { getAllInterventionsHTML };