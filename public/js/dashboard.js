// public/js/dashboard.js - Dashboard functionality (FIXED)

// ============================================
// Data Loading Functions
// ============================================

function loadStats() {
    fetch('/nodetest/api/stats')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Stats loaded:', data);
            
            // Update stat cards
            document.getElementById('stat-received').textContent = data.received || '0';
            document.getElementById('stat-assigned').textContent = data.assigned || '0';
            document.getElementById('stat-inProgress').textContent = data.inProgress || '0';
            document.getElementById('stat-completed').textContent = data.completed || '0';
            document.getElementById('stat-billed').textContent = data.billed || '0';
            document.getElementById('stat-paid').textContent = data.paid || '0';
        })
        .catch(error => {
            console.error('Error loading stats:', error);
            // Set fallback values
            ['received', 'assigned', 'inProgress', 'completed', 'billed', 'paid'].forEach(stat => {
                const element = document.getElementById(`stat-${stat}`);
                if (element) element.textContent = '-';
            });
        });
}

function loadUrgent() {
    fetch('/nodetest/api/urgent')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Urgent interventions loaded:', data.length);
            displayUrgentTable(data);
        })
        .catch(error => {
            console.error('Error loading urgent interventions:', error);
            displayUrgentError('Erreur lors du chargement des interventions urgentes');
        });
}

function loadRecent() {
    fetch('/nodetest/api/recent')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Recent interventions loaded:', data.length);
            displayRecentTable(data);
        })
        .catch(error => {
            console.error('Error loading recent interventions:', error);
            displayRecentError('Erreur lors du chargement des interventions récentes');
        });
}

// ============================================
// Display Functions
// ============================================

function displayUrgentTable(urgent) {
    const tableBody = document.getElementById('urgent-table');
    
    if (!urgent || urgent.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    <i class="fa fa-check-circle mr-2 text-green-500"></i>Aucune intervention urgente - Excellent travail !
                </td>
            </tr>
        `;
        return;
    }

    const rows = urgent.map(intervention => {
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
                        ${getTimeIcon(intervention.hours_remaining)} ${formatTimeRemaining(intervention.hours_remaining)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${escapeHtml(intervention.assigned_to || 'Non assigné')}
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rows.join('');
}

function displayRecentTable(recent) {
    const tableBody = document.getElementById('recent-table');
    
    if (!recent || recent.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    <i class="fa fa-info-circle mr-2"></i>Aucune intervention récente trouvée
                </td>
            </tr>
        `;
        return;
    }

    const rows = recent.map(intervention => {
        const statusClass = getStatusClass(intervention.status);
        const priorityClass = getPriorityClass(intervention.priority);
        
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
                    <div class="max-w-xs truncate" title="${escapeHtml(intervention.address || '')}">
                        ${escapeHtml(intervention.address || 'Adresse non définie')}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate" title="${escapeHtml(intervention.description || '')}">
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

function displayUrgentError(message) {
    document.getElementById('urgent-table').innerHTML = `
        <tr>
            <td colspan="7" class="px-6 py-8 text-center text-red-500">
                <i class="fa fa-exclamation-triangle mr-2"></i>${message}
            </td>
        </tr>
    `;
}

function displayRecentError(message) {
    document.getElementById('recent-table').innerHTML = `
        <tr>
            <td colspan="8" class="px-6 py-8 text-center text-red-500">
                <i class="fa fa-exclamation-triangle mr-2"></i>${message}
            </td>
        </tr>
    `;
}

// ============================================
// Filter Functions
// ============================================

function filterInterventions(status) {
    console.log('Filtering by status:', status);
    
    fetch(`/nodetest/api/interventions/${status}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displayFilteredTable(data, status);
            showFilteredSection(status);
        })
        .catch(error => {
            console.error('Error filtering interventions:', error);
            displayFilteredError('Erreur lors du filtrage des interventions');
        });
}

function displayFilteredTable(interventions, status) {
    const tableBody = document.getElementById('filtered-table');
    const titleElement = document.getElementById('filtered-title');
    
    // Update title
    const statusTitles = {
        'received': 'Interventions Reçues',
        'assigned': 'Interventions Assignées', 
        'in-progress': 'Interventions En Cours',
        'completed': 'Interventions Terminées',
        'billed': 'Interventions Facturées',
        'paid': 'Interventions Payées'
    };
    titleElement.textContent = statusTitles[status] || 'Interventions Filtrées';
    
    if (!interventions || interventions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    <i class="fa fa-info-circle mr-2"></i>Aucune intervention trouvée pour ce statut
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
                    <div class="max-w-xs truncate" title="${escapeHtml(intervention.title || '')}">
                        ${escapeHtml(intervention.title || 'Sans titre')}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate" title="${escapeHtml(intervention.address || '')}">
                        ${escapeHtml(intervention.address || 'Adresse non définie')}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="max-w-xs truncate" title="${escapeHtml(intervention.description || '')}">
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

function displayFilteredError(message) {
    document.getElementById('filtered-table').innerHTML = `
        <tr>
            <td colspan="8" class="px-6 py-8 text-center text-red-500">
                <i class="fa fa-exclamation-triangle mr-2"></i>${message}
            </td>
        </tr>
    `;
}

function showFilteredSection(status) {
    const filteredSection = document.getElementById('filtered-section');
    if (filteredSection) {
        filteredSection.classList.remove('hidden');
        // Smooth scroll to filtered section
        filteredSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function clearFilter() {
    const filteredSection = document.getElementById('filtered-section');
    if (filteredSection) {
        filteredSection.classList.add('hidden');
    }
}

function loadAllRecent() {
    // Navigate to the all interventions page
    window.location.href = '/nodetest/interventions';
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

// ============================================
// Initialization and Data Loading
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    loadStats();
    loadUrgent();
    loadRecent();
    
    // Refresh data every 30 seconds
    setInterval(() => {
        loadStats();
        loadUrgent();
        loadRecent();
    }, 30000);
});