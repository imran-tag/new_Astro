// views/dashboard.js - HTML template

function getDashboardHTML() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tableau de Bord - Interventions Techniques</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="../public/css/dashboard.css">
</head>
<body class="bg-gray-50">
    ${getHeaderHTML()}
    ${getMainContentHTML()}
    <script src="../public/js/dashboard.js"></script>
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
    </header>`;
}

function getMainContentHTML() {
    return `
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
            <div class="stat-card p-4" onclick="filterByStatus('in-progress')">
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

        <!-- Section des Interventions Filtrées -->
        <div id="filtered-section" class="mb-8" style="display: none;">
            <div class="flex justify-between items-center mb-4">
                <h2 id="filtered-title" class="text-2xl font-semibold text-gray-900 flex items-center">
                    <span id="filtered-icon" class="w-3 h-3 rounded-full mr-2"></span>
                    Interventions Filtrées
                </h2>
                <button class="btn-secondary text-sm" onclick="clearFilter()">
                    <i class="fa fa-times mr-1"></i> Effacer le filtre
                </button>
            </div>
            <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-blue-50 to-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Intervention</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigné à</th>
                            </tr>
                        </thead>
                        <tbody id="filtered-table" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="8" class="px-6 py-4 text-center text-gray-500">Sélectionnez un statut pour voir les interventions</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
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
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temps Restant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigné à</th>
                            </tr>
                        </thead>
                        <tbody id="urgent-table" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="9" class="px-6 py-4 text-center text-gray-500">Chargement...</td>
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
                        <thead class="bg-gradient-to-r from-blue-50 to-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Intervention</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
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