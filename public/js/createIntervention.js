// public/js/createIntervention.js - Completely rewritten and simplified

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
        if (indicator) {
            indicator.classList.remove('active', 'completed');
            
            if (i === step) {
                indicator.classList.add('active');
            } else if (i < step) {
                indicator.classList.add('completed');
            }
        }
    }
}

function skipUpload() {
    console.log('Skipping PDF upload');
    nextStep();
}

// ============================================
// PDF UPLOAD
// ============================================

function handlePDFUpload(file) {
    console.log('Handling PDF upload:', file.name);
    
    // Validate file
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Veuillez sélectionner un fichier PDF');
        return;
    }
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (maximum 10MB)');
        return;
    }
    
    // Store file
    uploadedPDFFile = file;
    
    // Update UI
    const uploadContent = document.getElementById('upload-content');
    const uploadSuccess = document.getElementById('upload-success');
    
    if (uploadContent && uploadSuccess) {
        uploadContent.style.display = 'none';
        uploadSuccess.style.display = 'block';
        
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        uploadSuccess.innerHTML = `
            <i class="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
            <p class="text-lg font-medium text-gray-900">PDF téléchargé avec succès</p>
            <p class="text-sm text-gray-600 mt-2">${file.name}</p>
            <p class="text-xs text-gray-500">Taille: ${fileSize} MB</p>
            <button type="button" onclick="resetUpload()" class="mt-4 text-blue-600 hover:text-blue-700 underline">
                Changer de fichier
            </button>
        `;
        
        console.log('PDF upload successful');
    }
}

function resetUpload() {
    console.log('Resetting upload');
    
    uploadedPDFFile = null;
    
    const uploadContent = document.getElementById('upload-content');
    const uploadSuccess = document.getElementById('upload-success');
    const fileInput = document.getElementById('pdf-file-input');
    
    if (uploadContent && uploadSuccess) {
        uploadContent.style.display = 'block';
        uploadSuccess.style.display = 'none';
    }
    
    if (fileInput) {
        fileInput.value = '';
    }
}

// ============================================
// API CALLS
// ============================================

async function loadInterventionNumber() {
    try {
        console.log('Loading intervention number...');
        const response = await fetch('/nodetest/api/intervention-number');
        if (response.ok) {
            const data = await response.json();
            const numeroInput = document.getElementById('numero');
            if (numeroInput) {
                numeroInput.value = data.number;
                console.log('Intervention number loaded:', data.number);
            }
        }
    } catch (error) {
        console.error('Error loading intervention number:', error);
    }
}

async function loadInterventionStatuses() {
    try {
        console.log('Loading statuses...');
        const response = await fetch('/nodetest/api/intervention-statuses');
        if (response.ok) {
            const statuses = await response.json();
            const select = document.getElementById('statut');
            if (select) {
                statuses.forEach(status => {
                    const option = document.createElement('option');
                    option.value = status.uid;
                    option.textContent = status.name;
                    select.appendChild(option);
                });
                console.log('Loaded', statuses.length, 'statuses');
            }
        }
    } catch (error) {
        console.error('Error loading statuses:', error);
    }
}

async function loadInterventionTypes() {
    try {
        console.log('Loading types...');
        const response = await fetch('/nodetest/api/intervention-types');
        if (response.ok) {
            const types = await response.json();
            const select = document.getElementById('type');
            if (select) {
                types.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type.uid;
                    option.textContent = type.name;
                    select.appendChild(option);
                });
                console.log('Loaded', types.length, 'types');
            }
        }
    } catch (error) {
        console.error('Error loading types:', error);
    }
}

async function loadBusinesses() {
    try {
        console.log('Loading businesses...');
        const response = await fetch('/nodetest/api/businesses');
        if (response.ok) {
            const businesses = await response.json();
            const select = document.getElementById('affaire');
            if (select) {
                businesses.forEach(business => {
                    const option = document.createElement('option');
                    option.value = business.uid;
                    option.textContent = business.name || business.title;
                    select.appendChild(option);
                });
                console.log('Loaded', businesses.length, 'businesses');
            }
        }
    } catch (error) {
        console.error('Error loading businesses:', error);
    }
}

async function loadClientsForBusiness() {
    const businessId = document.getElementById('affaire').value;
    const clientSelect = document.getElementById('client');
    
    if (!clientSelect) return;
    
    // Clear existing options
    clientSelect.innerHTML = '<option value="">Sélectionner un client</option>';
    
    if (!businessId) {
        console.log('No business selected');
        return;
    }
    
    console.log('Loading clients for business:', businessId);
    
    try {
        const response = await fetch(`/nodetest/api/clients?business_id=${businessId}`);
        
        if (response.ok) {
            const clients = await response.json();
            console.log('Clients loaded:', clients);
            
            if (clients.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Aucun client trouvé';
                option.disabled = true;
                clientSelect.appendChild(option);
                return;
            }
            
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.uid;
                option.textContent = client.name;
                clientSelect.appendChild(option);
            });
            
            // Auto-select if only one client
            if (clients.length === 1) {
                clientSelect.value = clients[0].uid;
            }
            
            console.log('Loaded', clients.length, 'clients');
        } else {
            console.error('Error loading clients:', response.status);
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Erreur de chargement';
            option.disabled = true;
            clientSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading clients:', error);
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Erreur de connexion';
        option.disabled = true;
        clientSelect.appendChild(option);
    }
}

async function loadTechnicians() {
    try {
        console.log('Loading technicians...');
        const response = await fetch('/nodetest/api/technicians');
        if (response.ok) {
            const technicians = await response.json();
            const select = document.getElementById('technicien');
            if (select) {
                technicians.forEach(technician => {
                    const option = document.createElement('option');
                    option.value = technician.uid || technician.technician_id;
                    option.textContent = technician.name || `${technician.firstname} ${technician.lastname}`;
                    select.appendChild(option);
                });
                console.log('Loaded', technicians.length, 'technicians');
            }
        }
    } catch (error) {
        console.error('Error loading technicians:', error);
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
    
    if (errors.length > 0) {
        alert('Les champs suivants sont obligatoires:\n' + errors.join('\n'));
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
        { id: 'adresse', label: 'Adresse' },
        { id: 'ville', label: 'Ville' },
        { id: 'date', label: 'Date' },
        { id: 'description', label: 'Description' }
    ];
    
    let summaryHTML = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element && element.value) {
            let value = field.getText && element.selectedOptions ? 
                       element.selectedOptions[0]?.text : element.value;
            
            summaryHTML += `
                <div class="flex justify-between py-2 border-b border-gray-200">
                    <span class="font-medium text-gray-600">${field.label}:</span>
                    <span class="text-gray-900">${value}</span>
                </div>
            `;
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
        
        // Add all form fields
        const formFields = [
            'numero', 'titre', 'statut', 'type', 'priorite', 'affaire', 'client',
            'technicien', 'adresse', 'ville', 'immeuble', 'etage', 'appartement',
            'date', 'heure_debut', 'heure_fin', 'description'
        ];
        
        formFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                formData[field] = element.value || '';
                console.log(`Added ${field}:`, formData[field]);
            }
        });
        
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