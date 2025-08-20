// public/js/allInterventions.js - All interventions page with FIXED date range functionality

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
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                currentFilters.search = searchInput.value;
                currentPage = 1;
                loadInterventions();
            }, 500);
        });
    }

    // Sort change listeners
    const sortBy = document.getElementById('sort-by');
    if (sortBy) {
        sortBy.addEventListener('change', function() {
            currentFilters.sortBy = this.value;
            currentPage = 1;
            loadInterventions();
        });
    }
    
    const sortOrder = document.getElementById('sort-order');
    if (sortOrder) {
        sortOrder.addEventListener('change', function() {
            currentFilters.sortOrder = this.value;
            currentPage = 1;
            loadInterventions();
        });
    }

    // Date filter listeners - removed auto-apply to rely on manual apply
    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            // Clear preset when manual date is selected
            const datePreset = document.getElementById('date-preset');
            if (datePreset) {
                datePreset.value = '';
            }
        });
    }

    // Date preset listener
    const datePreset = document.getElementById('date-preset');
    if (datePreset) {
        datePreset.addEventListener('change', function() {
            const preset = this.value;
            if (preset) {
                const dateRange = getDateRangeFromPreset(preset);
                if (dateRange && dateFilter) {
                    // Set the date filter to the range format
                    dateFilter.value = dateRange.startDate;
                    // Store the full range for filtering
                    currentFilters.date = dateRange.range;
                    console.log('Date preset applied:', preset, 'Range:', dateRange.range);
                }
            }
        });
    }
}

function applyFilters() {
    // Get all filter values with safety checks
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const technicianFilter = document.getElementById('technician-filter');
    const dateFilter = document.getElementById('date-filter');
    
    const search = searchInput ? searchInput.value : '';
    const status = statusFilter ? statusFilter.value : '';
    const priority = priorityFilter ? priorityFilter.value : '';
    const technician = technicianFilter ? technicianFilter.value : '';
    const date = dateFilter ? dateFilter.value : '';
    
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
    
    // For date, check if we have a preset range stored, otherwise use the date input
    if (!currentFilters.date || !currentFilters.date.includes(' - ')) {
        currentFilters.date = date;
    }
    
    currentPage = 1;
    loadInterventions();
}

function clearFilters() {
    // Reset filter inputs with safety checks
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const technicianFilter = document.getElementById('technician-filter');
    const dateFilter = document.getElementById('date-filter');
    const datePreset = document.getElementById('date-preset');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (priorityFilter) priorityFilter.value = '';
    if (technicianFilter) technicianFilter.value = '';
    if (dateFilter) dateFilter.value = '';
    if (datePreset) datePreset.value = '';
    
    // Reset internal filters
    currentFilters = {
        search: '',
        status: '',
        priority: '',
        technician: '',
        date: '',
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
        limit: currentFilters.limit
    };
    
    currentPage = 1;
    loadInterventions();
}

