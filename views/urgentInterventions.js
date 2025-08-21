// views/urgentInterventions.js - Complete urgent interventions page with action modals and description column

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
    <style>
        .urgent-row {
            background: linear-gradient(90deg, rgba(254, 202, 202, 0.3) 0%, rgba(252, 165, 165, 0.2) 100%);
        }
        .modal {
            backdrop-filter: blur(4px);
        }
        .description-column {
            max-width: 150px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: help;
        }
        
        .description-cell:hover {
            background-color: #f3f4f6;
        }
    </style>
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
                            <h1 class="text-xl font-bold text-gray-900">ASTRO TECH</h1>
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
            <p class="text-gray-600 mt-2">
                <i class="fa fa-info-circle mr-2"></i>Interventions nécessitant une attention immédiate - Délai de 48h ouvrées
            </p>
        </div>

        <!-- Stats Summary -->
        <div class="mb-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                        <span id="total-count" class="text-lg font-semibold text-gray-900">Chargement...</span>
                    </div>
                    <button onclick="refreshData()" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        <i class="fa fa-refresh mr-1"></i>Actualiser
                    </button>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="mb-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Filtres</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label for="search-input" class="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
                        <input type="text" id="search-input" placeholder="N°, titre, adresse..." 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select id="status-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">Tous les statuts</option>
                            <option value="received">Reçu</option>
                            <option value="assigned">Assigné</option>
                            <option value="in-progress">En cours</option>
                        </select>
                    </div>
                    <div>
                        <label for="missing-filter" class="block text-sm font-medium text-gray-700 mb-1">Manquant</label>
                        <select id="missing-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">Tout</option>
                            <option value="technician">Technicien manquant</option>
                            <option value="date">Date manquante</option>
                            <option value="both">Technicien et Date</option>
                        </select>
                    </div>
                    <div>
                        <label for="time-filter" class="block text-sm font-medium text-gray-700 mb-1">Temps restant</label>
                        <select id="time-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">Tous</option>
                            <option value="expired">Expiré (0h)</option>
                            <option value="critical">Critique (≤6h)</option>
                            <option value="urgent">Urgent (≤12h)</option>
                            <option value="warning">Attention (≤24h)</option>
                            <option value="good">Correct (≤48h)</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button onclick="clearFilters()" class="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                            <i class="fa fa-times mr-1"></i>Effacer
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Table -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <!-- Table Controls -->
            <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <div class="flex items-center text-sm text-gray-700">
                        <span>Affichage </span>
                        <span id="showing-start" class="font-medium">0</span>
                        <span> à </span>
                        <span id="showing-end" class="font-medium">0</span>
                        <span> sur </span>
                        <span id="total-results" class="font-medium">0</span>
                        <span> résultats</span>
                    </div>
                    <div class="flex items-center">
                        <select id="results-per-page" onchange="changeResultsPerPage()" class="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="10">10</option>
                            <option value="25" selected>25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span class="ml-2 text-sm text-gray-700">par page</span>
                    </div>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gradient-to-r from-red-50 to-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortBy('intervention_id')">
                                N° Intervention <i class="fa fa-sort ml-1"></i>
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortBy('title')">
                                Titre <i class="fa fa-sort ml-1"></i>
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Adresse
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortBy('status')">
                                Statut <i class="fa fa-sort ml-1"></i>
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ❌ Manquant
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortBy('hours_remaining')">
                                ⏰ Temps Restant <i class="fa fa-sort ml-1"></i>
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Assigné à
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody id="urgent-table" class="bg-white divide-y divide-gray-200">
                        <!-- Table content will be populated by JavaScript -->
                        <tr>
                            <td colspan="9" class="px-6 py-8 text-center text-gray-500">
                                <i class="fa fa-spinner fa-spin mr-2"></i>Chargement des interventions urgentes...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div class="flex justify-center">
                    <div id="pagination-controls" class="flex space-x-1">
                        <!-- Pagination will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Technician Assignment Modal -->
    <div id="technician-modal" class="hidden fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity modal" onclick="closeModal('technician-modal')"></div>
            
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                            <i class="fa fa-user-plus text-blue-600"></i>
                        </div>
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                            <h3 id="technician-modal-title" class="text-lg leading-6 font-medium text-gray-900">
                                Assigner un technicien
                            </h3>
                            <div class="mt-4">
                                <label for="technician-select" class="block text-sm font-medium text-gray-700 mb-2">
                                    Sélectionner un technicien
                                </label>
                                <select id="technician-select" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Chargement...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button onclick="confirmTechnicianAssignment()" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                        Assigner
                    </button>
                    <button onclick="closeModal('technician-modal')" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Annuler
                    </button>
                </div>
                <input type="hidden" id="modal-intervention-id" value="">
            </div>
        </div>
    </div>

    <!-- Date Assignment Modal -->
    <div id="date-modal" class="hidden fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity modal" onclick="closeModal('date-modal')"></div>
            
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                            <i class="fa fa-calendar-plus text-green-600"></i>
                        </div>
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                            <h3 id="date-modal-title" class="text-lg leading-6 font-medium text-gray-900">
                                Définir une date d'intervention
                            </h3>
                            <div class="mt-4 space-y-4">
                                <div>
                                    <label for="intervention-date" class="block text-sm font-medium text-gray-700 mb-2">
                                        Date <span class="text-red-500">*</span>
                                    </label>
                                    <input type="date" id="intervention-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                                </div>
                                <div>
                                    <label for="intervention-time" class="block text-sm font-medium text-gray-700 mb-2">
                                        Heure (optionnel)
                                    </label>
                                    <input type="time" id="intervention-time" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button onclick="confirmDateAssignment()" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm">
                        Définir
                    </button>
                    <button onclick="closeModal('date-modal')" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Annuler
                    </button>
                </div>
                <input type="hidden" id="date-modal-intervention-id" value="">
            </div>
        </div>
    </div>

    <script src="/nodetest/js/urgent.js"></script>
</body>
</html>`;
}

module.exports = { getUrgentInterventionsHTML };