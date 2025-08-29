// public/js/chantiersDashboard.js - Frontend JavaScript for chantiers dashboard

console.log('Chantiers Dashboard JS loaded');

// Global variables
let currentChantier = null;
let currentPage = 1;
let currentFilters = {};
let technicians = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chantiers Dashboard loaded');
    loadChantiersData();
    loadTechnicians();
});

// ============================================
// Data Loading Functions
// ============================================

function refreshData() {
    console.log('Refreshing chantiers data...');
    loadChantiersData();
}

function loadChantiersData() {
    console.log('Loading chantiers stats...');
    
    // Show loading state
    document.getElementById('loading-chantiers').classList.remove('hidden');
    document.getElementById('chantiers-grid').classList.add('hidden');
    document.getElementById('empty-chantiers').classList.add('hidden');
    
    fetch('/nodetest/api/chantiers/stats')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Chantiers data loaded:', data);
            displayChantiersStats(data);
            displayChantiersGrid(data.chantiers);
        })
        .catch(error => {
            console.error('Error loading chantiers data:', error);
            displayChantiersError('Erreur lors du chargement des données des chantiers');
        });
}

function loadTechnicians() {
    fetch('/nodetest/api/technicians')
        .then(response => response.json())
        .then(data => {
            technicians = data;
            updateTechniciansFilter();
        })
        .catch(error => {
            console.error('Error loading technicians:', error);
        });
}

function loadChantierInterventions(chantierUid, page = 1) {
    console.log(`Loading interventions for chantier ${chantierUid}, page ${page}`);
    
    // Build query parameters
    const params = new URLSearchParams({
        page: page,
        limit: 20,
        ...currentFilters
    });
    
    const url = `/nodetest/api/chantiers/${chantierUid}/interventions?${params.toString()}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Chantier interventions loaded:', data);
            displayInterventionsTable(data.interventions);
            displayPagination(data.pagination);
            currentPage = data.pagination.current_page;
        })
        .catch(error => {
            console.error('Error loading chantier interventions:', error);
            displayInterventionsError('Erreur lors du chargement des interventions');
        });
}

// ============================================
// Display Functions
// ============================================

function displayChantiersStats(data) {
    const totals = data.totals;
    
    // Update stats
    document.getElementById('total-chantiers').textContent = totals.total_chantiers;
    document.getElementById('total-interventions').textContent = totals.total_interventions;
    document.getElementById('active-interventions').textContent = totals.active_interventions;
    document.getElementById('completed-interventions').textContent = totals.completed_interventions;
}

function displayChantiersGrid(chantiers) {
    const grid = document.getElementById('chantiers-grid');
    const loading = document.getElementById('loading-chantiers');
    const empty = document.getElementById('empty-chantiers');
    
    loading.classList.add('hidden');
    
    if (!chantiers || chantiers.length === 0) {
        empty.classList.remove('hidden');
        return;
    }
    
    // Build chantiers cards
    const cardsHTML = chantiers.map(chantier => {
        const totalCount = parseInt(chantier.interventions_count);
        const activeCount = parseInt(chantier.active_count);
        const completedCount = parseInt(chantier.completed_count);
        
        return `
            <div class="chantier-card bg-white rounded-lg shadow-md p-6" 
                 onclick="openChantierModal(${chantier.uid}, '${escapeHtml(chantier.number)} - ${escapeHtml(chantier.title)}')">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="font-bold text-lg text-gray-900 mb-1">
                            <span class="text-orange-600">#${chantier.number}</span>
                        </h3>
                        <p class="text-sm text-gray-600 line-clamp-2" title="${escapeHtml(chantier.title)}">
                            ${escapeHtml(chantier.title)}
                        </p>
                    </div>
                    <div class="flex-shrink-0 ml-3">
                        <i class="fas fa-hard-hat text-2xl text-orange-500"></i>
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-3 mb-4">
                    <div class="text-center">
                        <div class="stat-badge total-badge w-full justify-center">
                            <span>${totalCount}</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Total</p>
                    </div>
                    <div class="text-center">
                        <div class="stat-badge active-badge w-full justify-center">
                            <span>${activeCount}</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">En cours</p>
                    </div>
                    <div class="text-center">
                        <div class="stat-badge completed-badge w-full justify-center">
                            <span>${completedCount}</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Terminées</p>
                    </div>
                </div>
                
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-500">
                        <i class="fas fa-chart-bar mr-1"></i>
                        ${totalCount} interventions
                    </span>
                    <span class="text-orange-600 font-medium">
                        Voir détails <i class="fas fa-arrow-right ml-1"></i>
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = cardsHTML;
    grid.classList.remove('hidden');
}

