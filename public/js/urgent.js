// public/js/urgent.js - Enhanced urgent interventions page with description column

// Global variables for managing state
let currentPage = 1;
let currentFilters = {
    search: '',
    status: '',
    missing: '',
    timeFilter: ''
};
let currentSort = {
    field: 'hours_remaining',
    order: 'asc'
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Urgent interventions page loaded');
    initializeEventListeners();
    loadUrgentInterventions();
});

function initializeEventListeners() {
    // Filter event listeners
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const missingFilter = document.getElementById('missing-filter');
    const timeFilter = document.getElementById('time-filter');
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = this.value;
                currentPage = 1;
                loadUrgentInterventions();
            }, 500);
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            currentFilters.status = this.value;
            currentPage = 1;
            loadUrgentInterventions();
        });
    }
    
    if (missingFilter) {
        missingFilter.addEventListener('change', function() {
            currentFilters.missing = this.value;
            currentPage = 1;
            loadUrgentInterventions();
        });
    }
    
    if (timeFilter) {
        timeFilter.addEventListener('change', function() {
            currentFilters.timeFilter = this.value;
            currentPage = 1;
            loadUrgentInterventions();
        });
    }

    // Modal event listeners
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('assign-technician-btn')) {
            const interventionId = e.target.getAttribute('data-intervention-id');
            assignTechnician(interventionId);
        } else if (e.target.classList.contains('assign-date-btn')) {
            const interventionId = e.target.getAttribute('data-intervention-id');
            setDate(interventionId);
        }
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            const modals = ['technician-modal', 'date-modal'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && !modal.classList.contains('hidden')) {
                    closeModal(modalId);
                }
            });
        }
    });
}

// ============================================
// Data Loading Functions
// ============================================

function loadUrgentInterventions() {
    console.log('Loading urgent interventions with filters:', currentFilters);
    
    const params = new URLSearchParams({
        page: currentPage,
        limit: document.getElementById('results-per-page')?.value || '25',
        search: currentFilters.search,
        status: currentFilters.status,
        missing: currentFilters.missing,
        timeFilter: currentFilters.timeFilter,
        sortBy: currentSort.field,
        sortOrder: currentSort.order
    });

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
                <td colspan="9" class="px-6 py-8 text-center text-gray-500">
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
                <td class="px-6 py-4 text-sm text-gray-900 description-cell">
                    <div class="description-column" title="${escapeHtml(intervention.description || 'Aucune description')}">
                        ${escapeHtml(truncateText(intervention.description || 'Aucune description', 40))}
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

function displayError(message) {
    const tableBody = document.getElementById('urgent-table');
    tableBody.innerHTML = `
        <tr>
            <td colspan="9" class="px-6 py-8 text-center text-red-500">
                <i class="fa fa-exclamation-triangle mr-2"></i>${escapeHtml(message)}
            </td>
        </tr>
    `;
}

// ============================================
// Utility Functions
// ============================================

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
}

function getTimeRemainingClass(hoursRemaining) {
    if (hoursRemaining <= 0) return 'bg-red-100 text-red-800';
    if (hoursRemaining <= 6) return 'bg-red-100 text-red-800';
    if (hoursRemaining <= 12) return 'bg-orange-100 text-orange-800';
    if (hoursRemaining <= 24) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
}

function getStatusClass(status) {
    if (!status) return 'bg-gray-100 text-gray-800';
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('reçu') || lowerStatus.includes('nouveau')) {
        return 'bg-blue-100 text-blue-800';
    } else if (lowerStatus.includes('assigné') || lowerStatus.includes('planifié')) {
        return 'bg-yellow-100 text-yellow-800';
    } else if (lowerStatus.includes('cours') || lowerStatus.includes('démarré')) {
        return 'bg-orange-100 text-orange-800';
    } else if (lowerStatus.includes('terminé') || lowerStatus.includes('fini')) {
        return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
}

function getMissingInfoClass(missingInfo) {
    if (!missingInfo || missingInfo === 'Complet') return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
}

