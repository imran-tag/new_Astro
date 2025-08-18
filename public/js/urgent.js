// public/js/urgent.js - Urgent interventions page logic

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
                        ${getTimeIcon(intervention.hours_remaining || 0)} ${formatTimeRemaining(intervention.hours_remaining || 0)}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    ${escapeHtml(intervention.assigned_to || 'Non assigné')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        ${getActionButtons(intervention)}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;
}

function getActionButtons(intervention) {
    let buttons = [];
    
    // If technician is missing
    if (!intervention.technician_uid || intervention.technician_uid == 0) {
        buttons.push(`
            <button onclick="assignTechnician('${intervention.intervention_id}')" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs">
                <i class="fa fa-user-plus mr-1"></i>Assigner
            </button>
        `);
    }
    
    // If date is missing
    if (!intervention.date_time || intervention.date_time === '') {
        buttons.push(`
            <button onclick="setDate('${intervention.intervention_id}')" 
                    class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs">
                <i class="fa fa-calendar mr-1"></i>Date
            </button>
        `);
    }
    
    // Always show details button
    buttons.push(`
        <button onclick="viewDetails('${intervention.intervention_id}')" 
                class="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs">
            <i class="fa fa-eye mr-1"></i>Voir
        </button>
    `);
    
    return buttons.join('');
}

function displayError(message) {
    const tableBody = document.getElementById('urgent-table');
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="px-6 py-8 text-center text-red-500">
                <i class="fa fa-exclamation-triangle mr-2"></i>${escapeHtml(message)}
            </td>
        </tr>
    `;
}

function updatePagination(pagination) {
    const {
        currentPage = 1,
        totalPages = 0,
        totalCount = 0,
        hasNextPage = false,
        hasPrevPage = false,
        limit = 25
    } = pagination;

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

// Action functions (to be implemented based on your workflow)
function assignTechnician(interventionId) {
    alert(`Assigner un technicien à l'intervention ${interventionId}`);
    // TODO: Open modal or redirect to assignment page
}

function setDate(interventionId) {
    alert(`Définir une date pour l'intervention ${interventionId}`);
    // TODO: Open date picker modal
}

function viewDetails(interventionId) {
    alert(`Voir les détails de l'intervention ${interventionId}`);
    // TODO: Open details modal or redirect to details page
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

function getTimeRemainingClass(hours) {
    if (hours <= 0) return 'bg-red-100 text-red-800 border border-red-300';
    if (hours <= 6) return 'bg-red-100 text-red-800 border border-red-300';
    if (hours <= 12) return 'bg-orange-100 text-orange-800 border border-orange-300';
    if (hours <= 24) return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    return 'bg-green-100 text-green-800 border border-green-300';
}

function getStatusClass(status) {
    const statusClasses = {
        'Reçue': 'bg-blue-100 text-blue-800 border border-blue-300',
        'Assignée': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        'Planifiée': 'bg-green-100 text-green-800 border border-green-300',
        'En cours': 'bg-purple-100 text-purple-800 border border-purple-300',
        'Terminée': 'bg-gray-100 text-gray-800 border border-gray-300',
        'Maintenance SCH': 'bg-orange-100 text-orange-800 border border-orange-300',
        'Maintenance vivest': 'bg-red-100 text-red-800 border border-red-300',
        'Maintenance Moselis': 'bg-teal-100 text-teal-800 border border-teal-300',
        'Maintenance CDC': 'bg-cyan-100 text-cyan-800 border border-cyan-300',
        'Maintenance CDC Habitat': 'bg-lime-100 text-lime-800 border border-lime-300'
    };
    return statusClasses[status] || 'bg-cyan-100 text-cyan-800 border border-cyan-300';
}

function getMissingInfoClass(missingInfo) {
    switch(missingInfo) {
        case 'Technicien et Date manquants':
            return 'bg-red-100 text-red-800 border border-red-300';
        case 'Technicien manquant':
            return 'bg-orange-100 text-orange-800 border border-orange-300';
        case 'Date manquante':
            return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
        default:
            return 'bg-green-100 text-green-800 border border-green-300';
    }
}

function getStatusIconHtml(status) {
    const statusIcons = {
        'Reçue': '📨',
        'Assignée': '👤',
        'Planifiée': '📅',
        'En cours': '⚡',
        'Terminée': '✅',
        'Maintenance SCH': '🔧',
        'Maintenance VIVEST': '🔧',
        'Maintenance Moselis': '🔧',
        'Maintenance CDC': '🔧',
        'Maintenance CDC Habitat': '🔧'
    };
    return statusIcons[status] || '📋';
}

function getMissingIcon(missingInfo) {
    switch(missingInfo) {
        case 'Technicien et Date manquants':
            return '🚨';
        case 'Technicien manquant':
            return '👤❌';
        case 'Date manquante':
            return '📅❌';
        default:
            return '✅';
    }
}

function getTimeIcon(hours) {
    if (hours <= 0) return '⏰💥';
    if (hours <= 6) return '🚨';
    if (hours <= 12) return '⚠️';
    if (hours <= 24) return '⚡';
    return '✅';
}

function formatTimeRemaining(hours) {
    if (hours <= 0) return 'EXPIRÉ';
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    return `${Math.round(hours)}h`;
}