// public/js/allInterventions.js - All interventions page functionality

let currentPage = 1;
let currentFilters = {
    search: '',
    status: '',
    priority: '',
    technician: '',
    date: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 25
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadTechnicians();
    loadInterventions();
    setupEventListeners();
});

function setupEventListeners() {
    // Filter change listeners with debounce
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function() {
            currentFilters.search = searchInput.value;
            currentPage = 1;
            loadInterventions();
        }, 500);
    });

    // Sort change listeners
    document.getElementById('sort-by').addEventListener('change', function() {
        currentFilters.sortBy = this.value;
        currentPage = 1;
        loadInterventions();
    });
    
    document.getElementById('sort-order').addEventListener('change', function() {
        currentFilters.sortOrder = this.value;
        currentPage = 1;
        loadInterventions();
    });

    // Date filter listeners - removed auto-apply to rely on manual apply
    document.getElementById('date-filter').addEventListener('change', function() {
        // Clear preset when manual date is selected
        document.getElementById('date-preset').value = '';
    });

    // Date preset listener
    document.getElementById('date-preset').addEventListener('change', function() {
        const preset = this.value;
        if (preset) {
            const date = getDateFromPreset(preset);
            if (date) {
                document.getElementById('date-filter').value = date;
            }
        }
    });
}

function applyFilters() {
    // Get all filter values
    const search = document.getElementById('search-input').value;
    const status = document.getElementById('status-filter').value;
    const priority = document.getElementById('priority-filter').value;
    const technician = document.getElementById('technician-filter').value;
    const date = document.getElementById('date-filter').value;
    
    // Debug: Log all filter values
    console.log('Applying filters:', {
        search,
        status,
        priority,
        technician,
        date
    });
    
    // Update currentFilters
    currentFilters.search = search;
    currentFilters.status = status;
    currentFilters.priority = priority;
    currentFilters.technician = technician;
    currentFilters.date = date;
    
    currentPage = 1;
    loadInterventions();
}

function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('priority-filter').value = '';
    document.getElementById('technician-filter').value = '';
    document.getElementById('date-filter').value = '';
    document.getElementById('date-preset').value = '';
    document.getElementById('sort-by').value = 'created_at';
    document.getElementById('sort-order').value = 'desc';
    
    currentFilters = {
        search: '',
        status: '',
        priority: '',
        technician: '',
        date: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 25
    };
    currentPage = 1;
    loadInterventions();
}

function clearDateFilter() {
    document.getElementById('date-filter').value = '';
    document.getElementById('date-preset').value = '';
    currentFilters.date = '';
    currentPage = 1;
    loadInterventions();
}

function changePageSize() {
    currentFilters.limit = parseInt(document.getElementById('page-size').value);
    currentPage = 1;
    loadInterventions();
}

function refreshData() {
    loadInterventions();
}

async function loadTechnicians() {
    try {
        const response = await fetch('/nodetest/api/technicians');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const technicians = await response.json();
        const technicianSelect = document.getElementById('technician-filter');
        
        // Clear existing options except for default ones
        const defaultOptions = technicianSelect.innerHTML;
        technicianSelect.innerHTML = `
            <option value="">Tous les techniciens</option>
            <option value="unassigned">Non assigné</option>
        `;
        
        // Add technicians to the select
        technicians.forEach(technician => {
            const option = document.createElement('option');
            option.value = technician.technician_id;
            option.textContent = technician.name;
            technicianSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading technicians:', error);
        // Keep default options if loading fails
    }
}

async function loadInterventions() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: currentFilters.limit,
            search: currentFilters.search,
            status: currentFilters.status,
            priority: currentFilters.priority,
            technician: currentFilters.technician,
            date: currentFilters.date,
            sortBy: currentFilters.sortBy,
            sortOrder: currentFilters.sortOrder
        });

        // Debug: Log the API URL and parameters
        const apiUrl = `/nodetest/api/all-recent?${params}`;
        console.log('API URL:', apiUrl);
        console.log('Current filters:', currentFilters);

        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Debug: Log the response data
        console.log('API Response:', data);
        
        displayInterventions(data.data || []);
        updatePagination(data.pagination || {});
        updateStats(data.pagination?.totalCount || 0);
        
    } catch (error) {
        console.error('Error loading interventions:', error);
        displayError('Erreur lors du chargement des interventions: ' + error.message);
    }
}

function getDateFromPreset(preset) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Helper function to get Monday of current week
    function getMonday(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(date.setDate(diff));
    }
    
    // Helper function to format date as YYYY-MM-DD
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    switch (preset) {
        case 'today':
            return formatDate(today);
            
        case 'yesterday':
            return formatDate(yesterday);
            
        case 'this-week':
            return formatDate(getMonday(new Date(today)));
            
        case 'last-week':
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);
            return formatDate(getMonday(lastWeek));
            
        case 'this-month':
            return formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
            
        case 'last-month':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            return formatDate(lastMonth);
            
        default:
            return null;
    }
}

