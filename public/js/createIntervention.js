// public/js/createIntervention.js - Create intervention functionality

let currentStep = 1;
let interventionData = {};
let uploadedPDFData = null;

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
    // PDF upload handling
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
        const fallbackNumber = Math.floor(Date.now() / 1000).toString().slice(-4);
        document.getElementById('numero').value = fallbackNumber.padStart(4, '0');
    }
}

async function loadFormData() {
    try {
        // Load in parallel for better performance
        await Promise.all([
            loadStatuses(),
            loadTypes(),
            loadBusinesses(),
            loadTechnicians()
        ]);
    } catch (error) {
        console.error('Error loading form data:', error);
    }
}

async function loadStatuses() {
    try {
        const response = await fetch('/nodetest/api/intervention-statuses');
        if (response.ok) {
            const statuses = await response.json();
            const select = document.getElementById('statut');
            
            statuses.forEach(status => {
                const option = document.createElement('option');
                option.value = status.uid;
                option.textContent = status.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading statuses:', error);
    }
}

async function loadTypes() {
    try {
        const response = await fetch('/nodetest/api/intervention-types');
        if (response.ok) {
            const types = await response.json();
            const select = document.getElementById('type');
            
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.uid;
                option.textContent = type.name;
                select.appendChild(option);
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
            const select = document.getElementById('affaire');
            
            businesses.forEach(business => {
                const option = document.createElement('option');
                option.value = business.uid;
                option.textContent = `${business.number} - ${business.title}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading businesses:', error);
    }
}

async function loadClientsForBusiness() {
    const businessId = document.getElementById('affaire').value;
    const clientSelect = document.getElementById('client');
    
    // Clear existing clients
    clientSelect.innerHTML = '<option value="">Sélectionner un client</option>';
    
    if (!businessId) return;
    
    try {
        const response = await fetch(`/nodetest/api/clients?business_id=${businessId}`);
        if (response.ok) {
            const clients = await response.json();
            
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.uid;
                option.textContent = `${client.firstname} ${client.lastname}`;
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
            const select = document.getElementById('technicien');
            
            technicians.forEach(technician => {
                const option = document.createElement('option');
                option.value = technician.technician_id;
                option.textContent = technician.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading technicians:', error);
    }
}

async function handlePDFUpload(file) {
    const uploadContent = document.getElementById('upload-content');
    const uploadProgress = document.getElementById('upload-progress');
    const uploadSuccess = document.getElementById('upload-success');
    
    // Show progress
    uploadContent.classList.add('hidden');
    uploadProgress.classList.remove('hidden');
    
    // Simulate progress
    let progress = 0;
    const progressBar = document.getElementById('progress-bar');
    const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) progress = 90;
        progressBar.style.width = progress + '%';
    }, 200);
    
    try {
        const formData = new FormData();
        formData.append('pdf', file);
        
        const response = await fetch('/nodetest/api/parse-pdf', {
            method: 'POST',
            body: formData
        });
        
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        
        if (response.ok) {
            const result = await response.json();
            uploadedPDFData = result.data;
            
            // Show success
            setTimeout(() => {
                uploadProgress.classList.add('hidden');
                uploadSuccess.classList.remove('hidden');
                
                // Fill form with extracted data
                if (result.data) {
                    fillFormFromPDF(result.data);
                }
            }, 500);
        } else {
            throw new Error('Failed to parse PDF');
        }
    } catch (error) {
        clearInterval(progressInterval);
        console.error('Error uploading PDF:', error);
        
        // Reset to upload state
        uploadProgress.classList.add('hidden');
        uploadContent.classList.remove('hidden');
        
        alert('Erreur lors de l\'analyse du PDF. Vous pouvez continuer en remplissant le formulaire manuellement.');
    }
}

function fillFormFromPDF(data) {
    // Fill form fields with extracted PDF data
    if (data.title) document.getElementById('titre').value = data.title;
    if (data.address) document.getElementById('adresse').value = data.address;
    if (data.city) document.getElementById('ville').value = data.city;
    if (data.building) document.getElementById('immeuble').value = data.building;
    if (data.floor) document.getElementById('etage').value = data.floor;
    if (data.apartment) document.getElementById('appartement').value = data.apartment;
    if (data.description) document.getElementById('description').value = data.description;
    if (data.date) document.getElementById('date').value = data.date;
    if (data.priority) document.getElementById('priorite').value = data.priority;
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
    
    const summary = `
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Résumé de l'intervention</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <p class="text-sm text-gray-600">Numéro</p>
                <p class="font-medium">${formData.numero}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">Statut</p>
                <p class="font-medium">${getSelectText('statut')}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">Type</p>
                <p class="font-medium">${getSelectText('type')}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">Priorité</p>
                <p class="font-medium">${formData.priorite}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">Affaire</p>
                <p class="font-medium">${getSelectText('affaire')}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">Client</p>
                <p class="font-medium">${getSelectText('client')}</p>
            </div>
            <div class="md:col-span-2">
                <p class="text-sm text-gray-600">Adresse</p>
                <p class="font-medium">${formData.adresse}, ${formData.ville}</p>
            </div>
            <div class="md:col-span-2">
                <p class="text-sm text-gray-600">Titre</p>
                <p class="font-medium">${formData.titre}</p>
            </div>
            ${formData.date ? `
            <div>
                <p class="text-sm text-gray-600">Date intervention</p>
                <p class="font-medium">${formatDate(formData.date)}</p>
            </div>
            ` : ''}
            ${formData.technicien ? `
            <div>
                <p class="text-sm text-gray-600">Technicien</p>
                <p class="font-medium">${getSelectText('technicien')}</p>
            </div>
            ` : ''}
            <div class="md:col-span-2">
                <p class="text-sm text-gray-600">Description</p>
                <p class="font-medium">${formData.description}</p>
            </div>
        </div>
    `;
    
    summaryContainer.innerHTML = summary;
}

function getFormData() {
    return {
        numero: document.getElementById('numero').value,
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
        titre: document.getElementById('titre').value,
        date: document.getElementById('date').value,
        date_echeance: document.getElementById('date_echeance').value,
        heure_debut: document.getElementById('heure_debut').value,
        heure_fin: document.getElementById('heure_fin').value,
        technicien: document.getElementById('technicien').value,
        description: document.getElementById('description').value
    };
}

function getSelectText(selectId) {
    const select = document.getElementById(selectId);
    return select.options[select.selectedIndex]?.text || '';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

async function createIntervention() {
    const createBtn = document.getElementById('create-btn');
    const originalText = createBtn.innerHTML;
    
    // Show loading state
    createBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Création en cours...';
    createBtn.disabled = true;
    
    try {
        const formData = getFormData();
        
        // Format date for database (DD/MM/YYYY format)
        if (formData.date) {
            const dateObj = new Date(formData.date);
            formData.date = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
        }
        
        // Format due date
        if (formData.date_echeance) {
            const dateObj = new Date(formData.date_echeance);
            formData.date_echeance = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
        }
        
        // Combine date and time if both are provided
        if (formData.date && (formData.heure_debut || formData.heure_fin)) {
            let timeRange = '';
            if (formData.heure_debut) timeRange += formData.heure_debut;
            if (formData.heure_fin) timeRange += (timeRange ? ' - ' : '') + formData.heure_fin;
            if (timeRange) formData.date += ' ' + timeRange;
        }
        
        const response = await fetch('/nodetest/api/create-intervention', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Show success message
                alert('Intervention créée avec succès !');
                
                // Redirect to interventions list or dashboard
                window.location.href = '/nodetest/interventions';
            } else {
                throw new Error(result.message || 'Erreur lors de la création');
            }
        } else {
            throw new Error('Erreur serveur lors de la création');
        }
        
    } catch (error) {
        console.error('Error creating intervention:', error);
        alert('Erreur lors de la création de l\'intervention: ' + error.message);
    } finally {
        // Reset button state
        createBtn.innerHTML = originalText;
        createBtn.disabled = false;
    }
}