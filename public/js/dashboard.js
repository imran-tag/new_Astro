// public/js/dashboard.js - Enhanced with colors, icons, tooltips, and working filters

// Global variables
let currentFilter = null;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkConnection();
    setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
});

// ============================================
// Connection and Data Loading Functions
// ============================================

function checkConnection() {
    fetch('/nodetest/api/test-db')
        .then(response => response.json())
        .then(data => {
            const statusEl = document.getElementById('connection-status');
            if (data.success) {
                statusEl.textContent = 'Connecté (' + (data.totalInterventions || 0) + ' interventions)';
                statusEl.className = 'text-sm text-green-600 font-medium';
            } else {
                statusEl.textContent = 'Erreur DB';
                statusEl.className = 'text-sm text-red-600 font-medium';
            }
            loadDashboardData();
        })
        .catch(error => {
            console.error('Connection check failed:', error);
            const statusEl = document.getElementById('connection-status');
            statusEl.textContent = 'Hors ligne';
            statusEl.className = 'text-sm text-red-600 font-medium';
            loadDashboardData();
        });
}

function loadDashboardData() {
    loadStats();
    loadUrgent();
    loadRecent();
}

function loadStats() {
    fetch('/nodetest/api/stats')
        .then(response => response.json())
        .then(stats => {
            updateStat('stat-received', stats.received);
            updateStat('stat-assigned', stats.assigned);
            updateStat('stat-inProgress', stats.inProgress);
            updateStat('stat-completed', stats.completed);
            updateStat('stat-billed', stats.billed);
            updateStat('stat-paid', stats.paid);
        })
        .catch(error => {
            console.error('Stats loading failed:', error);
        });
}

function updateStat(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = value || 0;
    }
}

function loadUrgent() {
    fetch('/nodetest/api/urgent')
        .then(response => response.json())
        .then(urgent => {
            displayUrgentTable(urgent);
        })
        .catch(error => {
            console.error('Urgent loading failed:', error);
            displayError('urgent-table', 'Erreur lors du chargement des interventions urgentes', 7);
        });
}

function loadRecent() {
    fetch('/nodetest/api/recent')
        .then(response => response.json())
        .then(recent => {
            displayRecentTable(recent);
        })
        .catch(error => {
            console.error('Recent loading failed:', error);
            displayError('recent-table', 'Erreur lors du chargement des interventions récentes', 8);
        });
}

// ============================================
// Table Display Functions with Colors and Icons
// ============================================

function displayUrgentTable(data) {
    const tableBody = document.getElementById('urgent-table');
    if (!tableBody) return;
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500"><i class="fa fa-info-circle mr-2"></i>Aucune intervention urgente</td></tr>';
        return;
    }
    
    const rows = data.map(item => {
        const timeClass = getTimeRemainingClass(item.hours_remaining || 0);
        const statusClass = getStatusClass(item.status);
        const missingClass = getMissingInfoClass(item.missing_info);
        const urgentRowClass = (item.hours_remaining || 0) <= 0 ? 'urgent-row' : '';
        
        return `
            <tr class="hover:bg-gray-50 ${urgentRowClass}">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #${escapeHtml(item.intervention_id || 'N/A')}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate" title="${escapeHtml(item.title || '')}">
                        ${escapeHtml(item.title || 'Sans titre')}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate" title="${escapeHtml(item.address || '')}">
                        ${escapeHtml(item.address || 'Adresse non définie')}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${getStatusIcon(item.status)} ${escapeHtml(item.status || 'N/A')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${missingClass}">
                        ${getMissingIcon(item.missing_info)} ${escapeHtml(item.missing_info || 'N/A')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${timeClass}">
                        ${getTimeIcon(item.hours_remaining || 0)} ${formatTimeRemaining(item.hours_remaining || 0)}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    ${escapeHtml(item.assigned_to || 'Non assigné')}
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
}

function displayRecentTable(data) {
    const tableBody = document.getElementById('recent-table');
    if (!tableBody) return;
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500"><i class="fa fa-info-circle mr-2"></i>Aucune intervention récente</td></tr>';
        return;
    }
    
    const rows = data.map(item => {
        const statusClass = getStatusClass(item.status);
        const priorityClass = getPriorityClass(item.priority);
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #${escapeHtml(item.intervention_id || 'N/A')}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate" title="${escapeHtml(item.title || '')}">
                        ${escapeHtml(item.title || 'Sans titre')}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate" title="${escapeHtml(item.address || '')}">
                        ${escapeHtml(item.address || 'Adresse non définie')}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="group relative">
                        <div class="max-w-xs truncate cursor-help">
                            ${escapeHtml((item.description || 'Aucune description').substring(0, 50))}${(item.description && item.description.length > 50) ? '...' : ''}
                        </div>
                        ${item.description && item.description.length > 50 ? `
                        <div class="tooltip">
                            ${escapeHtml(item.description)}
                        </div>
                        ` : ''}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${getStatusIcon(item.status)} ${escapeHtml(item.status || 'N/A')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityClass}">
                        ${getPriorityIcon(item.priority)} ${escapeHtml(item.priority || 'Normal')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatDate(item.date_time)}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    ${escapeHtml(item.assigned_to || 'Non assigné')}
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
}

function displayFilteredTable(data, filterType) {
    const tableBody = document.getElementById('filtered-table');
    if (!tableBody) return;
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500"><i class="fa fa-info-circle mr-2"></i>Aucune intervention trouvée pour ce filtre</td></tr>';
        return;
    }
    
    // Same as displayRecentTable but for filtered results
    displayRecentTable(data);
    
    // Copy the generated rows to filtered table
    const recentRows = document.getElementById('recent-table').innerHTML;
    tableBody.innerHTML = recentRows;
}

function displayError(tableId, message, columnCount) {
    const tableBody = document.getElementById(tableId);
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="${columnCount}" class="px-6 py-4 text-center text-red-500"><i class="fa fa-exclamation-triangle mr-2"></i>${escapeHtml(message)}</td></tr>`;
    }
}

