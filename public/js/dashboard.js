// public/js/dashboard.js

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
                statusEl.textContent = 'Connecté (' + data.totalInterventions + ' interventions)';
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
            document.getElementById('stat-received').textContent = stats.received || 0;
            document.getElementById('stat-assigned').textContent = stats.assigned || 0;
            document.getElementById('stat-inProgress').textContent = stats.inProgress || 0;
            document.getElementById('stat-completed').textContent = stats.completed || 0;
            document.getElementById('stat-billed').textContent = stats.billed || 0;
            document.getElementById('stat-paid').textContent = stats.paid || 0;
        })
        .catch(error => {
            console.error('Impossible de charger les statistiques:', error);
        });
}

function loadUrgent() {
    fetch('/nodetest/api/urgent')
        .then(response => response.json())
        .then(urgent => {
            const tbody = document.getElementById('urgent-table');
            
            if (urgent.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">Aucune intervention nécessitant une assignation (48h)</td></tr>';
                return;
            }
            
            tbody.innerHTML = urgent.map(item => {
                const statusClass = getStatusClass(item.status);
                const statusIcon = getStatusIconHtml(item.status);
                
                // Format hours remaining with visual urgency
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
                
                // Format missing info with icons
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
                    </tr>
                `;
            }).join('');
        })
        .catch(error => {
            console.error('Impossible de charger les interventions urgentes:', error);
            const tbody = document.getElementById('urgent-table');
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-red-500">Erreur de chargement</td></tr>';
        });
}

function loadRecent() {
    fetch('/nodetest/api/recent')
        .then(response => response.json())
        .then(recent => {
            const tbody = document.getElementById('recent-table');
            
            if (recent.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">Aucune intervention récente</td></tr>';
                return;
            }
            
            tbody.innerHTML = recent.map(item => {
                const fullDescription = item.description || '';
                const truncatedDescription = fullDescription.length > 50 ? 
                    fullDescription.substring(0, 50) + '...' : fullDescription;
                
                const statusClass = getStatusClass(item.status);
                const statusIcon = getStatusIconHtml(item.status);
                
                return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">${item.intervention_id || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.title || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.address || '-'}</td>
                        <td class="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            <div class="relative group">
                                <div class="truncate cursor-help">${truncatedDescription}</div>
                                <div class="tooltip">${fullDescription}</div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                                ${statusIcon} ${item.status || '-'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.priority || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(item.date_time) || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.assigned_to || 'Non assigné'}</td>
                    </tr>
                `;
            }).join('');
        })
        .catch(error => {
            console.error('Impossible de charger les interventions récentes:', error);
            const tbody = document.getElementById('recent-table');
            tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-red-500">Erreur de chargement</td></tr>';
        });
}

// ============================================
// Filter Functions
// ============================================