function displayInterventions(interventions) {
    const tableBody = document.getElementById('interventions-table');
    
    if (!interventions || interventions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    <i class="fa fa-info-circle mr-2"></i>Aucune intervention trouvée
                </td>
            </tr>
        `;
        return;
    }

    const rows = interventions.map(intervention => {
        const statusClass = getStatusClass(intervention.status);
        const priorityClass = getPriorityClass(intervention.priority);
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #${intervention.intervention_id || 'N/A'}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate truncate-hover" title="${escapeHtml(intervention.title || 'Sans titre')}">
                        ${escapeHtml(intervention.title || 'Sans titre')}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate truncate-hover" title="${escapeHtml(intervention.address || 'Adresse non définie')}">
                        ${escapeHtml(intervention.address || 'Adresse non définie')}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate truncate-hover" title="${escapeHtml(intervention.description || 'Aucune description')}">
                        ${escapeHtml(intervention.description || 'Aucune description')}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${getStatusIconHtml(intervention.status)} ${escapeHtml(intervention.status || 'N/A')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityClass}">
                        ${getPriorityIcon(intervention.priority)} ${escapeHtml(intervention.priority || 'N/A')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatDate(intervention.date_time)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(intervention.assigned_to || 'Non assigné')}
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rows.join('');
}

function updatePagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    
    if (!pagination || pagination.totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const { currentPage: page, totalPages, hasNextPage, hasPrevPage } = pagination;
    
    let paginationHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
                <button onclick="goToPage(1)" ${page === 1 ? 'disabled' : ''} 
                        class="px-3 py-2 border border-gray-300 rounded-md text-sm ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}">
                    <i class="fas fa-angle-double-left"></i>
                </button>
                <button onclick="goToPage(${page - 1})" ${!hasPrevPage ? 'disabled' : ''} 
                        class="px-3 py-2 border border-gray-300 rounded-md text-sm ${!hasPrevPage ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}">
                    <i class="fas fa-angle-left"></i>
                </button>
            </div>
            
            <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-700">
                    Page ${page} sur ${totalPages}
                </span>
            </div>
            
            <div class="flex items-center space-x-2">
                <button onclick="goToPage(${page + 1})" ${!hasNextPage ? 'disabled' : ''} 
                        class="px-3 py-2 border border-gray-300 rounded-md text-sm ${!hasNextPage ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}">
                    <i class="fas fa-angle-right"></i>
                </button>
                <button onclick="goToPage(${totalPages})" ${page === totalPages ? 'disabled' : ''} 
                        class="px-3 py-2 border border-gray-300 rounded-md text-sm ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}">
                    <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
        </div>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

function updateStats(totalCount) {
    document.getElementById('stats-display').textContent = `${totalCount} intervention${totalCount !== 1 ? 's' : ''} trouvée${totalCount !== 1 ? 's' : ''}`;
    document.getElementById('results-count').textContent = `${totalCount} intervention${totalCount !== 1 ? 's' : ''}`;
}

function goToPage(page) {
    currentPage = page;
    loadInterventions();
}

function displayError(message) {
    const tableBody = document.getElementById('interventions-table');
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="px-6 py-8 text-center text-red-500">
                <i class="fa fa-exclamation-triangle mr-2"></i>${message}
            </td>
        </tr>
    `;
}

// Action functions for urgent interventions
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
            // Reload the current view
            if (typeof loadUrgentInterventions === 'function') {
                loadUrgentInterventions(); // For urgent page
            } else if (typeof loadInterventions === 'function') {
                loadInterventions(); // For all interventions page
            }
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
            // Reload the current view
            if (typeof loadUrgentInterventions === 'function') {
                loadUrgentInterventions(); // For urgent page
            } else if (typeof loadInterventions === 'function') {
                loadInterventions(); // For all interventions page
            }
        } else {
            alert('Erreur lors de l\'assignation: ' + (result.message || 'Erreur inconnue'));
        }
        
    } catch (error) {
        console.error('Error assigning date:', error);
        alert('Erreur lors de l\'assignation de la date');
    }
}
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
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

function getPriorityClass(priority) {
    const priorityClasses = {
        'Normale': 'bg-green-100 text-green-800 border border-green-300',
        'normale': 'bg-green-100 text-green-800 border border-green-300',
        'Importante': 'bg-orange-100 text-orange-800 border border-orange-300',
        'importante': 'bg-orange-100 text-orange-800 border border-orange-300',
        'Urgente': 'bg-red-100 text-red-800 border border-red-300',
        'urgente': 'bg-red-100 text-red-800 border border-red-300'
    };
    return priorityClasses[priority] || 'bg-gray-100 text-gray-800 border border-gray-300';
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

function getPriorityIcon(priority) {
    const priorityIcons = {
        'Normale': '<i class="fas fa-circle mr-1"></i>',
        'normale': '<i class="fas fa-circle mr-1"></i>',
        'Importante': '<i class="fas fa-exclamation mr-1"></i>',
        'importante': '<i class="fas fa-exclamation mr-1"></i>',
        'Urgente': '<i class="fas fa-exclamation-triangle mr-1"></i>',
        'urgente': '<i class="fas fa-exclamation-triangle mr-1"></i>'
    };
    return priorityIcons[priority] || '<i class="fas fa-circle mr-1"></i>';
}

function formatDate(dateString) {
    if (!dateString) return 'Non définie';
    
    // Handle DD/MM/YYYY format
    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${day}/${month}/${year}`;
        }
    }
    
    // Handle ISO date format
    try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('fr-FR');
        }
    } catch (e) {
        // Ignore parsing errors
    }
    
    return dateString;
}