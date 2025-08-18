// views/urgentInterventions.js - Complete urgent interventions page

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
            <p class="text-gray-600 mt-2">Interventions manquant technicien ou date de planification</p>
        </div>

        <!-- Stats Card -->
        <div class="bg-white rounded-lg shadow mb-6 p-6">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900">Statistiques</h3>
                    <p id="total-count" class="text-2xl font-bold text-red-600">Chargement...</p>
                </div>
                <div class="text-right">
                    <button onclick="refreshData()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">
                        <i class="fa fa-refresh mr-2"></i>Actualiser
                    </button>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow mb-6 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Filtres</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <label for="search-input" class="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
                    <input type="text" id="search-input" 
                           placeholder="N°, titre, adresse..." 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select id="status-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Tous les statuts</option>
                        <option value="recu">Reçue</option>
                        <option value="assigne">Assignée</option>
                        <option value="planifie">Planifiée</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
                <div>
                    <label for="missing-filter" class="block text-sm font-medium text-gray-700 mb-1">Info manquante</label>
                    <select id="missing-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Toutes</option>
                        <option value="technician">Technicien manquant</option>
                        <option value="date">Date manquante</option>
                        <option value="both">Technicien et date</option>
                    </select>
                </div>
                <div>
                    <label for="time-filter" class="block text-sm font-medium text-gray-700 mb-1">Temps restant</label>
                    <select id="time-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Toutes</option>
                        <option value="expired">⏰ Expiré (0h)</option>
                        <option value="critical">🚨 Critique (≤6h)</option>
                        <option value="urgent">⚠️ Urgent (6-12h)</option>
                        <option value="warning">⚡ Attention (12-24h)</option>
                        <option value="good">✅ Correct (24-48h)</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button onclick="clearFilters()" class="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm">
                        Effacer filtres
                    </button>
                </div>
            </div>
        </div>

        <!-- Results table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-700">
                        Affichage de <span id="showing-start">1</span> à <span id="showing-end">25</span> sur <span id="total-results">25</span> résultats
                    </span>
                </div>
                <div class="flex items-center space-x-2">
                    <label for="page-size" class="text-sm text-gray-700">Afficher:</label>
                    <select id="page-size" class="px-2 py-1 border border-gray-300 rounded text-sm">
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                    <span class="text-sm text-gray-700">par page</span>
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
                        <tr>
                            <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                                <i class="fa fa-spinner fa-spin mr-2"></i>Chargement des interventions urgentes...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div class="flex items-center justify-center">
                    <nav class="flex" id="pagination-controls">
                        <!-- Pagination buttons will be inserted here by JavaScript -->
                    </nav>
                </div>
            </div>
        </div>
    </main>

    <script src="/nodetest/js/urgent.js"></script>
</body>
</html>`;
}

module.exports = { getUrgentInterventionsHTML };