function displayInterventionsTable(interventions) {
    const tableBody = document.getElementById('interventions-table');
    
    if (!interventions || interventions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-info-circle mr-2"></i>
                    Aucune intervention trouvée avec ces critères
                </td>
            </tr>
        `;
        return;
    }
    
    const rows = interventions.map(intervention => {
        const statusClass = getStatusClass(intervention.status_uid);
        const priorityClass = getPriorityClass(intervention.priority);
        const formattedDate = formatDate(intervention.date_time);
        const technicianName = intervention.technician_firstname && intervention.technician_lastname 
            ? `${intervention.technician_firstname} ${intervention.technician_lastname}`
            : 'Non assigné';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #${intervention.intervention_id || 'N/A'}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate" title="${escapeHtml(intervention.title || '')}">
                        ${escapeHtml(intervention.title || 'Sans titre')}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${escapeHtml(intervention.address || '')} ${escapeHtml(intervention.city || '')}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formattedDate}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${escapeHtml(intervention.status || 'Inconnu')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(technicianName)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityClass}">
                        ${escapeHtml(intervention.priority || 'Normale')}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
}

function displayPagination(pagination) {
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');
    
    // Update info
    const start = ((pagination.current_page - 1) * pagination.per_page) + 1;
    const end = Math.min(pagination.current_page * pagination.per_page, pagination.total_records);
    
    paginationInfo.innerHTML = `
        Affichage ${start} à ${end} sur ${pagination.total_records} interventions
    `;
    
    // Update controls
    let controlsHTML = '';
    
    // Previous button
    if (pagination.current_page > 1) {
        controlsHTML += `
            <button onclick="changePage(${pagination.current_page - 1})" 
                    class="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
    }
    
    // Page numbers
    const startPage = Math.max(1, pagination.current_page - 2);
    const endPage = Math.min(pagination.total_pages, pagination.current_page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === pagination.current_page 
            ? 'bg-orange-600 text-white' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700';
        
        controlsHTML += `
            <button onclick="changePage(${i})" 
                    class="px-3 py-1 text-sm ${activeClass} rounded-md transition-colors">
                ${i}
            </button>
        `;
    }
    
    // Next button
    if (pagination.current_page < pagination.total_pages) {
        controlsHTML += `
            <button onclick="changePage(${pagination.current_page + 1})" 
                    class="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }
    
    paginationControls.innerHTML = controlsHTML;
}

function displayChantiersError(message) {
    const loading = document.getElementById('loading-chantiers');
    const grid = document.getElementById('chantiers-grid');
    const empty = document.getElementById('empty-chantiers');
    
    loading.classList.add('hidden');
    grid.classList.add('hidden');
    
    empty.innerHTML = `
        <div class="p-8 text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
            <p class="text-red-600">${message}</p>
            <button onclick="loadChantiersData()" class="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                <i class="fas fa-redo mr-2"></i>Réessayer
            </button>
        </div>
    `;
    empty.classList.remove('hidden');
}

function displayInterventionsError(message) {
    const tableBody = document.getElementById('interventions-table');
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-8 text-center text-red-500">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                ${message}
            </td>
        </tr>
    `;
}

function updateTechniciansFilter() {
    const technicianFilter = document.getElementById('filter-technician');
    
    let optionsHTML = '<option value="all">Tous les techniciens</option>';
    technicians.forEach(tech => {
        optionsHTML += `<option value="${tech.uid}">${tech.firstname} ${tech.lastname}</option>`;
    });
    
    technicianFilter.innerHTML = optionsHTML;
}

// ============================================
// Modal Functions
// ============================================

function openChantierModal(chantierUid, chantierTitle) {
    console.log(`Opening modal for chantier ${chantierUid}: ${chantierTitle}`);
    
    currentChantier = chantierUid;
    currentPage = 1;
    currentFilters = {};
    
    // Update modal title
    document.getElementById('modal-title').innerHTML = `
        <i class="fas fa-hard-hat mr-2"></i>
        ${chantierTitle}
    `;
    
    // Reset filters
    clearFilters();
    
    // Show modal
    document.getElementById('chantier-modal').classList.remove('hidden');
    
    // Load interventions
    loadChantierInterventions(chantierUid, 1);
}

function closeModal() {
    document.getElementById('chantier-modal').classList.add('hidden');
    currentChantier = null;
    currentPage = 1;
    currentFilters = {};
}

// ============================================
// Filter Functions
// ============================================

function applyFilters() {
    if (!currentChantier) return;
    
    // Collect filter values
    currentFilters = {
        status: document.getElementById('filter-status').value,
        technician: document.getElementById('filter-technician').value,
        priority: document.getElementById('filter-priority').value,
        date_start: document.getElementById('filter-date-start').value,
        date_end: document.getElementById('filter-date-end').value
    };
    
    // Remove empty filters
    Object.keys(currentFilters).forEach(key => {
        if (!currentFilters[key] || currentFilters[key] === 'all') {
            delete currentFilters[key];
        }
    });
    
    console.log('Applying filters:', currentFilters);
    
    // Load filtered data
    currentPage = 1;
    loadChantierInterventions(currentChantier, 1);
}

function clearFilters() {
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-technician').value = 'all';
    document.getElementById('filter-priority').value = 'all';
    document.getElementById('filter-date-start').value = '';
    document.getElementById('filter-date-end').value = '';
    
    currentFilters = {};
    
    if (currentChantier) {
        currentPage = 1;
        loadChantierInterventions(currentChantier, 1);
    }
}

function changePage(page) {
    if (!currentChantier || page < 1) return;
    
    loadChantierInterventions(currentChantier, page);
}

// ============================================
// Utility Functions
// ============================================

function getStatusClass(statusUid) {
    switch(statusUid) {
        case 1: return 'bg-blue-100 text-blue-800'; // Reçu
        case 2: return 'bg-yellow-100 text-yellow-800'; // Assigné
        case 3: 
        case 4: 
        case 5: 
        case 6: return 'bg-orange-100 text-orange-800'; // En cours
        case 7: return 'bg-green-100 text-green-800'; // Terminé
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getPriorityClass(priority) {
    switch(priority?.toLowerCase()) {
        case 'haute': return 'bg-red-100 text-red-800';
        case 'moyenne': return 'bg-yellow-100 text-yellow-800';
        case 'basse': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal when clicking outside
document.getElementById('chantier-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});