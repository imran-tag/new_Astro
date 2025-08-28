// public/js/createIntervention.js - Enhanced with Maintenance/Chantier Business Separation

console.log('Loading createIntervention.js with business separation');

// Global variables
let uploadedPDFFile = null;
let currentStep = 1;
const totalSteps = 3;

// NEW: Business selection state
let selectedStatus = null;
let selectedBusinessType = null;

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
    loadAllBusinesses(); // Load all businesses initially as fallback
    loadTechnicians();
    
    // Setup event listeners
    setupEventListeners();
    
    // Show first step
    showStep(1);
    
    console.log('Page initialization complete');
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // NEW: Status selection handler
    const statusSelect = document.getElementById('intervention-status');
    if (statusSelect) {
        statusSelect.addEventListener('change', handleStatusSelection);
        console.log('Status select listener added');
    }
    
    // NEW: Business type selection handler
    const businessTypeSelect = document.getElementById('business-type');
    if (businessTypeSelect) {
        businessTypeSelect.addEventListener('change', handleBusinessTypeSelection);
        console.log('Business type select listener added');
    }
    
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
            if (this.value && !isNaN(this.value)) {
                this.value = parseFloat(this.value).toFixed(2);
            }
        });
        console.log('Price input listener added');
    }
    
    // Upload area drag and drop
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handlePDFDragOver);
        uploadArea.addEventListener('dragleave', handlePDFDragLeave);
        uploadArea.addEventListener('drop', handlePDFDrop);
        console.log('Upload area listeners added');
    }
}

// ============================================
// NEW: BUSINESS SEPARATION LOGIC
// ============================================

function handleStatusSelection() {
    const statusSelect = document.getElementById('intervention-status');
    const businessTypeSelect = document.getElementById('business-type');
    const affaireSelect = document.getElementById('affaire');
    
    selectedStatus = statusSelect.value;
    
    console.log('Status selected:', selectedStatus);
    
    if (selectedStatus) {
        // Enable business type selection
        businessTypeSelect.disabled = false;
        businessTypeSelect.classList.remove('select-disabled');
        businessTypeSelect.value = '';
        
        // Reset business selection
        affaireSelect.value = '';
        affaireSelect.disabled = true;
        affaireSelect.classList.add('select-disabled');
        affaireSelect.innerHTML = '<option value="">D\'abord choisir le type...</option>';
        
        // Reset selected business type
        selectedBusinessType = null;
        
        console.log('Business type selector enabled');
    } else {
        // Disable subsequent selects
        businessTypeSelect.disabled = true;
        businessTypeSelect.classList.add('select-disabled');
        businessTypeSelect.value = '';
        
        affaireSelect.disabled = true;
        affaireSelect.classList.add('select-disabled');
        affaireSelect.innerHTML = '<option value="">D\'abord choisir le statut et le type...</option>';
        
        selectedBusinessType = null;
        
        console.log('Business type selector disabled');
    }
}

function handleBusinessTypeSelection() {
    const businessTypeSelect = document.getElementById('business-type');
    const affaireSelect = document.getElementById('affaire');
    
    selectedBusinessType = businessTypeSelect.value;
    
    console.log('Business type selected:', selectedBusinessType);
    
    if (selectedStatus && selectedBusinessType) {
        // Enable business selection and load filtered businesses
        affaireSelect.disabled = false;
        affaireSelect.classList.remove('select-disabled');
        
        // Load filtered businesses
        loadBusinessesByType(selectedStatus, selectedBusinessType);
        
        console.log('Loading filtered businesses for:', selectedStatus, selectedBusinessType);
    } else {
        // Disable business selection
        affaireSelect.disabled = true;
        affaireSelect.classList.add('select-disabled');
        affaireSelect.innerHTML = '<option value="">D\'abord choisir le type...</option>';
        
        console.log('Business selector disabled');
    }
}

