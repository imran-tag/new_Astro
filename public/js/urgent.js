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
    const pageSize = document.getElementById('page-size').value;
    
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

    fetch(`/nodetest/api/urgent-all?${params}`)
        .then(response => response.json())
        .then(result => {
            displayInterventions(result.data);
            updatePagination(result.pagination);
            updateStats(result.pagination.totalCount);
        })
        .catch(error => {
            console.error('Error loading urgent interventions:', error);
            const tbody = document.getElementById('urgent-table');
            tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-red-500">Erreur de chargement des données</td></tr>';
        });
}

function displayInterventions(interventions) {
    const tbody = document.getElementById('urgent-table');
    
    if (interventions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">Aucune intervention trouvée</td></tr>';
        return;
    }

    tbody.innerHTML = interventions.map(item => {
        const statusClass = getStatusClass(item.status);
        const statusIcon = getStatusIconHtml(item.status);
        
        // Format hours remaining
        const hoursRemaining = parseInt(item.hours_remaining) || 0;
        let timeDisplay = '';
        let rowClass = '';
        
        if (hoursRemaining <= 0) {
            timeDisplay = '<span class="text-red-600 font-bold">⚠️ EXPIRÉ</span>';
            rowClass = 'bg-red-50 border-l-4 border-red-500';
        } else if (hoursRemaining <= 6) {
            timeDisplay = `<span class="text-red-600 font-bold">🔥 ${hoursRemaining}h</span>`;
            rowClass = 'bg-red-50 border-l-4 border-red-400';
        } else if (hoursRemaining <= 12) {
            timeDisplay = `<span class="text-orange-600 font-semibold">⚡ ${hoursRemaining}h</span>`;
            rowClass = 'bg-orange-50 border-l-4 border-orange-400';
        } else if (hoursRemaining <= 24) {
            timeDisplay = `<span class="text-yellow-600 font-semibold">⏳ ${hoursRemaining}h</span>`;
            rowClass = 'bg-yellow-50 border-l-4 border-yellow-400';
        } else {
            timeDisplay = `<span class="text-green-600">✅ ${hoursRemaining}h</span>`;
            rowClass = 'bg-green-50 border-l-4 border-green-400';
        }
        
        // Format missing info
        let missingDisplay = '';
        switch(item.missing_info) {
            case 'Technicien et Date manquants':
                missingDisplay = '<span class="text-red-600 font-bold">👤📅 Technicien + Date</span>';
                break;
            case 'Technicien manquant':
                missingDisplay = '<span class="text-orange-600 font-semibold">👤 Technicien</span>';
                break;
            case 'Date manquante':
                missingDisplay = '<span class="text-yellow-600 font-semibold">📅 Date</span>';
                break;
            default:
                missingDisplay = '<span class="text-green-600">✅ Complet</span>';
        }

        return `
            <tr class="hover:bg-gray-50 ${rowClass}">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">${item.intervention_id || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.title || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.address || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${statusIcon} ${item.status || '-'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${missingDisplay}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${timeDisplay}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.assigned_to || 'Non assigné'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="assignTechnician('${item.intervention_id}')" class="text-blue-600 hover:text-blue-900" title="Assigner technicien">
                            <i class="fa fa-user-plus"></i>
                        </button>
                        <button onclick="setDate('${item.intervention_id}')" class="text-green-600 hover:text-green-900" title="Définir date">
                            <i class="fa fa-calendar-plus"></i>
                        </button>
                        <button onclick="viewDetails('${item.intervention_id}')" class="text-gray-600 hover:text-gray-900" title="Voir détails">
                            <i class="fa fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updatePagination(pagination) {
    const { currentPage, totalPages, totalCount, hasNextPage, hasPrevPage } = pagination;
    
    // Update showing info
    const start = totalCount === 0 ? 0 : ((currentPage - 1) * pagination.limit) + 1;
    const end = Math.min(currentPage * pagination.limit, totalCount);
    
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

// Status utility functions (reused from dashboard)
function getStatusClass(status) {
    const statusClasses = {
        'Reçue': 'status-received',
        'Assignée': 'status-assigned',
        'Planifiée': 'status-assigned',
        'En cours': 'status-in-progress',
        'Terminée': 'status-completed',
        'Facturée': 'status-billed',
        'Payée': 'status-paid',
        'Maintenance SCH': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        'Maintenance VIVEST': 'bg-orange-100 text-orange-800 border border-orange-300',
        'Maintenance MOSELIS': 'bg-blue-100 text-blue-800 border border-blue-300',
        'Maintenance CDC': 'bg-green-100 text-green-800 border border-green-300',
        'Maintenance CDC Habitat': 'bg-green-100 text-green-800 border border-green-300',
        'CHANTIER': 'bg-purple-100 text-purple-800 border border-purple-300',
        'Pausée': 'bg-gray-100 text-gray-800',
        'Annulée': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
}

function getStatusIconHtml(status) {
    const statusIcons = {
        'Reçue': '<i class="fa fa-clock-o mr-1"></i>',
        'Assignée': '<i class="fa fa-calendar mr-1"></i>',
        'Planifiée': '<i class="fa fa-calendar-check-o mr-1"></i>',
        'En cours': '<i class="fa fa-cog fa-spin mr-1"></i>',
        'Terminée': '<i class="fa fa-check-circle mr-1"></i>',
        'Facturée': '<i class="fa fa-euro mr-1"></i>',
        'Payée': '<i class="fa fa-check-circle-o mr-1"></i>',
        'Maintenance SCH': '<i class="fa fa-building mr-1" style="color: #eab308;"></i>',
        'Maintenance VIVEST': '<i class="fa fa-home mr-1" style="color: #f59e0b;"></i>',
        'Maintenance MOSELIS': '<i class="fa fa-cogs mr-1" style="color: #3b82f6;"></i>',
        'Maintenance CDC': '<i class="fa fa-wrench mr-1" style="color: #10b981;"></i>',
        'Maintenance CDC Habitat': '<i class="fa fa-wrench mr-1" style="color: #10b981;"></i>',
        'CHANTIER': '<i class="fa fa-hard-hat mr-1" style="color: #8b5cf6;"></i>',
        'Pausée': '<i class="fa fa-pause mr-1"></i>',
        'Annulée': '<i class="fa fa-times-circle mr-1"></i>'
    };
    return statusIcons[status] || '<i class="fa fa-question mr-1"></i>';
}