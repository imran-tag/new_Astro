// public/js/createIntervention.js - Enhanced with Price field support

console.log('Loading createIntervention.js');

// Global variables
let uploadedPDFFile = null;
let currentStep = 1;
const totalSteps = 3;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Create Intervention page loaded');
    initializePage();
});

function initializePage() {
    console.log('Initializing page...');
    
    // Load dropdown data
    loadInterventionNumber();
    loadInterventionStatuses();
    loadInterventionTypes();
    loadBusinesses();
    loadTechnicians();
    
    // Setup event listeners
    setupEventListeners();
    
    // Set default date to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    // Show first step
    showStep(1);
    
    console.log('Page initialization complete');
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Business selection change
    const affaireSelect = document.getElementById('affaire');
    if (affaireSelect) {
        affaireSelect.addEventListener('change', loadClientsForBusiness);
        console.log('Business select listener added');
    }
    
    // Price field formatting
    const priceInput = document.getElementById('prix');
    if (priceInput) {
        priceInput.addEventListener('blur', function() {
            // Format price on blur (when user leaves the field)
            if (this.value && !isNaN(this.value)) {
                this.value = parseFloat(this.value).toFixed(2);
            }
        });
        console.log('Price input listener added');
    }
    
    // Upload area click
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('pdf-file-input');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                handlePDFUpload(e.target.files[0]);
            }
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handlePDFUpload(e.dataTransfer.files[0]);
            }
        });
        
        console.log('Upload listeners added');
    }
}

// ============================================
// STEP NAVIGATION
// ============================================

function nextStep() {
    console.log('Next step called, current:', currentStep);
    
    if (currentStep < totalSteps) {
        // Validate current step
        if (currentStep === 2 && !validateForm()) {
            return;
        }
        
        currentStep++;
        showStep(currentStep);
        
        // Generate summary if moving to step 3
        if (currentStep === 3) {
            generateSummary();
        }
    }
}