function getStatusIconHtml(status) {
    if (!status) return '<i class="fa fa-question-circle mr-1"></i>';
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('reçu') || lowerStatus.includes('nouveau')) {
        return '<i class="fa fa-inbox mr-1"></i>';
    } else if (lowerStatus.includes('assigné') || lowerStatus.includes('planifié')) {
        return '<i class="fa fa-user-check mr-1"></i>';
    } else if (lowerStatus.includes('cours') || lowerStatus.includes('démarré')) {
        return '<i class="fa fa-play mr-1"></i>';
    } else if (lowerStatus.includes('terminé') || lowerStatus.includes('fini')) {
        return '<i class="fa fa-check-circle mr-1"></i>';
    }
    return '<i class="fa fa-circle mr-1"></i>';
}

function getMissingIcon(missingInfo) {
    if (!missingInfo || missingInfo === 'Complet') return '<i class="fa fa-check mr-1"></i>';
    if (missingInfo.includes('Technicien')) return '<i class="fa fa-user-times mr-1"></i>';
    if (missingInfo.includes('Date')) return '<i class="fa fa-calendar-times mr-1"></i>';
    return '<i class="fa fa-exclamation mr-1"></i>';
}

function getTimeIcon(hoursRemaining) {
    if (hoursRemaining <= 0) return '<i class="fa fa-exclamation-triangle mr-1"></i>';
    if (hoursRemaining <= 6) return '<i class="fa fa-clock mr-1"></i>';
    if (hoursRemaining <= 12) return '<i class="fa fa-clock mr-1"></i>';
    if (hoursRemaining <= 24) return '<i class="fa fa-clock mr-1"></i>';
    return '<i class="fa fa-clock mr-1"></i>';
}

function formatTimeRemaining(hours) {
    if (hours === null || hours === undefined) return 'N/A';
    if (hours <= 0) return 'Expiré';
    if (hours < 1) return Math.round(hours * 60) + 'min';
    return Math.round(hours) + 'h';
}

// ============================================
// Pagination Functions
// ============================================

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

// ============================================
// Navigation Functions
// ============================================

function goToPage(page) {
    currentPage = page;
    loadUrgentInterventions();
}

function changeResultsPerPage() {
    currentPage = 1;
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

// ============================================
// Action Functions
// ============================================

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

// ============================================
// Modal Functions
// ============================================

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
        
        if (select) {
            select.innerHTML = '<option value="">Sélectionner un technicien</option>';
            technicians.forEach(tech => {
                select.innerHTML += `<option value="${tech.uid}">${tech.firstname} ${tech.lastname}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading technicians:', error);
        const select = document.getElementById('technician-select');
        if (select) {
            select.innerHTML = '<option value="">Erreur lors du chargement</option>';
        }
    }
}

async function confirmTechnicianAssignment() {
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
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                interventionId: interventionId,
                technicianId: technicianId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Technicien assigné avec succès');
            closeModal('technician-modal');
            loadUrgentInterventions(); // Refresh the table
        } else {
            alert('Erreur: ' + (result.message || 'Échec de l\'assignation'));
        }
    } catch (error) {
        console.error('Error assigning technician:', error);
        alert('Erreur lors de l\'assignation du technicien');
    }
}

async function confirmDateAssignment() {
    const interventionId = document.getElementById('date-modal-intervention-id').value;
    const date = document.getElementById('intervention-date').value;
    const time = document.getElementById('intervention-time').value;
    
    if (!date) {
        alert('Veuillez sélectionner une date');
        return;
    }
    
    // Convert date from YYYY-MM-DD to DD/MM/YYYY format (as used in old system)
    const dateParts = date.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    
    try {
        const response = await fetch('/nodetest/api/assign-date', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                interventionId: interventionId,
                date: formattedDate,
                time: time
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Date assignée avec succès');
            closeModal('date-modal');
            loadUrgentInterventions(); // Refresh the table
        } else {
            alert('Erreur: ' + (result.message || 'Échec de l\'assignation de la date'));
        }
    } catch (error) {
        console.error('Error assigning date:', error);
        alert('Erreur lors de l\'assignation de la date');
    }
}