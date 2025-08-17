// views/dashboard.js - HTML template (CORRECTED PATHS)

function getDashboardHTML() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tableau de Bord - Interventions Techniques</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/css/dashboard.css">
</head>
<body class="bg-gray-50">
    ${getHeaderHTML()}
    ${getMainContentHTML()}
    <script src="/js/dashboard.js"></script>
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <!-- Reçues -->
            <div class="bg-white overflow-hidden shadow rounded-lg border border-blue-200">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
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

            <!-- Assignées -->
            <div class="bg-white overflow-hidden shadow rounded-lg border border-yellow-200">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                <i class="fas fa-user-check text-white text-sm"></i>
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

            <!-- En Cours -->
            <div class="bg-white overflow-hidden shadow rounded-lg border border-orange-200">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                <i class="fas fa-cog text-white text-sm"></i>
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

            <!-- Terminées -->
            <div class="bg-white overflow-hidden shadow rounded-lg border border-green-200">
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

            <!-- Facturées -->
            <div class="bg-white overflow-hidden shadow rounded-lg border border-purple-200">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
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

            <!-- Payées -->
            <div class="bg-white overflow-hidden shadow rounded-lg border border-indigo-200">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                                <i class="fas fa-money-check text-white text-sm"></i>
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

        <!-- Section Interventions Urgentes -->
        <div class="mb-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold text-gray-900 flex items-center">
                    <span class="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                    Interventions Urgentes
                </h2>
                <button class="btn-primary text-sm">
                    Voir Tout
                </button>
            </div>
            <div class="bg-white rounded-lg shadow overflow-hidden border border-red-200">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-red-50 to-orange-50">
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
                        <tbody id="urgent-table" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="8" class="px-6 py-4 text-center text-gray-500">Chargement...</td>
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