async function loadBusinessesByType(status, businessType) {
    try {
        console.log('Loading businesses by type:', status, businessType);
        
        const response = await fetch('/nodetest/api/get-businesses-by-status-and-type', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status_uid: status === 'received' ? 1 : 2, // Adjust based on your status UIDs
                business_type: businessType,
                agency_uid: 1 // Get from session/token in real implementation
            })
        });
        
        const result = await response.json();
        console.log('Businesses by type response:', result);
        
        const affaireSelect = document.getElementById('affaire');
        if (affaireSelect && result.code === '1') {
            affaireSelect.innerHTML = '<option value="">Choisir une affaire...</option>';
            
            Object.entries(result.response).forEach(([key, value]) => {
                if (key !== '0') { // Skip default option
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = value; // Now includes number like "104 - Business Title"
                    affaireSelect.appendChild(option);
                }
            });
            
            console.log(`Loaded ${result.filtered_count || 'some'} ${businessType} businesses`);
            
            // Show success message
            if (result.filtered_count !== undefined) {
                showNotification(`${result.filtered_count} affaire(s) ${businessType} chargée(s)`, 'success');
            }
        } else {
            console.error('Failed to load businesses by type:', result);
            affaireSelect.innerHTML = '<option value="">Aucune affaire trouvée pour ce type</option>';
            showNotification('Aucune affaire trouvée pour ce type', 'warning');
        }
        
    } catch (error) {
        console.error('Error loading businesses by type:', error);
        const affaireSelect = document.getElementById('affaire');
        if (affaireSelect) {
            affaireSelect.innerHTML = '<option value="">Erreur de chargement</option>';
        }
        showNotification('Erreur lors du chargement des affaires', 'error');
    }
}

// ============================================
// STEP NAVIGATION
// ============================================

function nextStep() {
    console.log('Next step called, current:', currentStep);
    
    if (currentStep < totalSteps) {
        // Validate current step before proceeding
        if (validateCurrentStep()) {
            currentStep++;
            showStep(currentStep);
            
            // If moving to step 3, generate summary
            if (currentStep === 3) {
                generateSummary();
            }
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

function validateCurrentStep() {
    if (currentStep === 1) {
        // Step 1: PDF upload (optional)
        return true;
    } else if (currentStep === 2) {
        // Step 2: Form validation
        return validateForm();
    }
    return true;
}

// ============================================
// PDF UPLOAD HANDLING
// ============================================

function handlePDFFile(input) {
    if (input.files && input.files[0]) {
        handlePDFUpload(input.files[0]);
    }
}

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
    
    // Update UI to show uploaded file
    const uploadContent = document.getElementById('upload-content');
    const pdfPreview = document.getElementById('pdf-preview');
    const pdfName = document.getElementById('pdf-name');
    const pdfSize = document.getElementById('pdf-size');
    
    if (uploadContent && pdfPreview && pdfName && pdfSize) {
        uploadContent.innerHTML = `
            <i class="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
            <p class="text-green-600 mb-2 font-medium">PDF téléchargé avec succès!</p>
            <p class="text-sm text-gray-500">${file.name}</p>
        `;
        
        pdfPreview.classList.remove('hidden');
        pdfName.textContent = file.name;
        pdfSize.textContent = formatFileSize(file.size);
    }
    
    console.log('PDF upload handled successfully');
}

function removePDF() {
    uploadedPDFFile = null;
    
    const uploadContent = document.getElementById('upload-content');
    const pdfPreview = document.getElementById('pdf-preview');
    
    if (uploadContent) {
        uploadContent.innerHTML = `
            <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-600 mb-2">Cliquez ici ou glissez-déposez votre PDF</p>
            <p class="text-sm text-gray-500">Format accepté: PDF (Max 10MB)</p>
        `;
    }
    
    if (pdfPreview) {
        pdfPreview.classList.add('hidden');
    }
    
    // Reset file input
    const fileInput = document.getElementById('pdfFile');
    if (fileInput) {
        fileInput.value = '';
    }
    
    console.log('PDF removed');
}

function handlePDFDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handlePDFDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
}

function handlePDFDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        handlePDFUpload(files[0]);
    }
}

// ============================================
// DATA LOADING FUNCTIONS
// ============================================