function filterInterventions(status) {
    // Remove active class from all cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to clicked card
    const clickedCard = document.querySelector(`[onclick="filterInterventions('${status}')"]`);
    if (clickedCard) {
        clickedCard.classList.add('active');
    }
    
    // Set current filter
    currentFilter = status;
    
    // Show filtered section
    document.getElementById('filtered-section').style.display = 'block';
    
    // Update title
    const titles = {
        'received': { text: 'Interventions Reçues', color: '#eab308', icon: 'fa-clock-o' },
        'assigned': { text: 'Interventions Assignées', color: '#3b82f6', icon: 'fa-calendar' },
        'in-progress': { text: 'Interventions En Cours', color: '#f59e0b', icon: 'fa-arrow-circle-o-right' },
        'completed': { text: 'Interventions Terminées', color: '#10b981', icon: 'fa-check' },
        'billed': { text: 'Interventions Facturées', color: '#6b7280', icon: 'fa-euro' },
        'paid': { text: 'Interventions Payées', color: '#059669', icon: 'fa-check-circle' }
    };
    
    const titleInfo = titles[status];
    if (titleInfo) {
        document.getElementById('filtered-title').innerHTML = 
            `<i class="${titleInfo.icon} w-3 h-3 mr-2" style="color: ${titleInfo.color};"></i>${titleInfo.text}`;
    }
    
    // Load filtered interventions
    fetch(`/nodetest/api/interventions/${status}`)
        .then(response => response.json())
        .then(interventions => {
            const tbody = document.getElementById('filtered-table');
            
            if (interventions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">Aucune intervention trouvée pour ce statut</td></tr>';
                return;
            }
            
            tbody.innerHTML = interventions.map(item => {
                const fullDescription = item.description || '';
                const truncatedDescription = fullDescription.length > 50 ? 
                    fullDescription.substring(0, 50) + '...' : fullDescription;
                
                const statusClass = getStatusClass(item.status);
                const statusIcon = getStatusIconHtml(item.status);
                
                return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">${item.intervention_id || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.title || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.address || '-'}</td>
                        <td class="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            <div class="relative group">
                                <div class="truncate cursor-help">${truncatedDescription}</div>
                                <div class="tooltip">${fullDescription}</div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                                ${statusIcon} ${item.status || '-'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.priority || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(item.date_time) || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.assigned_to || 'Non assigné'}</td>
                    </tr>
                `;
            }).join('');
        })
        .catch(error => {
            console.error('Impossible de charger les interventions filtrées:', error);
            const tbody = document.getElementById('filtered-table');
            tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-red-500">Erreur de chargement</td></tr>';
        });
}

function clearFilter() {
    // Remove active class from all cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Hide filtered section
    document.getElementById('filtered-section').style.display = 'none';
    
    // Clear current filter
    currentFilter = null;
}

// ============================================
// Utility Functions
// ============================================

function getStatusClass(status) {
    const statusClasses = {
        // Basic statuses
        'Reçue': 'status-received',
        'Assignée': 'status-assigned',
        'Planifiée': 'status-assigned',
        'En cours': 'status-in-progress',
        'Terminée': 'status-completed',
        'Facturée': 'status-billed',
        'Payée': 'status-paid',
        
        // Maintenance types with distinct colors
        'Maintenance SCH': 'bg-purple-100 text-purple-800 border border-purple-300',
        'Maintenance VIVEST': 'bg-purple-100 text-purple-800 border border-purple-300',
        'Maintenance Moselis': 'bg-purple-100 text-purple-800 border border-purple-300',
        'Maintenance CDC': 'bg-purple-100 text-purple-800 border border-purple-300',
        'Maintenance CDC Habitat': 'bg-purple-100 text-purple-800 border border-purple-300',
        'CHANTIER': 'bg-purple-100 text-purple-800 border border-purple-300',
        
        // Other statuses
        'Pausée': 'bg-gray-100 text-gray-800',
        'Annulée': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-purple-100 text-purple-800 border border-purple-300';
}

function getStatusIconHtml(status) {
    const statusIcons = {
        // Basic statuses
        'Reçue': '<i class="fa fa-clock-o mr-1"></i>',
        'Assignée': '<i class="fa fa-calendar mr-1"></i>',
        'Planifiée': '<i class="fa fa-calendar-check-o mr-1"></i>',
        'En cours': '<i class="fa fa-cog fa-spin mr-1"></i>',
        'Terminée': '<i class="fa fa-check-circle mr-1"></i>',
        'Facturée': '<i class="fa fa-euro mr-1"></i>',
        'Payée': '<i class="fa fa-check-circle-o mr-1"></i>',
        
        // Maintenance types with unique icons
        'Maintenance SCH': '<i class="fa fa-building mr-1" style="color: #8b5cf6;"></i>',
        'Maintenance VIVEST': '<i class="fa fa-home mr-1" style="color: #8b5cf6;"></i>',
        'Maintenance Moselis': '<i class="fa fa-cogs mr-1" style="color: #8b5cf6;"></i>',
        'Maintenance CDC': '<i class="fa fa-wrench mr-1" style="color: #8b5cf6;"></i>',
        'Maintenance CDC Habitat': '<i class="fa fa-wrench mr-1" style="color: #8b5cf6;"></i>',
        'CHANTIER': '<i class="fa fa-hard-hat mr-1" style="color: #8b5cf6;"></i>',
        
        // Other statuses
        'Pausée': '<i class="fa fa-pause mr-1"></i>',
        'Annulée': '<i class="fa fa-times-circle mr-1"></i>'
    };
    return statusIcons[status] || '<i class="fa fa-home mr-1" style="color: #8b5cf6;"></i>';
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        // Handle French date format (dd/mm/yyyy)
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const day = parts[0];
                const month = parts[1];
                const year = parts[2];
                // Create date as yyyy-mm-dd format for proper parsing
                const date = new Date(`${year}-${month}-${day}`);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                }
            }
        }
        
        // Fallback for other date formats
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
        
        // If all else fails, return the original string
        return dateString;
    } catch (error) {
        return dateString;
    }
}