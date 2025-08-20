// public/js/createIntervention.js - Updated without PDF autofill functionality

let currentStep = 1;
let interventionData = {};
let uploadedPDFFile = null;

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    loadFormData();
    generateInterventionNumber();
});

function initializePage() {
    // Show first step
    showStep(1);
}

function setupEventListeners() {
    // PDF upload handling - SIMPLIFIED: just store file, no autofill
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('pdf-upload');
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            handlePDFUpload(files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handlePDFUpload(e.target.files[0]);
        }
    });
    
    // Form field dependencies
    document.getElementById('affaire').addEventListener('change', loadClientsForBusiness);
}

async function generateInterventionNumber() {
    try {
        const response = await fetch('/nodetest/api/intervention-number');
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                document.getElementById('numero').value = result.number;
            }
        }
    } catch (error) {
        console.error('Error generating intervention number:', error);
        // Fallback: generate a simple number based on timestamp
        const fallbackNumber = Date.now().toString().slice(-6);
        document.getElementById('numero').value = fallbackNumber;
    }
}

async function loadFormData() {
    try {
        // Load statuses (specific ones only)
        await loadInterventionStatuses();
        
        // Load types (specific ones only)
        await loadInterventionTypes();
        
        // Load businesses
        await loadBusinesses();
        
        // Load technicians
        await loadTechnicians();
        
    } catch (error) {
        console.error('Error loading form data:', error);
    }
}