async function loadInterventionNumber() {
    try {
        console.log('Loading intervention number...');
        
        const response = await fetch('/nodetest/api/intervention-number');
        const result = await response.json();
        
        console.log('Intervention number API response:', result);
        
        const numeroInput = document.getElementById('numero');
        if (numeroInput) {
            // Check different possible response formats
            let number = null;
            
            if (result.success && result.number) {
                number = result.number;
            } else if (result.number) {
                number = result.number;
            } else if (typeof result === 'string') {
                number = result;
            }
            
            if (number) {
                numeroInput.value = number;
                console.log('Intervention number loaded:', number);
            } else {
                // Fallback: generate a simple number
                const fallbackNumber = Date.now().toString().slice(-4);
                numeroInput.value = fallbackNumber;
                console.warn('Using fallback number:', fallbackNumber);
            }
        }
    } catch (error) {
        console.error('Error loading intervention number:', error);
        // Fallback: generate a simple number
        const numeroInput = document.getElementById('numero');
        if (numeroInput) {
            const fallbackNumber = Date.now().toString().slice(-4);
            numeroInput.value = fallbackNumber;
            console.log('Using fallback number due to error:', fallbackNumber);
        }
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

async function loadAllBusinesses() {
    try {
        console.log('Loading all businesses (fallback)...');
        
        const response = await fetch('/nodetest/api/businesses');
        const result = await response.json();
        
        const affaireSelect = document.getElementById('affaire');
        if (affaireSelect && result.code === '1') {
            // Don't populate by default - wait for user selection
            // This is just for fallback/testing
            console.log('All businesses available:', Object.keys(result.response).length - 1);
        }
    } catch (error) {
        console.error('Error loading all businesses:', error);
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
    
    // Updated required fields - REMOVED 'numero' since it's auto-generated and readonly
    const requiredFields = [
        { id: 'titre', name: 'Titre' },
        { id: 'intervention-status', name: 'Statut intervention' },
        { id: 'business-type', name: 'Type d\'affaire' },
        { id: 'statut', name: 'Statut' },
        { id: 'type', name: 'Type' },
        { id: 'priorite', name: 'Priorité' },
        { id: 'affaire', name: 'Affaire' },
        { id: 'client', name: 'Client' },
        { id: 'adresse', name: 'Adresse' },
        { id: 'ville', name: 'Ville' },
        { id: 'description', name: 'Description' }
    ];
    
    let isValid = true;
    let firstErrorField = null;
    
    // Special check for numero field - ensure it has a value
    const numeroField = document.getElementById('numero');
    if (numeroField && (!numeroField.value || numeroField.value.trim() === '' || numeroField.value === 'Auto-généré')) {
        console.log('Numero field is empty, attempting to reload...');
        loadInterventionNumber(); // Try to reload the number
        
        // Give it a fallback value if still empty
        if (!numeroField.value || numeroField.value === 'Auto-généré') {
            const fallbackNumber = Date.now().toString().slice(-4);
            numeroField.value = fallbackNumber;
            console.log('Set fallback numero:', fallbackNumber);
        }
    }
    
    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element) {
            console.warn(`Field ${field.id} not found`);
            continue;
        }
        
        // Remove previous error styling
        element.classList.remove('border-red-500', 'bg-red-50');
        
        if (!element.value || element.value.trim() === '') {
            // Add error styling
            element.classList.add('border-red-500', 'bg-red-50');
            
            if (!firstErrorField) {
                firstErrorField = element;
            }
            
            isValid = false;
            console.log(`Validation failed for field: ${field.name}`);
        }
    }
    
    if (!isValid) {
        alert('Veuillez remplir tous les champs obligatoires marqués d\'un *');
        
        // Focus first error field and scroll to it
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    console.log('Form validation result:', isValid);
    return isValid;
}

// ============================================
// SUMMARY GENERATION
// ============================================

function generateSummary() {
    console.log('Generating summary...');
    
    const summaryContent = document.getElementById('summary-content');
    if (!summaryContent) return;
    
    const fields = [
        { id: 'numero', label: 'Numéro' },
        { id: 'titre', label: 'Titre' },
        { id: 'intervention-status', label: 'Statut intervention', getText: true },
        { id: 'business-type', label: 'Type d\'affaire', getText: true },
        { id: 'statut', label: 'Statut', getText: true },
        { id: 'type', label: 'Type', getText: true },
        { id: 'priorite', label: 'Priorité', getText: true },
        { id: 'affaire', label: 'Affaire', getText: true },
        { id: 'client', label: 'Client', getText: true },
        { id: 'technicien', label: 'Technicien', getText: true, optional: true },
        { id: 'prix', label: 'Prix', formatter: value => value ? `${parseFloat(value).toFixed(2)} €` : 'Non spécifié', optional: true },
        { id: 'adresse', label: 'Adresse' },
        { id: 'ville', label: 'Ville' },
        { id: 'immeuble', label: 'Immeuble', optional: true },
        { id: 'etage', label: 'Étage', optional: true },
        { id: 'appartement', label: 'Appartement', optional: true },
        { id: 'date', label: 'Date', optional: true },
        { id: 'heure_debut', label: 'Heure début', optional: true },
        { id: 'heure_fin', label: 'Heure fin', optional: true },
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
            
            // Show fields with values OR show optional fields as "Non spécifié"
            if (value && value.trim() !== '') {
                summaryHTML += `
                    <div class="flex justify-between py-2 border-b border-gray-200">
                        <span class="font-medium text-gray-600">${field.label}:</span>
                        <span class="text-gray-900">${value}</span>
                    </div>
                `;
            } else if (field.optional) {
                summaryHTML += `
                    <div class="flex justify-between py-2 border-b border-gray-200">
                        <span class="font-medium text-gray-600">${field.label}:</span>
                        <span class="text-gray-500 italic">Non spécifié</span>
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
    const originalText = createBtn ? createBtn.textContent : '';
    
    try {
        // Disable button and show loading state
        if (createBtn) {
            createBtn.textContent = 'Création en cours...';
            createBtn.disabled = true;
        }
        
        // Collect form data
        const formData = new FormData();
        
        // Basic fields
        formData.append('numero', document.getElementById('numero').value);
        formData.append('titre', document.getElementById('titre').value);
        formData.append('intervention_status', document.getElementById('intervention-status').value);
        formData.append('business_type', document.getElementById('business-type').value);
        formData.append('statut', document.getElementById('statut').value);
        formData.append('type', document.getElementById('type').value);
        formData.append('priorite', document.getElementById('priorite').value);
        formData.append('affaire', document.getElementById('affaire').value);
        formData.append('client', document.getElementById('client').value);
        formData.append('technicien', document.getElementById('technicien').value);
        formData.append('prix', document.getElementById('prix').value);
        formData.append('adresse', document.getElementById('adresse').value);
        formData.append('ville', document.getElementById('ville').value);
        formData.append('immeuble', document.getElementById('immeuble').value);
        formData.append('etage', document.getElementById('etage').value);
        formData.append('appartement', document.getElementById('appartement').value);
        formData.append('date', document.getElementById('date').value);
        formData.append('heure_debut', document.getElementById('heure_debut').value);
        formData.append('heure_fin', document.getElementById('heure_fin').value);
        formData.append('description', document.getElementById('description').value);
        
        // Add PDF file if uploaded
        if (uploadedPDFFile) {
            formData.append('pdf', uploadedPDFFile);
        }
        
        console.log('Form data prepared, sending request...');
        
        const response = await fetch('/nodetest/api/create-intervention', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        console.log('Create intervention response:', result);
        
        if (result.success) {
            alert('Intervention créée avec succès!');
            window.location.href = '/nodetest'; // Redirect to dashboard
        } else {
            console.error('Create error:', result);
            alert('Erreur lors de la création: ' + (result.message || result.error || 'Erreur inconnue'));
        }
        
    } catch (error) {
        console.error('Error creating intervention:', error);
        alert('Erreur lors de la création de l\'intervention: ' + error.message);
    } finally {
        // Reset button state
        if (createBtn) {
            createBtn.textContent = originalText;
            createBtn.disabled = false;
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    const icon = type === 'success' ? 'fa-check-circle' :
                type === 'warning' ? 'fa-exclamation-triangle' :
                type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle';
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icon} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// ============================================
// GLOBAL EXPORTS
// ============================================

// Make functions available globally for onclick handlers
window.nextStep = nextStep;
window.prevStep = prevStep;
window.removePDF = removePDF;
window.handlePDFFile = handlePDFFile;
window.createIntervention = createIntervention;
window.loadClientsForBusiness = loadClientsForBusiness;

console.log('createIntervention.js loaded successfully with business separation');