function prevStep() {
    console.log('Previous step called, current:', currentStep);
    
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

function showStep(step) {
    console.log('Showing step:', step);
    
    // Hide all steps
    for (let i = 1; i <= totalSteps; i++) {
        const stepElement = document.getElementById(`step-${i}`);
        if (stepElement) {
            stepElement.classList.remove('active');
        }
    }
    
    // Show current step
    const currentStepElement = document.getElementById(`step-${step}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    // Update indicators
    updateStepIndicators(step);
}

function updateStepIndicators(step) {
    for (let i = 1; i <= totalSteps; i++) {
        const indicator = document.getElementById(`step-${i}-indicator`);
        const line = document.getElementById(`line-${i}`);
        
        if (indicator) {
            indicator.classList.remove('active', 'completed', 'inactive');
            
            if (i === step) {
                indicator.classList.add('active');
            } else if (i < step) {
                indicator.classList.add('completed');
            } else {
                indicator.classList.add('inactive');
            }
        }
        
        if (line && i < totalSteps) {
            line.classList.toggle('completed', i < step);
        }
    }
}

function skipUpload() {
    console.log('Skipping upload step');
    nextStep();
}

// ============================================
// PDF UPLOAD HANDLING
// ============================================

function handlePDFUpload(file) {
    console.log('Handling PDF upload:', file.name);
    
    if (file.type !== 'application/pdf') {
        alert('Veuillez sélectionner un fichier PDF.');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Le fichier est trop volumineux. Taille maximum: 10MB.');
        return;
    }
    
    uploadedPDFFile = file;
    
    // Show success state
    const uploadContent = document.getElementById('upload-content');
    const uploadSuccess = document.getElementById('upload-success');
    
    if (uploadContent && uploadSuccess) {
        uploadContent.classList.add('hidden');
        uploadSuccess.classList.remove('hidden');
        uploadSuccess.innerHTML = `
            <div class="text-center">
                <i class="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
                <p class="text-lg font-medium text-green-700 mb-2">PDF téléchargé avec succès!</p>
                <p class="text-sm text-gray-600 mb-4">${file.name}</p>
                <button type="button" onclick="resetUpload()" class="text-blue-600 hover:text-blue-800 text-sm">
                    <i class="fas fa-times mr-1"></i>Supprimer
                </button>
            </div>
        `;
    }
    
    console.log('PDF upload handled successfully');
}

function resetUpload() {
    uploadedPDFFile = null;
    
    const uploadContent = document.getElementById('upload-content');
    const uploadSuccess = document.getElementById('upload-success');
    
    if (uploadContent && uploadSuccess) {
        uploadContent.classList.remove('hidden');
        uploadSuccess.classList.add('hidden');
    }
    
    // Reset file input
    const fileInput = document.getElementById('pdf-file-input');
    if (fileInput) {
        fileInput.value = '';
    }
    
    console.log('Upload reset');
}

// ============================================
// DATA LOADING FUNCTIONS
// ============================================

async function loadInterventionNumber() {
    try {
        const response = await fetch('/nodetest/api/intervention-number');
        const data = await response.json();
        
        const numeroInput = document.getElementById('numero');
        if (numeroInput && data.nextNumber) {
            numeroInput.value = data.nextNumber;
            console.log('Intervention number loaded:', data.nextNumber);
        }
    } catch (error) {
        console.error('Error loading intervention number:', error);
    }
}

async function loadInterventionStatuses() {
    try {
        const response = await fetch('/nodetest/api/intervention-statuses');
        const statuses = await response.json();
        
        const statutSelect = document.getElementById('statut');
        if (statutSelect && Array.isArray(statuses)) {
            statuses.forEach(status => {
                const option = document.createElement('option');
                option.value = status.uid;
                option.textContent = status.name;
                statutSelect.appendChild(option);
            });
            console.log('Intervention statuses loaded:', statuses.length);
        }
    } catch (error) {
        console.error('Error loading intervention statuses:', error);
    }
}

async function loadInterventionTypes() {
    try {
        const response = await fetch('/nodetest/api/intervention-types');
        const types = await response.json();
        
        const typeSelect = document.getElementById('type');
        if (typeSelect && Array.isArray(types)) {
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.uid;
                option.textContent = type.name;
                typeSelect.appendChild(option);
            });
            console.log('Intervention types loaded:', types.length);
        }
    } catch (error) {
        console.error('Error loading intervention types:', error);
    }
}

async function loadBusinesses() {
    try {
        const response = await fetch('/nodetest/api/businesses');
        const businesses = await response.json();
        
        const affaireSelect = document.getElementById('affaire');
        if (affaireSelect && Array.isArray(businesses)) {
            businesses.forEach(business => {
                const option = document.createElement('option');
                option.value = business.uid;
                option.textContent = business.name;
                affaireSelect.appendChild(option);
            });
            console.log('Businesses loaded:', businesses.length);
        }
    } catch (error) {
        console.error('Error loading businesses:', error);
    }
}

async function loadTechnicians() {
    try {
        const response = await fetch('/nodetest/api/technicians');
        const technicians = await response.json();
        
        const technicienSelect = document.getElementById('technicien');
        if (technicienSelect && Array.isArray(technicians)) {
            technicians.forEach(tech => {
                const option = document.createElement('option');
                option.value = tech.uid;
                option.textContent = tech.name;
                technicienSelect.appendChild(option);
            });
            console.log('Technicians loaded:', technicians.length);
        }
    } catch (error) {
        console.error('Error loading technicians:', error);
    }
}

async function loadClientsForBusiness() {
    const affaireSelect = document.getElementById('affaire');
    const clientSelect = document.getElementById('client');
    
    if (!affaireSelect || !clientSelect) return;
    
    const businessUid = affaireSelect.value;
    
    // Clear existing clients
    clientSelect.innerHTML = '<option value="">Sélectionner un client</option>';
    
    if (!businessUid) {
        console.log('No business selected, cleared clients');
        return;
    }
    
    try {
        const response = await fetch(`/nodetest/api/clients?business_uid=${businessUid}`);
        const clients = await response.json();
        
        if (Array.isArray(clients)) {
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.uid;
                option.textContent = client.name;
                clientSelect.appendChild(option);
            });
            console.log('Clients loaded for business:', clients.length);
        }
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

// ============================================
// FORM VALIDATION
// ============================================

function validateForm() {
    console.log('Validating form...');
    
    const requiredFields = [
        { id: 'numero', name: 'Numéro' },
        { id: 'titre', name: 'Titre' },
        { id: 'statut', name: 'Statut' },
        { id: 'type', name: 'Type' },
        { id: 'priorite', name: 'Priorité' },
        { id: 'affaire', name: 'Affaire' },
        { id: 'client', name: 'Client' },
        { id: 'technicien', name: 'Technicien' },
        { id: 'adresse', name: 'Adresse' },
        { id: 'ville', name: 'Ville' },
        { id: 'date', name: 'Date' },
        { id: 'description', name: 'Description' }
    ];
    
    const errors = [];
    
    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element || !element.value || element.value.trim() === '') {
            errors.push(field.name);
        }
    }
    
    // Validate price field (if provided, must be valid)
    const priceInput = document.getElementById('prix');
    if (priceInput && priceInput.value && priceInput.value.trim() !== '') {
        const priceValue = parseFloat(priceInput.value);
        if (isNaN(priceValue) || priceValue < 0) {
            errors.push('Prix (doit être un nombre positif)');
        }
    }
    
    if (errors.length > 0) {
        alert('Les champs suivants sont obligatoires ou invalides:\n' + errors.join('\n'));
        return false;
    }
    
    console.log('Form validation passed');
    return true;
}

function generateSummary() {
    console.log('Generating summary...');
    
    const summaryContent = document.getElementById('summary-content');
    if (!summaryContent) return;
    
    const fields = [
        { id: 'numero', label: 'Numéro' },
        { id: 'titre', label: 'Titre' },
        { id: 'statut', label: 'Statut', getText: true },
        { id: 'type', label: 'Type', getText: true },
        { id: 'priorite', label: 'Priorité' },
        { id: 'affaire', label: 'Affaire', getText: true },
        { id: 'client', label: 'Client', getText: true },
        { id: 'technicien', label: 'Technicien', getText: true },
        { id: 'prix', label: 'Prix', formatter: (value) => value ? `${parseFloat(value).toFixed(2)} €` : 'Non spécifié' },
        { id: 'adresse', label: 'Adresse' },
        { id: 'ville', label: 'Ville' },
        { id: 'immeuble', label: 'Immeuble' },
        { id: 'etage', label: 'Étage' },
        { id: 'appartement', label: 'Appartement' },
        { id: 'date', label: 'Date' },
        { id: 'heure_debut', label: 'Heure début' },
        { id: 'heure_fin', label: 'Heure fin' },
        { id: 'description', label: 'Description' }
    ];
    
    let summaryHTML = '<div class="space-y-3">';
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            let value = '';
            
            if (field.getText && element.selectedOptions && element.selectedOptions[0]) {
                value = element.selectedOptions[0].text;
            } else {
                value = element.value || '';
            }
            
            // Apply custom formatter if provided
            if (field.formatter) {
                value = field.formatter(value);
            }
            
            // Only show fields with values (except price which we want to show even if empty)
            if (value || field.id === 'prix') {
                summaryHTML += `
                    <div class="flex justify-between py-2 border-b border-gray-200">
                        <span class="font-medium text-gray-600">${field.label}:</span>
                        <span class="text-gray-900">${value}</span>
                    </div>
                `;
            }
        }
    });
    
    if (uploadedPDFFile) {
        summaryHTML += `
            <div class="flex justify-between py-2 border-b border-gray-200">
                <span class="font-medium text-gray-600">PDF:</span>
                <span class="text-gray-900">${uploadedPDFFile.name}</span>
            </div>
        `;
    }
    
    summaryHTML += '</div>';
    summaryContent.innerHTML = summaryHTML;
}

// ============================================
// FORM SUBMISSION
// ============================================

async function createIntervention() {
    console.log('Creating intervention...');
    
    // Final validation
    if (!validateForm()) {
        return;
    }
    
    const createBtn = document.getElementById('create-btn');
    const originalText = createBtn ? createBtn.textContent : 'Créer l\'Intervention';
    
    try {
        // Show loading state
        if (createBtn) {
            createBtn.textContent = 'Création en cours...';
            createBtn.disabled = true;
        }
        
        // Collect form data as JSON object
        const formData = {};
        
        // Add all form fields (including prix)
        const formFields = [
            'numero', 'titre', 'statut', 'type', 'priorite', 'affaire', 'client',
            'technicien', 'prix', 'adresse', 'ville', 'immeuble', 'etage', 'appartement',
            'date', 'heure_debut', 'heure_fin', 'description'
        ];
        
        formFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                formData[field] = element.value || '';
                console.log(`Added ${field}:`, formData[field]);
            }
        });
        
        // Convert prix to proper number format
        if (formData.prix) {
            formData.prix = parseFloat(formData.prix) || 0;
        } else {
            formData.prix = 0;
        }
        
        // Add PDF file info if uploaded (we'll handle file upload separately for now)
        if (uploadedPDFFile) {
            formData.has_pdf = true;
            formData.pdf_name = uploadedPDFFile.name;
            console.log('PDF file noted:', uploadedPDFFile.name);
        } else {
            formData.has_pdf = false;
        }
        
        console.log('Form data to submit:', formData);
        
        // Submit to API as JSON
        console.log('Submitting to API...');
        const response = await fetch('/nodetest/api/create-intervention', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        console.log('API response:', result);
        
        if (response.ok && result.success) {
            alert('Intervention créée avec succès!');
            window.location.href = '/nodetest/interventions';
        } else {
            const errorMessage = result.message || result.error || 'Erreur lors de la création';
            alert(errorMessage);
            console.error('Create error:', result);
        }
        
    } catch (error) {
        console.error('Error creating intervention:', error);
        alert('Erreur de connexion');
    } finally {
        // Reset button
        if (createBtn) {
            createBtn.textContent = originalText;
            createBtn.disabled = false;
        }
    }
}

// ============================================
// GLOBAL EXPORTS
// ============================================

// Make functions available globally for onclick handlers
window.nextStep = nextStep;
window.prevStep = prevStep;
window.skipUpload = skipUpload;
window.resetUpload = resetUpload;
window.createIntervention = createIntervention;
window.loadClientsForBusiness = loadClientsForBusiness;

console.log('createIntervention.js loaded successfully');