async function loadInterventionStatuses() {
    try {
        const response = await fetch('/nodetest/api/intervention-statuses');
        if (response.ok) {
            const statuses = await response.json();
            const statusSelect = document.getElementById('statut');
            
            statuses.forEach(status => {
                const option = document.createElement('option');
                option.value = status.uid;
                option.textContent = status.name;
                statusSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading statuses:', error);
    }
}

async function loadInterventionTypes() {
    try {
        const response = await fetch('/nodetest/api/intervention-types');
        if (response.ok) {
            const types = await response.json();
            const typeSelect = document.getElementById('type');
            
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.uid;
                option.textContent = type.name;
                typeSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading types:', error);
    }
}

async function loadBusinesses() {
    try {
        const response = await fetch('/nodetest/api/businesses');
        if (response.ok) {
            const businesses = await response.json();
            const businessSelect = document.getElementById('affaire');
            
            // Clear existing options (except first)
            businessSelect.innerHTML = '<option value="">Sélectionner une affaire</option>';
            
            businesses.forEach(business => {
                const option = document.createElement('option');
                option.value = business.uid;
                option.textContent = business.name;
                businessSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading businesses:', error);
    }
}

async function loadClientsForBusiness() {
    const businessId = document.getElementById('affaire').value;
    const clientSelect = document.getElementById('client');
    
    // Clear existing options
    clientSelect.innerHTML = '<option value="">Sélectionner un client</option>';
    
    if (!businessId) return;
    
    try {
        const response = await fetch(`/nodetest/api/clients?business_id=${businessId}`);
        if (response.ok) {
            const clients = await response.json();
            
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.uid;
                option.textContent = client.name;
                clientSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

async function loadTechnicians() {
    try {
        const response = await fetch('/nodetest/api/technicians');
        if (response.ok) {
            const technicians = await response.json();
            const technicianSelect = document.getElementById('technicien');
            
            technicians.forEach(technician => {
                const option = document.createElement('option');
                option.value = technician.uid;
                option.textContent = `${technician.firstname} ${technician.lastname}`;
                technicianSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading technicians:', error);
    }
}

// SIMPLIFIED: PDF upload just stores file, no autofill
function handlePDFUpload(file) {
    const uploadContent = document.getElementById('upload-content');
    const uploadSuccess = document.getElementById('upload-success');
    
    // Store the file for later upload when form is submitted
    uploadedPDFFile = file;
    
    // Show success immediately (no processing needed)
    uploadContent.classList.add('hidden');
    uploadSuccess.classList.remove('hidden');
    
    // Update success message
    uploadSuccess.innerHTML = `
        <i class="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
        <p class="text-gray-600">PDF "${file.name}" prêt pour upload</p>
        <button type="button" onclick="removeUploadedFile()" 
                class="mt-2 text-sm text-red-600 hover:text-red-700">
            Supprimer
        </button>
    `;
}

function removeUploadedFile() {
    uploadedPDFFile = null;
    
    const uploadContent = document.getElementById('upload-content');
    const uploadSuccess = document.getElementById('upload-success');
    
    uploadSuccess.classList.add('hidden');
    uploadContent.classList.remove('hidden');
}

function skipUpload() {
    nextStep();
}

function nextStep() {
    if (currentStep < 3) {
        if (validateCurrentStep()) {
            currentStep++;
            showStep(currentStep);
            updateStepIndicators();
            
            if (currentStep === 3) {
                generateValidationSummary();
            }
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateStepIndicators();
    }
}

function showStep(step) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show current section
    document.getElementById(`section-${step}`).classList.add('active');
}

function updateStepIndicators() {
    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`step-${i}`);
        if (i < currentStep) {
            indicator.className = 'step-indicator completed w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium';
            indicator.innerHTML = '<i class="fas fa-check"></i>';
        } else if (i === currentStep) {
            indicator.className = 'step-indicator active w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium';
            indicator.textContent = i;
        } else {
            indicator.className = 'step-indicator w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium';
            indicator.textContent = i;
        }
    }
}

function validateCurrentStep() {
    if (currentStep === 1) {
        // PDF upload step - always valid (optional)
        return true;
    } else if (currentStep === 2) {
        // Form validation
        const requiredFields = ['statut', 'type', 'priorite', 'affaire', 'client', 'adresse', 'ville', 'titre', 'description'];
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.classList.add('border-red-500');
                isValid = false;
            } else {
                field.classList.remove('border-red-500');
            }
        });
        
        if (!isValid) {
            alert('Veuillez remplir tous les champs obligatoires (marqués d\'un *)');
        }
        
        return isValid;
    }
    return true;
}

function generateValidationSummary() {
    const formData = getFormData();
    const summaryContainer = document.getElementById('validation-summary');
    
    summaryContainer.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-medium text-gray-900 mb-2">Informations générales</h4>
                    <p><strong>Numéro:</strong> ${formData.numero}</p>
                    <p><strong>Titre:</strong> ${formData.titre}</p>
                    <p><strong>Statut:</strong> ${getSelectText('statut')}</p>
                    <p><strong>Type:</strong> ${getSelectText('type')}</p>
                    <p><strong>Priorité:</strong> ${formData.priorite}</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-medium text-gray-900 mb-2">Client & Localisation</h4>
                    <p><strong>Affaire:</strong> ${getSelectText('affaire')}</p>
                    <p><strong>Client:</strong> ${getSelectText('client')}</p>
                    <p><strong>Adresse:</strong> ${formData.adresse}</p>
                    <p><strong>Ville:</strong> ${formData.ville}</p>
                </div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-gray-900 mb-2">Description</h4>
                <p>${formData.description}</p>
            </div>
            ${uploadedPDFFile ? `
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h4 class="font-medium text-blue-900 mb-2">Fichier joint</h4>
                    <p class="text-blue-800">📄 ${uploadedPDFFile.name}</p>
                </div>
            ` : ''}
        </div>
    `;
}

function getFormData() {
    return {
        numero: document.getElementById('numero').value,
        titre: document.getElementById('titre').value,
        statut: document.getElementById('statut').value,
        type: document.getElementById('type').value,
        priorite: document.getElementById('priorite').value,
        affaire: document.getElementById('affaire').value,
        client: document.getElementById('client').value,
        adresse: document.getElementById('adresse').value,
        ville: document.getElementById('ville').value,
        immeuble: document.getElementById('immeuble').value,
        etage: document.getElementById('etage').value,
        appartement: document.getElementById('appartement').value,
        description: document.getElementById('description').value,
        date: document.getElementById('date').value,
        technicien: document.getElementById('technicien').value
    };
}

function getSelectText(selectId) {
    const select = document.getElementById(selectId);
    return select.selectedIndex > 0 ? select.options[select.selectedIndex].text : '';
}

async function submitForm() {
    try {
        const formData = getFormData();
        
        // Create FormData for file upload if PDF exists
        const submitData = new FormData();
        
        // Add form fields
        Object.keys(formData).forEach(key => {
            submitData.append(key, formData[key]);
        });
        
        // Add PDF file if uploaded
        if (uploadedPDFFile) {
            submitData.append('pdf_file', uploadedPDFFile);
        }
        
        const response = await fetch('/nodetest/api/create-intervention', {
            method: 'POST',
            body: submitData
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                alert('Intervention créée avec succès !');
                window.location.href = '/nodetest/interventions';
            } else {
                alert('Erreur: ' + result.message);
            }
        } else {
            throw new Error('Erreur lors de la création');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Erreur lors de la création de l\'intervention');
    }
}