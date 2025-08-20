// public/js/urgent.js - Urgent interventions page logic with actions

// Global state
let currentPage = 1;
let currentSort = { field: 'hours_remaining', order: 'asc' };
let currentFilters = {
    search: '',
    status: '',
    missing: '',
    timeFilter: ''
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadUrgentInterventions();
    
    // Auto-refresh every 2 minutes
    setInterval(loadUrgentInterventions, 120000);
});

function setupEventListeners() {
    // Search input with debounce
    let searchTimeout;
    document.getElementById('search-input').addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = e.target.value;
            currentPage = 1;
            loadUrgentInterventions();
        }, 500);
    });

    // Filter dropdowns
    document.getElementById('status-filter').addEventListener('change', function(e) {
        currentFilters.status = e.target.value;
        currentPage = 1;
        loadUrgentInterventions();
    });

    document.getElementById('missing-filter').addEventListener('change', function(e) {
        currentFilters.missing = e.target.value;
        currentPage = 1;
        loadUrgentInterventions();
    });

    document.getElementById('time-filter').addEventListener('change', function(e) {
        currentFilters.timeFilter = e.target.value;
        currentPage = 1;
        loadUrgentInterventions();
    });

    // Page size change
    document.getElementById('page-size').addEventListener('change', function(e) {
        currentPage = 1;
        loadUrgentInterventions();
    });

    // Event delegation for action buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.assign-technician-btn')) {
            const interventionId = e.target.closest('.assign-technician-btn').dataset.interventionId;
            assignTechnician(interventionId);
        } else if (e.target.closest('.assign-date-btn')) {
            const interventionId = e.target.closest('.assign-date-btn').dataset.interventionId;
            setDate(interventionId);
        }
    });
}

function loadUrgentInterventions() {
    const pageSize = document.getElementById('page-size').value || 25;
    
    // Build query parameters
    const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        search: currentFilters.search,
        status: currentFilters.status,
        missing: currentFilters.missing,
        timeFilter: currentFilters.timeFilter,
        sortBy: currentSort.field,
        sortOrder: currentSort.order
    });

    // Fetch data
    fetch(`/nodetest/api/urgent-all?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displayInterventions(data.data || []);
            updatePagination(data.pagination || {});
            updateStats(data.pagination?.totalCount || 0);
        })
        .catch(error => {
            console.error('Error loading urgent interventions:', error);
            displayError('Erreur lors du chargement des interventions urgentes: ' + error.message);
        });
}

function displayInterventions(interventions) {
    const tableBody = document.getElementById('urgent-table');
    
    if (!interventions || interventions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    <i class="fa fa-info-circle mr-2"></i>Aucune intervention urgente trouvée
                </td>
            </tr>
        `;
        return;
    }

    const rows = interventions.map(intervention => {
        const timeClass = getTimeRemainingClass(intervention.hours_remaining || 0);
        const statusClass = getStatusClass(intervention.status);
        const missingClass = getMissingInfoClass(intervention.missing_info);
        
        // Determine which actions are needed
        const needsTechnician = intervention.technician_uid == 0 || intervention.technician_uid == null;
        const needsDate = !intervention.date_time || intervention.date_time === '';
        
        let actionButtons = '';
        if (needsTechnician) {
            actionButtons += `<button class="assign-technician-btn inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 mr-1 mb-1" data-intervention-id="${escapeHtml(intervention.intervention_id)}">
                <i class="fas fa-user-plus mr-1"></i>Technicien
            </button>`;
        }
        if (needsDate) {
            actionButtons += `<button class="assign-date-btn inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded hover:bg-green-200 mr-1 mb-1" data-intervention-id="${escapeHtml(intervention.intervention_id)}">
                <i class="fas fa-calendar-plus mr-1"></i>Date
            </button>`;
        }
        if (!needsTechnician && !needsDate) {
            actionButtons = `<span class="text-xs text-gray-500 italic">Complet</span>`;
        }
        
        return `
            <tr class="hover:bg-gray-50 ${intervention.hours_remaining <= 0 ? 'urgent-row' : ''}">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #${intervention.intervention_id || 'N/A'}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate" title="${escapeHtml(intervention.title || '')}">
                        ${escapeHtml(intervention.title || 'Sans titre')}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate" title="${escapeHtml(intervention.address || '')}">
                        ${escapeHtml(intervention.address || 'Adresse non définie')}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${getStatusIconHtml(intervention.status)} ${escapeHtml(intervention.status || 'N/A')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${missingClass}">
                        ${getMissingIcon(intervention.missing_info)} ${escapeHtml(intervention.missing_info || 'N/A')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${timeClass}">
                        ${getTimeIcon(intervention.hours_remaining)} ${formatTimeRemaining(intervention.hours_remaining)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(intervention.assigned_to || 'Non assigné')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="flex flex-wrap">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rows.join('');
}

function updatePagination(pagination) {
    if (!pagination) return;
    
    const { currentPage, totalPages, hasNextPage, hasPrevPage, limit, totalCount } = pagination;
    
    // Update showing info
    const start = totalCount === 0 ? 0 : ((currentPage - 1) * limit) + 1;
    const end = Math.min(currentPage * limit, totalCount);
    
    document.getElementById('showing-start').textContent = start;
    document.getElementById('showing-end').textContent = end;
    document.getElementById('total-results').textContent = totalCount;

    // Update pagination controls
    const controls = document.getElementById('pagination-controls');
    let paginationHTML = '';

    // Previous button
    if (hasPrevPage) {
        paginationHTML += `<button onclick="goToPage(${currentPage - 1})" class="px-3 py-2 text-sm leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700">Précédent</button>`;
    } else {
        paginationHTML += `<button disabled class="px-3 py-2 text-sm leading-tight text-gray-300 bg-gray-100 border border-gray-300 rounded-l-lg cursor-not-allowed">Précédent</button>`;
    }

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="px-3 py-2 text-sm leading-tight text-blue-600 bg-blue-50 border border-gray-300 hover:bg-blue-100">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="goToPage(${i})" class="px-3 py-2 text-sm leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700">${i}</button>`;
        }
    }

    // Next button
    if (hasNextPage) {
        paginationHTML += `<button onclick="goToPage(${currentPage + 1})" class="px-3 py-2 text-sm leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700">Suivant</button>`;
    } else {
        paginationHTML += `<button disabled class="px-3 py-2 text-sm leading-tight text-gray-300 bg-gray-100 border border-gray-300 rounded-r-lg cursor-not-allowed">Suivant</button>`;
    }

    controls.innerHTML = paginationHTML;
}

