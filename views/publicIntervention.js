// views/publicIntervention.js - Complete public intervention view following old_Astro pattern

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
            <div class="bg-red-100 rounded-lg p-8 max-w-md mx-auto">
                <i class="fa fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
                <h2 class="text-xl font-semibold text-red-800 mb-2">Intervention non trouvée</h2>
                <p class="text-red-600">L'intervention demandée n'existe pas ou n'est pas accessible publiquement.</p>
            </div>
        </div>

        <!-- Intervention Details -->
        <div id="intervention-details" class="hidden">
            <!-- Header Card -->
            <div class="bg-white rounded-lg card-shadow p-6 mb-6">
                <div class="text-center">
                    <h1 id="intervention-title" class="text-2xl font-bold text-gray-900 mb-2">Intervention</h1>
                    <div class="flex justify-center items-center space-x-4 mb-4">
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            N° <span id="intervention-number">---</span>
                        </span>
                        <div id="intervention-status" class="status-badge inline-flex items-center px-3 py-1 rounded-full text-sm font-medium">
                            <i class="fa fa-clock mr-2"></i>En cours
                        </div>
                    </div>
                    <div class="flex justify-center items-center text-sm text-gray-600">
                        <i class="fa fa-flag mr-2 text-orange-500"></i>
                        Priorité: <span id="intervention-priority" class="font-medium ml-1">Normale</span>
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
                            <p id="intervention-address" class="text-gray-700">Adresse non spécifiée</p>
                        </div>
                        <div class="flex items-start" id="city-container" style="display: none;">
                            <i class="fa fa-city mr-3 text-gray-400 mt-1"></i>
                            <p id="intervention-city" class="text-gray-600"></p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <!-- Client & Technician -->
                <div class="bg-white rounded-lg card-shadow p-6 info-card">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <i class="fa fa-users mr-3 text-blue-600"></i>
                        Intervenants
                    </h3>
                    <div class="space-y-3">
                        <div class="bg-gray-50 rounded-lg p-3">
                            <p class="text-sm text-gray-600 mb-1">Client</p>
                            <p id="intervention-client" class="font-medium text-gray-900 flex items-center">
                                <i class="fa fa-building mr-2"></i>
                                Client non spécifié
                            </p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-3">
                            <p class="text-sm text-gray-600 mb-1">Technicien assigné</p>
                            <p id="intervention-technician" class="font-medium text-gray-900 flex items-center">
                                <i class="fa fa-user-circle mr-2"></i>
                                Non assigné
                            </p>
                        </div>
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

            <!-- Date Information -->
            <div class="bg-white rounded-lg card-shadow p-6 mb-6 info-card">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fa fa-calendar mr-3 text-blue-600"></i>
                    Informations temporelles
                </h3>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p id="intervention-date" class="text-gray-700 flex items-center">
                        <i class="fa fa-clock mr-2"></i>
                        Date non spécifiée
                    </p>
                </div>
            </div>

            <!-- Images Before Intervention -->
            <div id="images-before-section" class="bg-white rounded-lg card-shadow p-6 mb-6 info-card" style="display: none;">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fa fa-camera mr-3 text-blue-600"></i>
                    Photos avant intervention
                </h3>
                <div id="images-before-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Images will be populated here -->
                </div>
            </div>

            <!-- Images After Intervention -->
            <div id="images-after-section" class="bg-white rounded-lg card-shadow p-6 mb-6 info-card" style="display: none;">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fa fa-camera mr-3 text-blue-600"></i>
                    Photos après intervention
                </h3>
                <div id="images-after-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Images will be populated here -->
                </div>
            </div>

            <!-- Quality and Security Controls -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <!-- Quality Control -->
                <div class="bg-white rounded-lg card-shadow p-6 info-card">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <i class="fa fa-check-circle mr-3 text-green-600"></i>
                        Contrôle Qualité
                    </h3>
                    <div id="quality-checklist" class="space-y-2">
                        <!-- Quality items will be populated here -->
                    </div>
                </div>

                <!-- Security Control -->
                <div class="bg-white rounded-lg card-shadow p-6 info-card">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <i class="fa fa-shield-alt mr-3 text-orange-600"></i>
                        Contrôle Sécurité
                    </h3>
                    <div id="security-checklist" class="space-y-2">
                        <!-- Security items will be populated here -->
                    </div>
                </div>
            </div>

            <!-- Comments Section -->
            <div id="comments-section" class="bg-white rounded-lg card-shadow p-6 mb-6 info-card" style="display: none;">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fa fa-comment mr-3 text-blue-600"></i>
                    Commentaire
                </h3>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p id="intervention-comments" class="text-gray-700 leading-relaxed">
                        <!-- Comments will be populated here -->
                    </p>
                </div>
            </div>

            <!-- Signature Section -->
            <div id="signature-section" class="bg-white rounded-lg card-shadow p-6 mb-6 info-card" style="display: none;">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fa fa-signature mr-3 text-purple-600"></i>
                    Signature
                </h3>
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                    <img id="intervention-signature" src="" alt="Signature" class="max-w-full h-auto mx-auto" style="max-height: 200px;">
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
            console.log('Images before:', intervention.images_before);
            console.log('Images after:', intervention.images_after);
            console.log('Comments:', intervention.comments);
            console.log('Signature:', intervention.signature);
            console.log('Quality:', intervention.quality);
            console.log('Security:', intervention.security);
            
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

            // Client info
            document.getElementById('intervention-client').innerHTML = \`
                <i class="fa fa-building mr-2"></i>
                \${intervention.client_name || 'Client non spécifié'}
            \`;

            // Technician info
            const technicianName = intervention.technician_firstname && intervention.technician_lastname ?
                \`\${intervention.technician_firstname} \${intervention.technician_lastname}\`
                : 'Non assigné';
            document.getElementById('intervention-technician').innerHTML = \`
                <i class="fa fa-user-circle mr-2"></i>
                \${technicianName}
            \`;

            // Intervention type
            document.getElementById('intervention-type').innerHTML = \`
                <i class="fa fa-wrench mr-2"></i>
                \${intervention.type_name || 'Type non spécifié'}
            \`;

            // Date information
            if (intervention.date_time) {
                let formattedDate = intervention.date_time;
                
                try {
                    // Try to parse and format the date
                    // Handle different date formats that might come from database
                    let date;
                    
                    if (intervention.date_time.includes('/')) {
                        // Format: "20/08/2025" (DD/MM/YYYY)
                        const parts = intervention.date_time.split('/');
                        if (parts.length === 3) {
                            // Convert DD/MM/YYYY to MM/DD/YYYY for JavaScript Date
                            date = new Date(parts[2] + '-' + parts[1] + '-' + parts[0]);
                        }
                    } else {
                        // Try standard date parsing
                        date = new Date(intervention.date_time);
                    }
                    
                    if (date && !isNaN(date.getTime())) {
                        formattedDate = date.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                    } else {
                        // If parsing fails, use the original value
                        formattedDate = intervention.date_time;
                    }
                } catch (e) {
                    console.log('Date parsing error:', e);
                    // Fallback to original date string
                    formattedDate = intervention.date_time;
                }
                
                document.getElementById('intervention-date').innerHTML = \`
                    <i class="fa fa-clock mr-2"></i>
                    \${formattedDate}
                \`;
            } else {
                document.getElementById('intervention-date').innerHTML = \`
                    <i class="fa fa-clock mr-2"></i>
                    Date non spécifiée
                \`;
            }

            // Priority
            const priorities = {
                1: 'Faible',
                2: 'Normale', 
                3: 'Élevée',
                4: 'Urgente'
            };
            const priorityText = priorities[intervention.priority] || 'Normale';
            document.getElementById('intervention-priority').textContent = priorityText;

            // Status with appropriate styling
            updateStatusDisplay(intervention.status_name);

            // Update page title
            document.title = \`Intervention \${intervention.number} - \${intervention.title} - Astro-Tech\`;

            // Process images before intervention
            if (intervention.images_before && intervention.images_before.trim() !== '') {
                displayImagesBefore(intervention.images_before);
            }

            // Process images after intervention
            if (intervention.images_after && intervention.images_after.trim() !== '') {
                displayImagesAfter(intervention.images_after);
            }

            // Process quality checklist
            displayQualityChecklist(intervention.quality);

            // Process security checklist
            displaySecurityChecklist(intervention.security);

            // Process comments
            if (intervention.comments && intervention.comments.trim() !== '') {
                displayComments(intervention.comments);
            }

            // Process signature
            if (intervention.signature && intervention.signature.trim() !== '') {
                displaySignature(intervention.signature);
            }
        }

        // Display images before intervention
        function displayImagesBefore(imagesBefore) {
            console.log('displayImagesBefore called with:', imagesBefore);
            
            const container = document.getElementById('images-before-container');
            const section = document.getElementById('images-before-section');
            
            if (!imagesBefore || imagesBefore.trim() === '') {
                console.log('No images_before data');
                return;
            }
            
            const images = imagesBefore.split(';/').filter(img => img.trim() !== '');
            console.log('Parsed images:', images);
            
            if (images.length > 0) {
                let imagesHTML = '';
                images.forEach((imagePath, index) => {
                    if (imagePath.trim() !== '') {
                        // Use the old_Astro path structure
                        const displayPath = \`/astro-ges/\${imagePath.startsWith('/') ? imagePath.substring(1) : imagePath}\`;
                        console.log('Processing image:', imagePath, 'Display path:', displayPath);
                        
                        imagesHTML += \`
                            <div class="bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <img src="\${displayPath}" 
                                     alt="Photo avant intervention \${index + 1}" 
                                     class="w-full h-48 object-cover cursor-pointer"
                                     onclick="openImageModal('\${displayPath}', 'Photo avant intervention \${index + 1}')"
                                     onerror="this.parentElement.innerHTML='<div class=\\"flex items-center justify-center h-48 text-gray-400\\"><i class=\\"fa fa-image-slash text-2xl\\"></i></div>
                                <div class="p-2 text-center text-sm text-gray-600">
                                    Photo \${index + 1}
                                </div>
                            </div>
                        \`;
                    }
                });
                
                container.innerHTML = imagesHTML;
                section.style.display = 'block';
                console.log('Images section displayed');
            } else {
                console.log('No valid images found');
            }
        }

        // Display images after intervention
        function displayImagesAfter(imagesAfter) {
            const container = document.getElementById('images-after-container');
            const section = document.getElementById('images-after-section');
            
            if (!imagesAfter || imagesAfter.trim() === '') return;
            
            const images = imagesAfter.split(';/').filter(img => img.trim() !== '');
            
            if (images.length > 0) {
                let imagesHTML = '';
                images.forEach((imagePath, index) => {
                    if (imagePath.trim() !== '') {
                        // Use the old_Astro path structure
                        const displayPath = \`/astro-ges/\${imagePath.startsWith('/') ? imagePath.substring(1) : imagePath}\`;
                        imagesHTML += \`
                            <div class="bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <img src="\${displayPath}" 
                                     alt="Photo après intervention \${index + 1}" 
                                     class="w-full h-48 object-cover cursor-pointer"
                                     onclick="openImageModal('\${displayPath}', 'Photo après intervention \${index + 1}')"
                                     onerror="this.parentElement.innerHTML='<div class=\\"flex items-center justify-center h-48 text-gray-400\\"><i class=\\"fa fa-image-slash text-2xl\\"></i></div>
                                <div class="p-2 text-center text-sm text-gray-600">
                                    Photo \${index + 1}
                                </div>
                            </div>
                        \`;
                    }
                });
                
                container.innerHTML = imagesHTML;
                section.style.display = 'block';
            }
        }

        // Display quality checklist
        function displayQualityChecklist(qualityData) {
            console.log('displayQualityChecklist called with:', qualityData);
            
            const container = document.getElementById('quality-checklist');
            
            let qualityItems = [
                { key: 0, label: 'Ranger les outils', checked: false },
                { key: 1, label: 'Nettoyer le chantier', checked: false },
                { key: 2, label: 'Mise en pression des appareils sanitaires', checked: false }
            ];

            // Parse quality data - handle both semicolon format and JSON format
            if (qualityData && qualityData.trim() !== '') {
                try {
                    if (qualityData.includes(';')) {
                        // Handle semicolon-separated format: "1;1;0"
                        const values = qualityData.split(';');
                        qualityItems.forEach((item, index) => {
                            if (values[index] === '1') {
                                item.checked = true;
                            }
                        });
                    } else {
                        // Handle JSON format (fallback)
                        const parsed = JSON.parse(qualityData);
                        qualityItems.forEach(item => {
                            if (parsed[item.key] || parsed[\`item\${item.key}\`] || parsed.ranger_outils || parsed.nettoyer_chantier || parsed.mise_pression) {
                                item.checked = true;
                            }
                        });
                    }
                } catch (e) {
                    console.log('Error parsing quality data:', e);
                }
            }

            let qualityHTML = '';
            qualityItems.forEach(item => {
                const icon = item.checked ? 'fa-check-circle text-green-600' : 'fa-circle text-gray-400';
                qualityHTML += \`
                    <div class="flex items-center">
                        <i class="fa \${icon} mr-3"></i>
                        <span class="text-gray-700">\${item.label}</span>
                    </div>
                \`;
            });

            container.innerHTML = qualityHTML;
        }

        // Display security checklist
        function displaySecurityChecklist(securityData) {
            console.log('displaySecurityChecklist called with:', securityData);
            
            const container = document.getElementById('security-checklist');
            
            let securityItems = [
                { key: 0, label: 'Lire les pièces et informer son équipe', checked: false },
                { key: 1, label: 'Mettre les EPI', checked: false },
                { key: 2, label: 'Poser le matériel sur une protection', checked: false }
            ];

            // Parse security data - it's stored as "1;1;1" format in this case
            if (securityData) {
                try {
                    if (securityData.includes(';')) {
                        // Handle semicolon-separated format: "1;1;1" 
                        const values = securityData.split(';');
                        securityItems.forEach((item, index) => {
                            if (values[index] === '1') {
                                item.checked = true;
                            }
                        });
                    } else {
                        // Handle JSON format (fallback)
                        const parsed = JSON.parse(securityData);
                        securityItems.forEach(item => {
                            if (parsed[item.key] || parsed[\`item\${item.key}\`]) {
                                item.checked = true;
                            }
                        });
                    }
                } catch (e) {
                    console.log('Error parsing security data:', e);
                }
            }

            let securityHTML = '';
            securityItems.forEach(item => {
                const icon = item.checked ? 'fa-check-circle text-green-600' : 'fa-circle text-gray-400';
                securityHTML += \`
                    <div class="flex items-center">
                        <i class="fa \${icon} mr-3"></i>
                        <span class="text-gray-700">\${item.label}</span>
                    </div>
                \`;
            });

            container.innerHTML = securityHTML;
        }

        // Display comments
        function displayComments(comments) {
            console.log('displayComments called with:', comments);
            
            const container = document.getElementById('intervention-comments');
            const section = document.getElementById('comments-section');
            
            if (comments && comments.trim() !== '') {
                console.log('Displaying comments section');
                container.textContent = comments;
                section.style.display = 'block';
            } else {
                console.log('No comments to display');
            }
        }

        // Display signature
        function displaySignature(signature) {
            const container = document.getElementById('intervention-signature');
            const section = document.getElementById('signature-section');
            
            if (signature && signature.trim() !== '') {
                // Use the old_Astro path structure
                const signaturePath = \`/astro-ges/\${signature.startsWith('/') ? signature.substring(1) : signature}\`;
                container.src = signaturePath;
                container.onerror = function() {
                    section.style.display = 'none';
                };
                section.style.display = 'block';
            }
        }

        // Open image modal for full view
        function openImageModal(imagePath, altText) {
            // Create modal overlay
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
            modal.onclick = function() {
                document.body.removeChild(modal);
            };

            // Create modal content
            modal.innerHTML = \`
                <div class="max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
                    <div class="p-4 border-b flex justify-between items-center">
                        <h3 class="text-lg font-semibold">\${altText}</h3>
                        <button onclick="document.body.removeChild(this.closest('.fixed'))" class="text-gray-500 hover:text-gray-700">
                            <i class="fa fa-times text-xl"></i>
                        </button>
                    </div>
                    <div class="p-4">
                        <img src="\${imagePath}" alt="\${altText}" class="max-w-full h-auto">
                    </div>
                </div>
            \`;

            document.body.appendChild(modal);
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