// views/createIntervention.js - Completely rewritten create intervention page

function getCreateInterventionHTML() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle Intervention - Astro-Tech</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .upload-area {
            border: 2px dashed #d1d5db;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .upload-area:hover {
            border-color: #3b82f6;
            background-color: #f8fafc;
        }
        .upload-area.dragover {
            border-color: #3b82f6;
            background-color: #eff6ff;
        }
        .form-section {
            display: none;
        }
        .form-section.active {
            display: block;
        }
        .step-indicator {
            background: #e5e7eb;
            color: #6b7280;
            transition: all 0.3s ease;
        }
        .step-indicator.active {
            background: #3b82f6;
            color: white;
        }
        .step-indicator.completed {
            background: #10b981;
            color: white;
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
                        <span class="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                        Nouvelle Intervention
                    </h1>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Step Indicator -->
        <div class="mb-8">
            <div class="flex items-center justify-center space-x-4">
                <div class="flex items-center">
                    <div id="step-1-indicator" class="step-indicator active w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <span class="ml-2 text-sm font-medium text-gray-600">PDF Upload</span>
                </div>
                <div class="w-12 h-px bg-gray-300"></div>
                <div class="flex items-center">
                    <div id="step-2-indicator" class="step-indicator w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <span class="ml-2 text-sm font-medium text-gray-600">Détails</span>
                </div>
                <div class="w-12 h-px bg-gray-300"></div>
                <div class="flex items-center">
                    <div id="step-3-indicator" class="step-indicator w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                    <span class="ml-2 text-sm font-medium text-gray-600">Validation</span>
                </div>
            </div>
        </div>

        <!-- Step 1: PDF Upload -->
        <div id="step-1" class="form-section active">
            <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">
                    <i class="fas fa-file-pdf mr-2 text-red-500"></i>
                    Upload du Bon de Commande (Optionnel)
                </h2>
                <p class="text-gray-600 mb-6">
                    Uploadez le PDF du bon de commande pour pré-remplir automatiquement le formulaire, ou passez directement à l'étape suivante pour saisir manuellement.
                </p>
                
                <!-- Upload Area -->
                <div id="upload-area" class="upload-area p-8 text-center rounded-lg mb-6">
                    <div id="upload-content">
                        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                        <p class="text-lg font-medium text-gray-700 mb-2">Cliquez pour sélectionner un fichier PDF</p>
                        <p class="text-sm text-gray-500 mb-4">ou glissez-déposez votre fichier ici</p>
                        <p class="text-xs text-gray-400">Taille maximum: 10MB</p>
                    </div>
                    
                    <div id="upload-success" class="hidden">
                        <!-- Success content will be inserted here -->
                    </div>
                </div>
                
                <input type="file" id="pdf-file-input" accept=".pdf" class="hidden">
                
                <div class="text-center text-sm text-gray-500 mb-6">
                    <p><i class="fas fa-info-circle mr-1"></i>
                    L'upload PDF est optionnel et permet de pré-remplir le formulaire automatiquement.</p>
                </div>
                
                <div class="flex justify-between">
                    <button type="button" onclick="skipUpload()" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                        <i class="fas fa-forward mr-2"></i>Passer cette étape
                    </button>
                    <button type="button" onclick="nextStep()" id="next-step-1" class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Suivant <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Step 2: Form Details -->
        <div id="step-2" class="form-section">
            <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">
                    <i class="fas fa-edit mr-2 text-blue-500"></i>
                    Détails de l'Intervention
                </h2>
                
                <form id="intervention-form" class="space-y-6">
                    <!-- Row 1: Numéro, Titre -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Numéro <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="numero" name="numero" readonly
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                                   placeholder="Auto-généré">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Titre <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="titre" name="titre" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Titre de l'intervention">
                        </div>
                    </div>

                    <!-- Row 2: Statut, Type, Priorité -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Statut <span class="text-red-500">*</span>
                            </label>
                            <select id="statut" name="statut" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Sélectionner un statut</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Type <span class="text-red-500">*</span>
                            </label>
                            <select id="type" name="type" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Sélectionner un type</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Priorité <span class="text-red-500">*</span>
                            </label>
                            <select id="priorite" name="priorite" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Sélectionner une priorité</option>
                                <option value="Normale">Normale</option>
                                <option value="Importante">Importante</option>
                                <option value="Urgente">Urgente</option>
                            </select>
                        </div>
                    </div>

                    <!-- Row 3: Affaire, Client -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Affaire <span class="text-red-500">*</span>
                            </label>
                            <select id="affaire" name="affaire" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Sélectionner une affaire</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Client <span class="text-red-500">*</span>
                            </label>
                            <select id="client" name="client" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Sélectionner un client</option>
                            </select>
                        </div>
                    </div>

                    <!-- Row 4: Adresse, Ville -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Adresse <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="adresse" name="adresse" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Adresse complète">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Ville <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="ville" name="ville" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Ville">
                        </div>
                    </div>

                    <!-- Row 5: Immeuble, Etage, Appartement -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Immeuble</label>
                            <input type="text" id="immeuble" name="immeuble"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Nom de l'immeuble">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Étage</label>
                            <input type="text" id="etage" name="etage"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Numéro d'étage">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Appartement</label>
                            <input type="text" id="appartement" name="appartement"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Numéro d'appartement">
                        </div>
                    </div>

                    <!-- Row 6: Date, Heures -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Date <span class="text-red-500">*</span>
                            </label>
                            <input type="date" id="date" name="date" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Heure début</label>
                            <input type="time" id="heure_debut" name="heure_debut"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Heure fin</label>
                            <input type="time" id="heure_fin" name="heure_fin"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>

                    <!-- Row 7: Technicien -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Technicien <span class="text-red-500">*</span>
                        </label>
                        <select id="technicien" name="technicien" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Sélectionner un technicien</option>
                        </select>
                    </div>

                    <!-- Row 8: Description -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Description <span class="text-red-500">*</span>
                        </label>
                        <textarea id="description" name="description" required rows="4"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Description détaillée de l'intervention"></textarea>
                    </div>
                </form>
                
                <div class="flex justify-between mt-8">
                    <button type="button" onclick="prevStep()" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>Précédent
                    </button>
                    <button type="button" onclick="nextStep()" id="next-step-2" class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Suivant <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Step 3: Validation -->
        <div id="step-3" class="form-section">
            <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">
                    <i class="fas fa-check-circle mr-2 text-green-500"></i>
                    Validation et Création
                </h2>
                
                <div id="validation-summary" class="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 class="font-medium text-gray-900 mb-3">Résumé de l'intervention</h3>
                    <div id="summary-content">
                        <!-- Summary will be generated here -->
                    </div>
                </div>
                
                <div class="flex justify-between">
                    <button type="button" onclick="prevStep()" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>Précédent
                    </button>
                    <button type="button" onclick="createIntervention()" id="create-btn" class="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Créer l'Intervention
                    </button>
                </div>
            </div>
        </div>
    </main>

    <script src="/nodetest/js/createIntervention.js"></script>
</body>
</html>`;
}

module.exports = { getCreateInterventionHTML };