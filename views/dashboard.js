// views/dashboard.js - Enhanced HTML template with colors, icons, and tooltips

function getDashboardHTML() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tableau de Bord - ASTRO TECH</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/nodetest/css/dashboard.css">
</head>
<body class="bg-gray-50">
    ${getHeaderHTML()}
    ${getMainContentHTML()}
    <script src="/nodetest/js/dashboard.js"></script>
</body>
</html>`;
}

function getHeaderHTML() {
    return `
    <header class="bg-white shadow-sm border-b-2 border-blue-600">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-lg">TI</span>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-gray-900">ASTRO TECH</h1>
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
    </header>`;
}

function getMainContentHTML() {
    return `
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <!-- Titre du Tableau de Bord avec bouton Nouvelle Intervention -->
        <div class="mb-8">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
                    <p class="text-gray-600 mt-2">Vue d'ensemble de vos interventions techniques</p>
                </div>
                <div class="flex space-x-3">
                    <a href="/nodetest/create-intervention" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>
                        Nouvelle Intervention
                    </a>
                    <button onclick="loadDashboardData()" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        <i class="fas fa-sync-alt mr-2"></i>
                        Actualiser
                    </button>
                </div>
            </div>
        </div>

        <!-- Section Statistiques -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <!-- Reçues -->
            <div class="stat-card" onclick="filterInterventions('received')">
                <div class="bg-white overflow-hidden shadow rounded-lg border border-yellow-200 hover:border-yellow-400 transition-all">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-inbox text-white text-sm"></i>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Reçues</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="stat-received">-</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Assignées -->
            <div class="stat-card" onclick="filterInterventions('assigned')">
                <div class="bg-white overflow-hidden shadow rounded-lg border border-blue-200 hover:border-blue-400 transition-all">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-user-tag text-white text-sm"></i>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Assignées</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="stat-assigned">-</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- En Cours -->
            <div class="stat-card" onclick="filterInterventions('in-progress')">
                <div class="bg-white overflow-hidden shadow rounded-lg border border-purple-200 hover:border-purple-400 transition-all">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-cogs text-white text-sm"></i>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">En Cours</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="stat-inProgress">-</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Terminées -->
            <div class="stat-card" onclick="filterInterventions('completed')">
                <div class="bg-white overflow-hidden shadow rounded-lg border border-green-200 hover:border-green-400 transition-all">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-check-circle text-white text-sm"></i>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Terminées</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="stat-completed">-</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Facturées -->
            <div class="stat-card" onclick="filterInterventions('billed')">
                <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:border-gray-400 transition-all">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-file-invoice text-white text-sm"></i>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Facturées</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="stat-billed">-</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payées -->
            <div class="stat-card" onclick="filterInterventions('paid')">
                <div class="bg-white overflow-hidden shadow rounded-lg border border-emerald-200 hover:border-emerald-400 transition-all">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-money-check-alt text-white text-sm"></i>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Payées</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="stat-paid">-</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section Filtrée (masquée par défaut) -->
        <div id="filtered-section" class="mb-8 hidden">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold text-gray-900 flex items-center">
                    <span class="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                    <span id="filtered-title">Interventions Filtrées</span>
                </h2>
                <button class="btn-secondary text-sm" onclick="clearFilter()">
                    <i class="fa fa-times mr-2"></i>Effacer le Filtre
                </button>
            </div>
            <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-gray-50 to-blue-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Intervention</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigné à</th>
                            </tr>
                        </thead>
                        <tbody id="filtered-table" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="8" class="px-6 py-4 text-center text-gray-500">Chargement...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Section Interventions Urgentes - 48h -->
        <div class="mb-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold text-gray-900 flex items-center">
                    <span class="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                    Interventions Urgentes - 48h Pile
                </h2>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500">📋 Manque technicien ou date</span>
                    <a href="/nodetest/urgent" class="btn-primary text-sm">
                        <i class="fa fa-eye mr-2"></i>Voir Tout
                    </a>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow overflow-hidden border border-red-200">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-red-50 to-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Intervention</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">❌ Manquant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⏰ Temps Restant</th>
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

        <!-- Section Interventions Récentes -->
        <div class="mb-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold text-gray-900 flex items-center">
                    <span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Interventions Récentes
                </h2>
                <button class="btn-primary text-sm" onclick="loadAllRecent()">
                    <i class="fa fa-list mr-2"></i>Voir Tout
                </button>
            </div>
            <div class="bg-white rounded-lg shadow overflow-hidden border border-blue-200">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-blue-50 to-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Intervention</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigné à</th>
                            </tr>
                        </thead>
                        <tbody id="recent-table" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="8" class="px-6 py-4 text-center text-gray-500">Chargement...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>`;
}

module.exports = { getDashboardHTML };