// ============================================
// Filter Functions
// ============================================

function filterInterventions(status) {
    console.log('Filtering by status:', status);
    currentFilter = status;
    
    // Show filtered section
    const filteredSection = document.getElementById('filtered-section');
    const filteredTitle = document.getElementById('filtered-title');
    
    if (filteredSection && filteredTitle) {
        filteredSection.classList.remove('hidden');
        
        // Update title based on filter
        const titles = {
            'received': 'Interventions Reçues',
            'assigned': 'Interventions Assignées', 
            'in-progress': 'Interventions En Cours',
            'completed': 'Interventions Terminées',
            'billed': 'Interventions Facturées',
            'paid': 'Interventions Payées'
        };
        
        filteredTitle.textContent = titles[status] || 'Interventions Filtrées';
    }
    
    // Load filtered data
    fetch(`/nodetest/api/interventions/${status}`)
        .then(response => response.json())
        .then(data => {
            displayFilteredTable(data, status);
        })
        .catch(error => {
            console.error('Filter loading failed:', error);
            displayError('filtered-table', 'Erreur lors du chargement des interventions filtrées', 8);
        });
    
    // Scroll to filtered section
    setTimeout(() => {
        document.getElementById('filtered-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 100);
}

function clearFilter() {
    currentFilter = null;
    const filteredSection = document.getElementById('filtered-section');
    if (filteredSection) {
        filteredSection.classList.add('hidden');
    }
}

function loadAllRecent() {
    // This could open a modal or navigate to a dedicated page
    alert('Fonctionnalité "Voir Tout" pour les interventions récentes - À implémenter selon vos besoins');
}

// ============================================
// Utility Functions for Colors, Icons, and Formatting
// ============================================

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
    return statusClasses[status] || 'bg-cyan-100 text-cyan-800 border border-cyan-300';
}

function getStatusIcon(status) {
    const statusIcons = {
        'Reçue': '<i class="fas fa-inbox mr-1"></i>',
        'Assignée': '<i class="fas fa-user-tag mr-1"></i>',
        'Planifiée': '<i class="fas fa-calendar-check mr-1"></i>',
        'En cours': '<i class="fas fa-cogs mr-1"></i>',
        'Terminée': '<i class="fas fa-check-circle mr-1"></i>',
        'Facturée': '<i class="fas fa-file-invoice mr-1"></i>',
        'Payée': '<i class="fas fa-money-check-alt mr-1"></i>',
        'Maintenance SCH': '<i class="fas fa-wrench mr-1"></i>',
        'Maintenance VIVEST': '<i class="fas fa-hammer mr-1"></i>',
        'Maintenance Moselis': '<i class="fas fa-tools mr-1"></i>',
        'Maintenance CDC': '<i class="fas fa-hard-hat mr-1"></i>',
        'Maintenance CDC Habitat': '<i class="fas fa-home mr-1"></i>',
        'CHANTIER': '<i class="fas fa-building mr-1"></i>',
        'Pausée': '<i class="fas fa-pause-circle mr-1"></i>',
        'Annulée': '<i class="fas fa-times-circle mr-1"></i>'
    };
    return statusIcons[status] || '<i class="fas fa-hammer mr-1"></i>';
}

function getPriorityClass(priority) {
    const priorityClasses = {
        'Haute': 'bg-red-100 text-red-800 border border-red-300',
        'Moyenne': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        'Basse': 'bg-green-100 text-green-800 border border-green-300',
        'Urgente': 'bg-red-200 text-red-900 border border-red-400',
        'Critique': 'bg-red-300 text-red-900 border border-red-500'
    };
    return priorityClasses[priority] || 'bg-gray-100 text-gray-800 border border-gray-300';
}

function getPriorityIcon(priority) {
    const priorityIcons = {
        'Haute': '<i class="fas fa-exclamation-triangle mr-1"></i>',
        'Moyenne': '<i class="fas fa-minus mr-1"></i>',
        'Basse': '<i class="fas fa-chevron-down mr-1"></i>',
        'Urgente': '<i class="fas fa-fire mr-1"></i>',
        'Critique': '<i class="fas fa-bolt mr-1"></i>'
    };
    return priorityIcons[priority] || '<i class="fas fa-circle mr-1"></i>';
}

function getTimeRemainingClass(hours) {
    if (hours <= 0) return 'bg-red-100 text-red-800 border border-red-300';
    if (hours <= 6) return 'bg-red-100 text-red-800 border border-red-300';
    if (hours <= 12) return 'bg-orange-100 text-orange-800 border border-orange-300';
    if (hours <= 24) return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    return 'bg-green-100 text-green-800 border border-green-300';
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

function getMissingIcon(missingInfo) {
    switch(missingInfo) {
        case 'Technicien et Date manquants':
            return '<i class="fas fa-exclamation-triangle mr-1"></i>';
        case 'Technicien manquant':
            return '<i class="fas fa-user-times mr-1"></i>';
        case 'Date manquante':
            return '<i class="fas fa-calendar-times mr-1"></i>';
        default:
            return '<i class="fas fa-check mr-1"></i>';
    }
}

function getTimeIcon(hours) {
    if (hours <= 0) return '<i class="fas fa-exclamation-triangle mr-1"></i>';
    if (hours <= 6) return '<i class="fas fa-fire mr-1"></i>';
    if (hours <= 12) return '<i class="fas fa-clock mr-1"></i>';
    if (hours <= 24) return '<i class="fas fa-hourglass-half mr-1"></i>';
    return '<i class="fas fa-check-circle mr-1"></i>';
}

function formatTimeRemaining(hours) {
    if (hours <= 0) return 'EXPIRÉ';
    if (hours < 1) return Math.round(hours * 60) + 'min';
    return Math.round(hours) + 'h';
}

function formatDate(dateString) {
    if (!dateString || dateString === '' || dateString === '0000-00-00' || dateString === '0000-00-00 00:00:00') {
        return 'Non définie';
    }
    
    try {
        let date;
        
        // If it's already a Date object
        if (dateString instanceof Date) {
            date = dateString;
        }
        // If it's already in DD/MM/YYYY format (from your database)
        else if (typeof dateString === 'string' && dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            // Split DD/MM/YYYY and rearrange to MM/DD/YYYY for JavaScript
            const parts = dateString.split('/');
            const day = parts[0];
            const month = parts[1];
            const year = parts[2];
            date = new Date(`${month}/${day}/${year}`);
        }
        // If it's a MySQL datetime format (YYYY-MM-DD HH:MM:SS)
        else if (typeof dateString === 'string' && dateString.includes(' ')) {
            date = new Date(dateString.replace(' ', 'T'));
        }
        // If it's a MySQL date format (YYYY-MM-DD)
        else if (typeof dateString === 'string' && dateString.includes('-')) {
            date = new Date(dateString + 'T00:00:00');
        }
        // Try parsing as-is
        else {
            date = new Date(dateString);
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Date invalide';
        }
        
        // Return in DD/MM/YYYY format (same as input)
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
        });
    } catch (error) {
        console.error('Date formatting error:', error, 'for date:', dateString);
        return 'Date invalide';
    }
}