function clearDateFilter() {
    const dateFilter = document.getElementById('date-filter');
    const datePreset = document.getElementById('date-preset');
    
    if (dateFilter) dateFilter.value = '';
    if (datePreset) datePreset.value = '';
    currentFilters.date = '';
    currentPage = 1;
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

// FIXED: Updated to return proper date ranges instead of single dates
function getDateRangeFromPreset(preset) {
    const today = new Date();
    
    // Helper function to format date as DD/MM/YYYY (database format)
    function formatDateDb(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    
    // Helper function to format date as YYYY-MM-DD (for input field)
    function formatDateInput(date) {
        return date.toISOString().split('T')[0];
    }
    
    // Helper function to get the start of week (Monday)
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }
    
    // Helper function to get the end of week (Sunday)
    function getWeekEnd(date) {
        const start = getWeekStart(date);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return end;
    }
    
    switch (preset) {
        case 'today':
            return {
                startDate: formatDateInput(today),
                range: formatDateDb(today)
            };
            
        case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return {
                startDate: formatDateInput(yesterday),
                range: formatDateDb(yesterday)
            };
            
        case 'this-week':
            const thisWeekStart = getWeekStart(new Date(today));
            const thisWeekEnd = getWeekEnd(new Date(today));
            return {
                startDate: formatDateInput(thisWeekStart),
                range: `${formatDateDb(thisWeekStart)} - ${formatDateDb(thisWeekEnd)}`
            };
            
        case 'last-week':
            const lastWeekStart = getWeekStart(new Date(today));
            lastWeekStart.setDate(lastWeekStart.getDate() - 7);
            const lastWeekEnd = getWeekEnd(new Date(lastWeekStart));
            return {
                startDate: formatDateInput(lastWeekStart),
                range: `${formatDateDb(lastWeekStart)} - ${formatDateDb(lastWeekEnd)}`
            };
            
        case 'this-month':
            const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return {
                startDate: formatDateInput(thisMonthStart),
                range: `${formatDateDb(thisMonthStart)} - ${formatDateDb(thisMonthEnd)}`
            };
            
        case 'last-month':
            const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            return {
                startDate: formatDateInput(lastMonthStart),
                range: `${formatDateDb(lastMonthStart)} - ${formatDateDb(lastMonthEnd)}`
            };
            
        default:
            return null;
    }
}

function displayInterventions(interventions) {
    const tableBody = document.getElementById('interventions-table');
    
    if (!interventions || interventions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-8 text-center text-gray-500">
                    <i class="fa fa-info-circle mr-2"></i>Aucune intervention trouvée
                </td>
            </tr>
        `;
        return;
    }

    const rows = interventions.map(intervention => {
        const statusClass = getStatusClass(intervention.status);
        const priorityClass = getPriorityClass(intervention.priority);
        
        // Determine which actions are available based on status
        const isCompleted = intervention.status && intervention.status.toLowerCase().includes('terminé');
        const hasPublicNumber = intervention.public_number && intervention.public_number !== '';
        
        // Build action buttons
        let actionButtons = '';
        
        // Edit button (always available)
        actionButtons += `
            <button onclick="editIntervention('${intervention.intervention_id}')" 
                    class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 mr-1 mb-1" 
                    title="Modifier">
                <i class="fa fa-pencil mr-1"></i>Modifier
            </button>`;
        
        // Download button (only for completed interventions)
        if (isCompleted) {
            actionButtons += `
                <button onclick="downloadIntervention('${intervention.intervention_id}')" 
                        class="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded hover:bg-green-200 mr-1 mb-1" 
                        title="Télécharger">
                    <i class="fa fa-download mr-1"></i>Télécharger
                </button>`;
        }
        
        // Public link button (for completed interventions - always show if completed)
        if (isCompleted) {
            actionButtons += `
                <button onclick="openPublicLink('${intervention.intervention_id}')" 
                        class="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded hover:bg-purple-200 mr-1 mb-1" 
                        title="Ouvrir le lien public">
                    <i class="fa fa-link mr-1"></i>Lien Public
                </button>`;
        }
        
        // Delete button (always available)
        actionButtons += `
            <button onclick="deleteIntervention('${intervention.intervention_id}')" 
                    class="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 mr-1 mb-1" 
                    title="Supprimer">
                <i class="fa fa-trash mr-1"></i>Supprimer
            </button>`;
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #${intervention.intervention_id || 'N/A'}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate" title="${escapeHtml(intervention.title || '')}">
                        ${escapeHtml(intervention.title || 'Sans titre')}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs" title="${escapeHtml(intervention.description || '')}">
                        ${escapeHtml(truncateText(intervention.description || 'Aucune description', 50))}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate" title="${escapeHtml(intervention.address || '')}">
                        ${escapeHtml(intervention.address || 'Adresse non définie')}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${getStatusIcon(intervention.status)} ${escapeHtml(intervention.status || 'N/A')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityClass}">
                        ${getPriorityIcon(intervention.priority)} ${escapeHtml(intervention.priority || 'N/A')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(intervention.date_time || 'Non définie')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(intervention.assigned_to || 'Non assigné')}
                </td>
                <td class="px-6 py-4 text-sm">
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
    const tableBody = document.getElementById('interventions-table');
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="px-6 py-8 text-center text-red-500">
                <i class="fa fa-exclamation-triangle mr-2"></i>${escapeHtml(message)}
            </td>
        </tr>
    `;
}

// Utility functions
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
    } else if (lowerStatus.includes('facturé')) {
        return 'bg-purple-100 text-purple-800';
    } else if (lowerStatus.includes('payé')) {
        return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
}

function getPriorityClass(priority) {
    if (!priority) return 'bg-gray-100 text-gray-800';
    const lowerPriority = priority.toLowerCase();
    
    if (lowerPriority.includes('urgente')) {
        return 'bg-red-100 text-red-800';
    } else if (lowerPriority.includes('importante')) {
        return 'bg-orange-100 text-orange-800';
    } else if (lowerPriority.includes('normale')) {
        return 'bg-gray-100 text-gray-800';
    }
    return 'bg-gray-100 text-gray-800';
}

function getStatusIcon(status) {
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
    } else if (lowerStatus.includes('facturé')) {
        return '<i class="fa fa-euro-sign mr-1"></i>';
    } else if (lowerStatus.includes('payé')) {
        return '<i class="fa fa-money-bill mr-1"></i>';
    }
    return '<i class="fa fa-circle mr-1"></i>';
}

