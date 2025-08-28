// views/createIntervention.js - Enhanced with Maintenance/Chantier Business Separation

function getCreateInterventionHTML() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle Intervention - Astro</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <style>
        .upload-area {
            border: 2px dashed #d1d5db;
            transition: all 0.3s ease;
        }
        
        .upload-area:hover {
            border-color: #3b82f6;
            background-color: #eff6ff;
        }
        
        .upload-area.dragover {
            border-color: #2563eb;
            background-color: #dbeafe;
        }
        
        .form-section {
            display: none;
        }
        
        .form-section.active {
            display: block;
        }
        
        .step-indicator {
            display: flex;
            justify-content: center;
            margin-bottom: 2rem;
        }
        
        .step {
            display: flex;
            align-items: center;
        }
        
        .step-number {
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 0.5rem;
        }
        
        .step-number.active {
            background-color: #3b82f6;
            color: white;
        }
        
        .step-number.inactive {
            background-color: #e5e7eb;
            color: #6b7280;
        }
        
        .step-number.completed {
            background-color: #10b981;
            color: white;
        }
        
        .step-line {
            width: 3rem;
            height: 2px;
            background-color: #e5e7eb;
            margin: 0 1rem;
        }
        
        .step-line.completed {
            background-color: #10b981;
        }
        
        /* Progressive selection styling */
        .select-disabled {
            background-color: #f3f4f6;
            color: #9ca3af;
            cursor: not-allowed;
        }
        
        .business-type-info {
            background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
            border-left: 4px solid #2196f3;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <main class="container mx-auto px-4 py-8 max-w-4xl">
        
        <!-- Page Header -->
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
                <i class="fas fa-plus-circle mr-3 text-blue-600"></i>
                Nouvelle Intervention
            </h1>
            <p class="text-gray-600">Créez une nouvelle intervention en suivant les étapes ci-dessous</p>
        </div>

        <!-- Step Indicator -->
        <div class="step-indicator mb-8">
            <div class="step">
                <div id="step-1-indicator" class="step-number active">1</div>
                <span class="text-sm text-gray-600">Upload PDF</span>
            </div>
            <div class="step-line" id="line-1"></div>
            <div class="step">
                <div id="step-2-indicator" class="step-number inactive">2</div>
                <span class="text-sm text-gray-600">Détails</span>
            </div>
            <div class="step-line" id="line-2"></div>
            <div class="step">
                <div id="step-3-indicator" class="step-number inactive">3</div>
                <span class="text-sm text-gray-600">Validation</span>
            </div>
        </div>

        <!-- Step 1: PDF Upload -->
        <div id="step-1" class="form-section active">
            <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">
                    <i class="fas fa-file-pdf mr-2 text-red-500"></i>
                    Upload PDF (Optionnel)
                </h2>
                
                <p class="text-gray-600 mb-6">
                    Téléchargez le PDF du Bon de commande et remplissez le formulaire d'intervention.
                </p>
                
                <div class="upload-area rounded-lg p-8 text-center cursor-pointer mb-6" 
                     onclick="document.getElementById('pdfFile').click()"
                     ondrop="handlePDFDrop(event)"
                     ondragover="handlePDFDragOver(event)"
                     ondragleave="handlePDFDragLeave(event)">
                    
                    <div id="upload-content">
                        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-600 mb-2">Cliquez ici ou glissez-déposez votre PDF</p>
                        <p class="text-sm text-gray-500">Format accepté: PDF (Max 10MB)</p>
                    </div>
                    
                    <input type="file" id="pdfFile" name="pdfFile" accept=".pdf" 
                           onchange="handlePDFFile(this)" class="hidden">
                </div>
                
                <div id="pdf-preview" class="hidden bg-gray-50 rounded-lg p-4 mb-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <i class="fas fa-file-pdf text-red-500 text-2xl mr-3"></i>
                            <div>
                                <p class="font-medium text-gray-900" id="pdf-name"></p>
                                <p class="text-sm text-gray-500" id="pdf-size"></p>
                            </div>
                        </div>
                        <button type="button" onclick="removePDF()" 
                                class="text-red-500 hover:text-red-700 transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex justify-end">
                    <button type="button" onclick="nextStep()" id="next-step-1" 
                            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Suivant <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Step 2: Intervention Details -->
        <div id="step-2" class="form-section">
            <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">
                    <i class="fas fa-edit mr-2 text-blue-600"></i>
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

                    <!-- NEW: Status and Business Type Selection -->
                    <div class="business-type-info rounded-lg p-4 mb-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">
                            <i class="fas fa-filter mr-2"></i>
                            Sélection des Affaires
                        </h3>
                        <p class="text-sm text-gray-600 mb-4">
                            Choisissez d'abord le statut puis le type d'affaire pour filtrer la liste des affaires disponibles.
                        </p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Status Selection -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    1. Statut <span class="text-red-500">*</span>
                                </label>
                                <select id="intervention-status" name="intervention-status" required
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Choisir un statut...</option>
                                    <option value="received">📥 Reçus</option>
                                    <option value="assigned">📋 Assigné</option>
                                </select>
                                <p class="text-xs text-gray-500 mt-1">Étape 1: Sélectionnez le statut de l'intervention</p>
                            </div>
                            
                            <!-- Business Type Selection -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    2. Type d'affaire <span class="text-red-500">*</span>
                                </label>
                                <select id="business-type" name="business-type" required disabled
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 select-disabled">
                                    <option value="">Choisir un type...</option>
                                    <option value="maintenance">🔧 Maintenance (104, 123, 139, 140, 161)</option>
                                    <option value="chantier">🏗️ Chantiers (144, 146, 150+)</option>
                                </select>
                                <p class="text-xs text-gray-500 mt-1">Étape 2: Sélectionnez le type d'affaire</p>
                            </div>
                        </div>
                    </div>

                    <!-- Row 2: Statut, Type, Priorité -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Statut intervention <span class="text-red-500">*</span>
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
                                <option value="Normale">⚪ Normale</option>
                                <option value="Importante">🟡 Importante</option>
                                <option value="Urgente">🔴 Urgente</option>
                            </select>
                        </div>
                    </div>

                    <!-- Row 3: Affaire (Business), Client, Prix -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                3. Affaire <span class="text-red-500">*</span>
                            </label>
                            <select id="affaire" name="affaire" required disabled
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 select-disabled">
                                <option value="">D'abord choisir le statut et le type...</option>
                            </select>
                            <p class="text-xs text-gray-500 mt-1">Étape 3: Liste filtrée selon vos choix précédents</p>
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
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Prix (€)
                            </label>
                            <input type="number" id="prix" name="prix" step="0.01" min="0"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="0.00">
                        </div>
                    </div>

                    <!-- Row 4: Technicien -->
                    <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Technicien 
                            </label>
                            <select id="technicien" name="technicien" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Sélectionner un technicien</option>
                            </select>
                        </div>
                    </div>

                    <!-- Row 5: Adresse, Ville -->
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

                    <!-- Row 6: Immeuble, Étage, Appartement -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Immeuble
                            </label>
                            <input type="text" id="immeuble" name="immeuble"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Nom/Numéro immeuble">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Étage
                            </label>
                            <input type="text" id="etage" name="etage"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Étage">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Appartement
                            </label>
                            <input type="text" id="appartement" name="appartement"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Numéro appartement">
                        </div>
                    </div>

                    <!-- Row 7: Date, Heure début, Heure fin -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Date
                            </label>
                            <input type="date" id="date" name="date"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Heure début
                            </label>
                            <input type="time" id="heure_debut" name="heure_debut"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Heure fin
                            </label>
                            <input type="time" id="heure_fin" name="heure_fin"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>

                    <!-- Row 8: Description -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Description <span class="text-red-500">*</span>
                        </label>
                        <textarea id="description" name="description" required rows="4"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Description détaillée de l'intervention à effectuer..."></textarea>
                    </div>
                </form>
                
                <div class="flex justify-between mt-6">
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