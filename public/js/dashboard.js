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
                tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">Aucune intervention urgente</td></tr>';
                return;
            }
            
            tbody.innerHTML = urgent.map(item => {
                const fullDescription = item.description || '';
                const truncatedDescription = fullDescription.length > 50 ? fullDescription.substring(0, 50) + '...' : fullDescription;
                
                const statusClass = getStatusClass(item.status);
                const statusIcon = getStatusIconHtml(item.status);
                
                const rowClass = item.hours_remaining < 24 ? 'urgent-row' : 'hover:bg-gray-50';
                const timeClass = item.hours_remaining < 24 ? 'text-red-600 font-bold' : 'text-gray-900';
                const timeText = item.hours_remaining > 0 ? Math.round(item.hours_remaining) + 'h' : 'En retard';
                
                return '<tr class="' + rowClass + '">' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">' + (item.intervention_id || '-') + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.title || '-') + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.address || '-') + '</td>' +
                    '<td class="px-6 py-4 text-sm text-gray-900 max-w-xs">' +
                        '<div class="relative group">' +
                            '<div class="truncate cursor-help">' + truncatedDescription + '</div>' +
                            '<div class="tooltip">' + fullDescription + '</div>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap">' +
                        '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + statusClass + '">' + statusIcon + item.status + '</span>' +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.priority || 'Normale') + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.date_time || '-') + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm ' + timeClass + '">' + timeText + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.assigned_to || 'Non assigné') + '</td>' +
                '</tr>';
            }).join('');
        })
        .catch(error => {
            console.error('Impossible de charger les interventions urgentes:', error);
            document.getElementById('urgent-table').innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-red-500">Échec du chargement des données</td></tr>';
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
                const truncatedDescription = fullDescription.length > 50 ? fullDescription.substring(0, 50) + '...' : fullDescription;
                
                const statusClass = getStatusClass(item.status);
                const statusIcon = getStatusIconHtml(item.status);
                
                return '<tr class="hover:bg-gray-50">' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">' + (item.intervention_id || '-') + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.title || '-') + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.address || '-') + '</td>' +
                    '<td class="px-6 py-4 text-sm text-gray-900 max-w-xs">' +
                        '<div class="relative group">' +
                            '<div class="truncate cursor-help">' + truncatedDescription + '</div>' +
                            '<div class="tooltip">' + fullDescription + '</div>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap">' +
                        '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + statusClass + '">' + statusIcon + item.status + '</span>' +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.priority || 'Normale') + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.date_time || '-') + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.assigned_to || 'Non assigné') + '</td>' +
                '</tr>';
            }).join('');
        })
        .catch(error => {
            console.error('Impossible de charger les interventions récentes:', error);
            document.getElementById('recent-table').innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-red-500">Échec du chargement des données</td></tr>';
        });
}

// ============================================
// Status and Icon Helper Functions
// ============================================

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('terminé') || statusLower.includes('completed')) {
        return 'status-completed';
    } else if (statusLower.includes('cours') || statusLower.includes('progress')) {
        return 'status-in-progress';
    } else if (statusLower.includes('assigné') || statusLower.includes('assigned') || statusLower.includes('planifié')) {
        return 'status-assigned';
    } else if (statusLower.includes('facturé') || statusLower.includes('billed')) {
        return 'status-billed';
    } else if (statusLower.includes('payé') || statusLower.includes('paid')) {
        return 'status-paid';
    } else {
        return 'status-received';
    }
}

function getStatusIconHtml(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('planifié') || statusLower.includes('assigned')) {
        return '<i class="fa fa-calendar" style="margin-right: 6px; color: #3b82f6;"></i>';
    } else if (statusLower.includes('cours') || statusLower.includes('progress')) {
        return '<i class="fa fa-arrow-circle-o-right" style="margin-right: 6px; color: #f59e0b;"></i>';
    } else if (statusLower.includes('terminé') || statusLower.includes('completed')) {
        return '<i class="fa fa-check" style="margin-right: 6px; color: #10b981;"></i>';
    } else if (statusLower.includes('facturé') || statusLower.includes('billed')) {
        return '<i class="fa fa-euro" style="margin-right: 6px; color: #6b7280;"></i>';
    } else if (statusLower.includes('payé') || statusLower.includes('paid')) {
        return '<i class="fa fa-check-circle" style="margin-right: 6px; color: #059669;"></i>';
    } else {
        return '<i class="fa fa-clock-o" style="margin-right: 6px; color: #eab308;"></i>';
    }
}

// ============================================
// Filtering Functions
// ============================================

function filterByStatus(status) {
    // Remove active class from all tiles
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to clicked tile
    event.currentTarget.classList.add('active');
    
    currentFilter = status;
    
    // Show filtered section
    const filteredSection = document.getElementById('filtered-section');
    filteredSection.style.display = 'block';
    
    // Update title and icon
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
            '<i class="' + titleInfo.icon + ' w-3 h-3 mr-2" style="color: ' + titleInfo.color + ';"></i>' +
            titleInfo.text;
    }
    
    // Load filtered interventions
    fetch('/nodetest/api/interventions/' + status)
        .then(response => response.json())
        .then(interventions => {
            const tbody = document.getElementById('filtered-table');
            
            if (interventions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">Aucune intervention trouvée pour ce statut</td></tr>';
                return;
            }
            
            tbody.innerHTML = interventions.map(item => {
                const fullDescription = item.description || '';
                const truncatedDescription = fullDescription.length > 50 ? fullDescription.substring(0, 50) + '...' : fullDescription;
                
                const statusClass = getStatusClass(item.status);
                const statusIcon = getStatusIconHtml(item.status);
                
                return '<tr class="hover:bg-gray-50">' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">' + (item.intervention_id || '-') + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.title || '-') + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.address || '-') + '</td>' +
                    '<td class="px-6 py-4 text-sm text-gray-900 max-w-xs">' +
                        '<div class="relative group">' +
                            '<div class="truncate cursor-help">' + truncatedDescription + '</div>' +
                            '<div class="tooltip">' + fullDescription + '</div>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap">' +
                        '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + statusClass + '">' + statusIcon + item.status + '</span>' +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.priority || 'Normale') + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.date_time || '-') + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + (item.assigned_to || 'Non assigné') + '</td>' +
                '</tr>';
            }).join('');
        })
        .catch(error => {
            console.error('Impossible de charger les interventions filtrées:', error);
            document.getElementById('filtered-table').innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-red-500">Échec du chargement des données</td></tr>';
        });
}

function clearFilter() {
    // Remove active class from all tiles
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Hide filtered section
    document.getElementById('filtered-section').style.display = 'none';
    currentFilter = null;
}

// ============================================
// Utility Functions
// ============================================

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    } catch (error) {
        return dateString; // Return original if parsing fails
    }
}

// Add smooth scroll to elements
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Show notification (for future use)
function showNotification(message, type = 'info') {
    // This could be expanded to show toast notifications
    console.log(`${type.toUpperCase()}: ${message}`);
}

// Export functions for global access (if needed)
window.filterByStatus = filterByStatus;
window.clearFilter = clearFilter;