function getPriorityIcon(priority) {
    if (!priority) return '<i class="fa fa-flag mr-1"></i>';
    const lowerPriority = priority.toLowerCase();
    
    if (lowerPriority.includes('urgente')) {
        return '<i class="fa fa-exclamation-triangle mr-1"></i>';
    } else if (lowerPriority.includes('importante')) {
        return '<i class="fa fa-exclamation mr-1"></i>';
    } else if (lowerPriority.includes('normale')) {
        return '<i class="fa fa-flag mr-1"></i>';
    }
    return '<i class="fa fa-flag mr-1"></i>';
}

// Pagination functions
function updatePagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    
    if (!paginationContainer) {
        console.warn('Pagination container not found');
        return;
    }
    
    if (!pagination || pagination.totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const { currentPage: page, totalPages, hasNextPage, hasPrevPage, limit, totalCount } = pagination;
    
    // Update stats if elements exist
    const showingStart = document.getElementById('showing-start');
    const showingEnd = document.getElementById('showing-end');
    const totalResults = document.getElementById('total-results');
    
    if (showingStart && showingEnd && totalResults) {
        const start = totalCount === 0 ? 0 : ((page - 1) * limit) + 1;
        const end = Math.min(page * limit, totalCount);
        
        showingStart.textContent = start;
        showingEnd.textContent = end;
        totalResults.textContent = totalCount;
    }
    
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
                    Page ${page} sur ${totalPages} (${totalCount} résultat${totalCount !== 1 ? 's' : ''})
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
    // Try to update stats display if element exists
    const statsDisplay = document.getElementById('stats-display') || document.getElementById('total-count');
    if (statsDisplay) {
        statsDisplay.textContent = `${totalCount} intervention${totalCount !== 1 ? 's' : ''}`;
    }
}

function goToPage(page) {
    currentPage = page;
    loadInterventions();
}

function changePageSize() {
    const newSize = document.getElementById('page-size').value;
    currentFilters.limit = parseInt(newSize);
    currentPage = 1;
    loadInterventions();
}

// ============================================
// Action Functions
// ============================================

function editIntervention(interventionId) {
    // Redirect to modification page (following old Astro pattern)
    window.location.href = `/nodetest/interventions/modification/${interventionId}`;
}