function updateStats(totalCount) {
    document.getElementById('total-count').textContent = `${totalCount} intervention(s) urgente(s)`;
}

// Navigation functions
function goToPage(page) {
    currentPage = page;
    loadUrgentInterventions();
}

function sortBy(field) {
    if (currentSort.field === field) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.order = 'asc';
    }
    currentPage = 1;
    loadUrgentInterventions();
}

function clearFilters() {
    currentFilters = {
        search: '',
        status: '',
        missing: '',
        timeFilter: ''
    };
    currentPage = 1;
    
    // Reset form fields
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('missing-filter').value = '';
    document.getElementById('time-filter').value = '';
    
    loadUrgentInterventions();
}

function refreshData() {
    loadUrgentInterventions();
}

// Action functions
function assignTechnician(interventionId) {
    console.log('Assigning technician to intervention:', interventionId);
    openTechnicianModal(interventionId);
}

function setDate(interventionId) {
    console.log('Setting date for intervention:', interventionId);
    openDateModal(interventionId);
}

function viewDetails(interventionId) {
    console.log('Viewing details for intervention:', interventionId);
    // TODO: Implement details view
    alert(`Voir les détails de l'intervention ${interventionId} - À implémenter`);
}

// Modal functions
function openTechnicianModal(interventionId) {
    const modal = document.getElementById('technician-modal');
    if (modal) {
        document.getElementById('modal-intervention-id').value = interventionId;
        document.getElementById('technician-modal-title').textContent = `Assigner un technicien - Intervention #${interventionId}`;
        modal.classList.remove('hidden');
        loadTechniciansForModal();
    }
}

function openDateModal(interventionId) {
    const modal = document.getElementById('date-modal');
    if (modal) {
        document.getElementById('date-modal-intervention-id').value = interventionId;
        document.getElementById('date-modal-title').textContent = `Définir une date - Intervention #${interventionId}`;
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('intervention-date').min = today;
        
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        // Reset forms
        if (modalId === 'technician-modal') {
            document.getElementById('technician-select').value = '';
        } else if (modalId === 'date-modal') {
            document.getElementById('intervention-date').value = '';
            document.getElementById('intervention-time').value = '';
        }
    }
}

