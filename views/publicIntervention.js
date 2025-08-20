// views/publicIntervention.js - Complete public intervention view page

function getPublicInterventionHTML() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intervention Publique - Astro-Tech</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .card-shadow {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .status-badge {
            transition: all 0.3s ease;
        }
        .info-card {
            transition: transform 0.2s ease;
        }
        .info-card:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="gradient-bg">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="text-center">
                <div class="flex justify-center mb-4">
                    <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <i class="fa fa-tools text-2xl text-blue-600"></i>
                    </div>
                </div>
                <h1 class="text-3xl font-bold text-white mb-2">ASTRO TECH</h1>
                <p class="text-blue-100 text-lg">Détails de l'Intervention</p>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Loading State -->
        <div id="loading-state" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-gray-600 text-lg">Chargement des détails de l'intervention...</p>
        </div>

        <!-- Error State -->
        <div id="error-state" class="hidden text-center py-12">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <i class="fa fa-exclamation-triangle text-2xl text-red-500"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Intervention non trouvée</h2>
            <p class="text-gray-600 mb-4">L'intervention demandée n'existe pas ou n'est pas accessible.</p>
            <a href="/nodetest" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <i class="fa fa-home mr-2"></i>
                Retour à l'accueil
            </a>
        </div>

        <!-- Intervention Details -->
        <div id="intervention-details" class="hidden">
            <!-- Intervention Header -->
            <div class="bg-white rounded-lg card-shadow p-6 mb-6 info-card">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div class="mb-4 md:mb-0">
                        <h2 class="text-2xl font-bold text-gray-900 mb-1" id="intervention-title">Titre de l'intervention</h2>
                        <p class="text-gray-600 flex items-center">
                            <i class="fa fa-hashtag mr-2 text-blue-600"></i>
                            Intervention N° <span id="intervention-number" class="font-semibold ml-1"></span>
                        </p>
                    </div>
                    <div class="text-left md:text-right">
                        <span id="intervention-status" class="status-badge inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-2">
                            <i class="fa fa-clock mr-2"></i>
                            En cours
                        </span>
                        <p class="text-sm text-gray-500 flex items-center md:justify-end">
                            <i class="fa fa-flag mr-2 text-orange-500"></i>
                            Priorité: <span id="intervention-priority" class="font-medium ml-1"></span>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Intervention Information Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <!-- Description -->
                <div class="bg-white rounded-lg card-shadow p-6 info-card">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <i class="fa fa-file-text mr-3 text-blue-600"></i>
                        Description
                    </h3>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <p id="intervention-description" class="text-gray-700 leading-relaxed">
                            Description de l'intervention...
                        </p>
                    </div>
                </div>

                <!-- Location -->
                <div class="bg-white rounded-lg card-shadow p-6 info-card">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <i class="fa fa-map-marker-alt mr-3 text-blue-600"></i>
                        Localisation
                    </h3>
                    <div class="space-y-2">
                        <div class="flex items-start">
                            <i class="fa fa-home mr-3 text-gray-400 mt-1"></i>
                            <p id="intervention-address" class="text-gray-700"></p>
                        </div>
                        <div class="flex items-start" id="city-container" style="display: none;">
                            <i class="fa fa-city mr-3 text-gray-400 mt-1"></i>
                            <p id="intervention-city" class="text-gray-600"></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Additional Information Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <!-- Date and Time -->
                <div class="bg-white rounded-lg card-shadow p-6 info-card">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <i class="fa fa-calendar mr-3 text-blue-600"></i>
                        Date d'intervention
                    </h3>
                    <div class="bg-blue-50 rounded-lg p-4 text-center">
                        <p id="intervention-date" class="text-blue-700 text-lg font-medium">
                            <i class="fa fa-clock mr-2"></i>
                            Non programmée
                        </p>
                    </div>
                </div>

                <!-- Technician -->
                <div class="bg-white rounded-lg card-shadow p-6 info-card">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <i class="fa fa-user mr-3 text-blue-600"></i>
                        Technicien assigné
                    </h3>
                    <div class="bg-green-50 rounded-lg p-4 text-center">
                        <p id="intervention-technician" class="text-green-700 text-lg font-medium">
                            <i class="fa fa-user-circle mr-2"></i>
                            Non assigné
                        </p>
                    </div>
                </div>
            </div>

            <!-- Client Information -->
            <div class="bg-white rounded-lg card-shadow p-6 mb-6 info-card">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fa fa-building mr-3 text-blue-600"></i>
                    Informations client
                </h3>
                <div class="bg-purple-50 rounded-lg p-4">
                    <p id="intervention-client" class="text-purple-700 font-medium flex items-center">
                        <i class="fa fa-user-tie mr-2"></i>
                        Client non spécifié
                    </p>
                </div>
            </div>

            <!-- Intervention Type -->
            <div class="bg-white rounded-lg card-shadow p-6 info-card">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fa fa-cogs mr-3 text-blue-600"></i>
                    Type d'intervention
                </h3>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p id="intervention-type" class="text-gray-700 font-medium flex items-center">
                        <i class="fa fa-wrench mr-2"></i>
                        Type non spécifié
                    </p>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8 mt-12">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div class="flex justify-center mb-4">
                <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <i class="fa fa-tools text-white"></i>
                </div>
            </div>
            <h3 class="text-xl font-semibold mb-2">ASTRO TECH</h3>
            <p class="text-gray-400 mb-4">Service d'intervention technique professionnel</p>
            <div class="flex justify-center space-x-6 text-sm text-gray-400">
                <span class="flex items-center">
                    <i class="fa fa-phone mr-2"></i>
                    Service client
                </span>
                <span class="flex items-center">
                    <i class="fa fa-envelope mr-2"></i>
                    Support technique
                </span>
                <span class="flex items-center">
                    <i class="fa fa-shield-alt mr-2"></i>
                    Intervention sécurisée
                </span>
            </div>
            <div class="mt-6 pt-4 border-t border-gray-700">
                <p class="text-sm text-gray-500">&copy; 2024 Astro-Tech. Tous droits réservés.</p>
            </div>
        </div>
    </footer>

    <script>
        // Get intervention ID from URL
        const pathParts = window.location.pathname.split('/');
        const interventionId = pathParts[pathParts.length - 1];

        // Load intervention details when page loads
        document.addEventListener('DOMContentLoaded', function() {
            loadInterventionDetails();
        });

        // Load intervention details from API
        async function loadInterventionDetails() {
            try {
                console.log('Loading intervention details for ID:', interventionId);
                
                const response = await fetch(\`/nodetest/api/public-intervention/\${interventionId}\`);
                const data = await response.json();

                console.log('API Response:', data);

                if (data.success && data.data) {
                    displayIntervention(data.data);
                } else {
                    console.error('Failed to load intervention:', data.message);
                    showError();
                }
            } catch (error) {
                console.error('Error loading intervention:', error);
                showError();
            }
        }

        // Display intervention details in the UI
        function displayIntervention(intervention) {
            console.log('Displaying intervention:', intervention);
            
            // Hide loading, show content
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('intervention-details').classList.remove('hidden');

            // Update content with fallbacks
            document.getElementById('intervention-title').textContent = intervention.title || 'Sans titre';
            document.getElementById('intervention-number').textContent = intervention.number || 'N/A';
            document.getElementById('intervention-description').textContent = intervention.description || 'Aucune description disponible';
            
            // Address handling
            const address = intervention.address || 'Adresse non spécifiée';
            document.getElementById('intervention-address').textContent = address;
            
            // City handling - only show if exists
            if (intervention.city && intervention.city.trim() !== '') {
                document.getElementById('intervention-city').textContent = intervention.city;
                document.getElementById('city-container').style.display = 'flex';
            }
            
            // Date handling
            const dateText = intervention.date_time || 'Non programmée';
            document.getElementById('intervention-date').innerHTML = \`
                <i class="fa fa-clock mr-2"></i>
                \${dateText}
            \`;
            
            // Priority
            document.getElementById('intervention-priority').textContent = intervention.priority || 'Non définie';
            
            // Client
            document.getElementById('intervention-client').innerHTML = \`
                <i class="fa fa-user-tie mr-2"></i>
                \${intervention.client_name || 'Client non spécifié'}
            \`;

            // Type
            document.getElementById('intervention-type').innerHTML = \`
                <i class="fa fa-wrench mr-2"></i>
                \${intervention.type_name || 'Type non spécifié'}
            \`;

            // Technician
            const technicianName = intervention.technician_firstname && intervention.technician_lastname 
                ? \`\${intervention.technician_firstname} \${intervention.technician_lastname}\`
                : 'Non assigné';
            document.getElementById('intervention-technician').innerHTML = \`
                <i class="fa fa-user-circle mr-2"></i>
                \${technicianName}
            \`;

            // Status with appropriate styling
            updateStatusDisplay(intervention.status_name);

            // Update page title
            document.title = \`Intervention \${intervention.number} - \${intervention.title} - Astro-Tech\`;
        }

        // Update status display with appropriate styling
        function updateStatusDisplay(statusName) {
            const statusElement = document.getElementById('intervention-status');
            const status = (statusName || 'En cours').toLowerCase();
            
            // Reset classes
            statusElement.className = 'status-badge inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2';
            
            // Apply status-specific styling and icons
            if (status.includes('terminé') || status.includes('fini')) {
                statusElement.classList.add('bg-green-100', 'text-green-800');
                statusElement.innerHTML = '<i class="fa fa-check-circle mr-2"></i>' + (statusName || 'Terminé');
            } else if (status.includes('cours') || status.includes('démarré')) {
                statusElement.classList.add('bg-blue-100', 'text-blue-800');
                statusElement.innerHTML = '<i class="fa fa-play-circle mr-2"></i>' + (statusName || 'En cours');
            } else if (status.includes('assigné') || status.includes('planifié')) {
                statusElement.classList.add('bg-yellow-100', 'text-yellow-800');
                statusElement.innerHTML = '<i class="fa fa-calendar-check mr-2"></i>' + (statusName || 'Programmé');
            } else if (status.includes('reçu') || status.includes('nouveau')) {
                statusElement.classList.add('bg-purple-100', 'text-purple-800');
                statusElement.innerHTML = '<i class="fa fa-inbox mr-2"></i>' + (statusName || 'Reçu');
            } else {
                statusElement.classList.add('bg-gray-100', 'text-gray-800');
                statusElement.innerHTML = '<i class="fa fa-clock mr-2"></i>' + (statusName || 'En attente');
            }
        }

        // Show error state
        function showError() {
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('error-state').classList.remove('hidden');
        }
    </script>
</body>
</html>`;
}

module.exports = { getPublicInterventionHTML };