function downloadIntervention(interventionId) {
    // Show download choice modal
    const modal = document.getElementById('download-modal');
    if (modal) {
        document.getElementById('download-intervention-id').value = interventionId;
        modal.classList.remove('hidden');
    }
}

function downloadRapport() {
    const interventionId = document.getElementById('download-intervention-id').value;
    if (!interventionId) return;
    
    // Close modal
    closeModal('download-modal');
    
    // Call API to generate and download rapport
    showLoading('Génération du rapport...');
    
    fetch('/nodetest/api/generate-rapport', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            interventionId: interventionId
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        
        // Handle response like old_Astro format
        if ((data.success && data.url) || (data.code === '1' && data.url)) {
            // Create temporary download link
            const link = document.createElement('a');
            link.href = data.url;
            link.download = data.name || data.filename || `rapport_${interventionId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showSuccess('Rapport généré et téléchargé avec succès');
        } else {
            showError('Erreur lors de la génération du rapport');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error generating rapport:', error);
        showError('Erreur lors de la génération du rapport');
    });
}


function downloadQuitus() {
    const interventionId = document.getElementById('download-intervention-id').value;
    if (!interventionId) return;
    
    // Close modal
    closeModal('download-modal');
    
    // Call API to generate and download quitus
    showLoading('Génération du quitus...');
    
    fetch('/nodetest/api/generate-quitus', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            interventionId: interventionId
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        
        // Handle response like old_Astro format
        if ((data.success && data.url) || (data.code === '1' && data.url)) {
            // Create temporary download link
            const link = document.createElement('a');
            link.href = data.url;
            link.download = data.name || data.filename || `quitus_${interventionId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showSuccess('Quitus généré et téléchargé avec succès');
        } else {
            showError('Erreur lors de la génération du quitus');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error generating quitus:', error);
        showError('Erreur lors de la génération du quitus');
    });
}

function openPublicLink(interventionId) {
    // Open public intervention page in new tab using intervention ID
    const url = `/nodetest/interventions/public/${interventionId}`;
    window.open(url, '_blank');
}

function showSuccess(message) {
    // Create or update success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fa fa-check-circle mr-2"></i>
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

function showError(message) {
    // Create or update error notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fa fa-exclamation-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function showLoading(message = 'Chargement...') {
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    overlay.innerHTML = `
        <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="text-gray-700 font-medium">${message}</span>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
}

function deleteIntervention(interventionId) {
    // Show delete confirmation modal
    const modal = document.getElementById('delete-modal');
    if (modal) {
        document.getElementById('delete-intervention-id').value = interventionId;
        modal.classList.remove('hidden');
    }
}

function confirmDelete() {
    const interventionId = document.getElementById('delete-intervention-id').value;
    if (!interventionId) return;
    
    // Close modal
    closeModal('delete-modal');
    
    showLoading('Suppression en cours...');
    
    fetch('/nodetest/api/delete-intervention', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            interventionId: interventionId
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            showSuccess('Intervention supprimée avec succès');
            // Reload the current page
            loadInterventions();
        } else {
            showError('Erreur lors de la suppression de l\'intervention');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error deleting intervention:', error);
        showError('Erreur lors de la suppression de l\'intervention');
    });
}

// ============================================
// Modal Functions
// ============================================

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ============================================
// UI Helper Functions
// ============================================

function showLoading(message = 'Chargement...') {
    // Create or show loading overlay
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center';
        overlay.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg">
                <div class="flex items-center">
                    <i class="fa fa-spinner fa-spin mr-3 text-blue-600"></i>
                    <span id="loading-message">${message}</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        document.getElementById('loading-message').textContent = message;
        overlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function showError(message) {
    // Simple alert for now, could be replaced with a nice modal
    alert('Erreur: ' + message);
}

function showSuccess(message) {
    // Simple alert for now, could be replaced with a nice modal
    alert('Succès: ' + message);
}