async function loadTechniciansForModal() {
    try {
        const response = await fetch('/nodetest/api/technicians');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const technicians = await response.json();
        const select = document.getElementById('technician-select');
        
        // Clear existing options
        select.innerHTML = '<option value="">Sélectionner un technicien</option>';
        
        // Add technicians
        technicians.forEach(technician => {
            const option = document.createElement('option');
            option.value = technician.technician_id;
            option.textContent = technician.name;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading technicians for modal:', error);
        alert('Erreur lors du chargement des techniciens');
    }
}

async function saveTechnicianAssignment() {
    const interventionId = document.getElementById('modal-intervention-id').value;
    const technicianId = document.getElementById('technician-select').value;
    
    if (!technicianId) {
        alert('Veuillez sélectionner un technicien');
        return;
    }
    
    try {
        const response = await fetch('/nodetest/api/assign-technician', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                interventionId: interventionId,
                technicianId: technicianId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert('Technicien assigné avec succès!');
            closeModal('technician-modal');
            loadUrgentInterventions(); // Reload the table
        } else {
            alert('Erreur lors de l\'assignation: ' + (result.message || 'Erreur inconnue'));
        }
        
    } catch (error) {
        console.error('Error assigning technician:', error);
        alert('Erreur lors de l\'assignation du technicien');
    }
}

async function saveDateAssignment() {
    const interventionId = document.getElementById('date-modal-intervention-id').value;
    const date = document.getElementById('intervention-date').value;
    const time = document.getElementById('intervention-time').value;
    
    if (!date) {
        alert('Veuillez sélectionner une date');
        return;
    }
    
    // Format date to DD/MM/YYYY format (as used in the old system)
    const dateObj = new Date(date);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
    
    try {
        const response = await fetch('/nodetest/api/assign-date', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                interventionId: interventionId,
                date: formattedDate,
                time: time || ''
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert('Date assignée avec succès!');
            closeModal('date-modal');
            loadUrgentInterventions(); // Reload the table
        } else {
            alert('Erreur lors de l\'assignation: ' + (result.message || 'Erreur inconnue'));
        }
        
    } catch (error) {
        console.error('Error assigning date:', error);
        alert('Erreur lors de l\'assignation de la date');
    }
}

function displayError(message) {
    const tableBody = document.getElementById('urgent-table');
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="px-6 py-8 text-center text-red-500">
                <i class="fa fa-exclamation-triangle mr-2"></i>${message}
            </td>
        </tr>
    `;
}

// Utility functions
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getStatusClass(status) {
    const statusClasses = {
        'Reçue': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        'Assignée': 'bg-indigo-100 text-indigo-800 border border-indigo-300',
        'Planifiée': 'bg-blue-100 text-blue-800 border border-blue-300',
        'En cours': 'bg-orange-100 text-orange-800 border border-orange-300',
        'Terminée': 'bg-green-100 text-green-800 border border-green-300',
        'Facturée': 'bg-gray-100 text-gray-800 border border-gray-300',
        'Payée': 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        'Maintenance SCH': 'bg-orange-100 text-orange-800 border border-orange-300',
        'Maintenance VIVEST': 'bg-red-100 text-red-800 border border-red-300',
        'Maintenance Moselis': 'bg-teal-100 text-teal-800 border border-teal-300',
        'Maintenance CDC': 'bg-cyan-100 text-cyan-800 border border-cyan-300',
        'Maintenance CDC Habitat': 'bg-lime-100 text-lime-800 border border-lime-300',
        'CHANTIER': 'bg-pink-100 text-pink-800 border border-pink-300',
        'Pausée': 'bg-slate-100 text-slate-800 border border-slate-300',
        'Annulée': 'bg-red-100 text-red-800 border border-red-300'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800 border border-gray-300';
}

function getTimeRemainingClass(hours) {
    if (hours <= 0) return 'bg-red-100 text-red-800 border border-red-300';
    if (hours <= 6) return 'bg-red-100 text-red-800 border border-red-300';
    if (hours <= 12) return 'bg-orange-100 text-orange-800 border border-orange-300';
    if (hours <= 24) return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    return 'bg-green-100 text-green-800 border border-green-300';
}

function getMissingInfoClass(missingInfo) {
    const missingClasses = {
        'Technicien manquant': 'bg-orange-100 text-orange-800 border border-orange-300',
        'Date manquante': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        'Technicien et Date manquants': 'bg-red-100 text-red-800 border border-red-300',
        'Complet': 'bg-green-100 text-green-800 border border-green-300'
    };
    return missingClasses[missingInfo] || 'bg-gray-100 text-gray-800 border border-gray-300';
}

function getStatusIconHtml(status) {
    const statusIcons = {
        'Reçue': '<i class="fas fa-inbox mr-1"></i>',
        'Assignée': '<i class="fas fa-user-check mr-1"></i>',
        'Planifiée': '<i class="fas fa-calendar-check mr-1"></i>',
        'En cours': '<i class="fas fa-cogs mr-1"></i>',
        'Terminée': '<i class="fas fa-check-circle mr-1"></i>',
        'Facturée': '<i class="fas fa-file-invoice mr-1"></i>',
        'Payée': '<i class="fas fa-credit-card mr-1"></i>',
        'Pausée': '<i class="fas fa-pause-circle mr-1"></i>',
        'Annulée': '<i class="fas fa-times-circle mr-1"></i>'
    };
    return statusIcons[status] || '<i class="fas fa-circle mr-1"></i>';
}

function getTimeIcon(hours) {
    if (hours <= 0) return '<i class="fas fa-exclamation-triangle mr-1"></i>';
    if (hours <= 6) return '<i class="fas fa-clock mr-1"></i>';
    if (hours <= 12) return '<i class="fas fa-hourglass-half mr-1"></i>';
    if (hours <= 24) return '<i class="fas fa-hourglass-start mr-1"></i>';
    return '<i class="fas fa-check mr-1"></i>';
}

function getMissingIcon(missingInfo) {
    const missingIcons = {
        'Technicien manquant': '<i class="fas fa-user-times mr-1"></i>',
        'Date manquante': '<i class="fas fa-calendar-times mr-1"></i>',
        'Technicien et Date manquants': '<i class="fas fa-exclamation-triangle mr-1"></i>',
        'Complet': '<i class="fas fa-check-circle mr-1"></i>'
    };
    return missingIcons[missingInfo] || '<i class="fas fa-question-circle mr-1"></i>';
}

function formatTimeRemaining(hours) {
    if (hours === null || hours === undefined) return 'N/A';
    if (hours <= 0) return 'Expiré';
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}j`;
}