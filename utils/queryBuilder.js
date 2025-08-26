// utils/queryBuilder.js - SQL query organization with Date Range Support (FIXED)

const baseInterventionFields = `
    i.number as intervention_id,
    i.title,
    CASE 
        WHEN i.address IS NOT NULL AND i.address != '' THEN CONCAT(i.address, CASE WHEN i.city IS NOT NULL AND i.city != '' THEN CONCAT(', ', i.city) ELSE '' END)
        WHEN t.address IS NOT NULL AND t.address != '' THEN CONCAT(t.address, CASE WHEN t.city IS NOT NULL AND t.city != '' THEN CONCAT(', ', t.city) ELSE '' END)
        ELSE 'Adresse non définie'
    END as address,
    i.description,
    ist.name as status,
    i.priority,
    i.date_time,
    i.technician_uid,
    i.price,
    CASE 
        WHEN i.technician_uid = 0 OR i.technician_uid IS NULL THEN 'Non assigné'
        ELSE CONCAT(tech.firstname, ' ', tech.lastname)
    END as assigned_to,
    CASE 
        WHEN (i.technician_uid = 0 OR i.technician_uid IS NULL) AND (i.date_time IS NULL OR i.date_time = '') THEN 'Technicien et Date manquants'
        WHEN i.technician_uid = 0 OR i.technician_uid IS NULL THEN 'Technicien manquant'
        WHEN i.date_time IS NULL OR i.date_time = '' THEN 'Date manquante'
        ELSE 'Complet'
    END as missing_info,
    i.timestamp as created_at
`;

const baseInterventionJoins = `
    FROM interventions i
    LEFT JOIN tenants t ON i.tenant_uid = t.uid
    LEFT JOIN interventions_status ist ON i.status_uid = ist.uid
    LEFT JOIN technicians tech ON i.technician_uid = tech.uid
`;

function buildInterventionQuery(type, status = null) {
    let query = `SELECT ${baseInterventionFields}`;
    
    // Add hours_remaining for urgent interventions (48h business hours)
    if (type === 'urgent') {
        query += `, 
        CASE 
            WHEN WEEKDAY(i.timestamp) IN (5, 6) THEN 
                GREATEST(0, 48 - 
                    TIMESTAMPDIFF(HOUR, 
                        DATE_ADD(DATE_ADD(i.timestamp, INTERVAL (7 - WEEKDAY(i.timestamp)) DAY), INTERVAL 9 HOUR),
                        NOW()
                    )
                )
            ELSE 
                GREATEST(0, 48 - 
                    (TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) - 
                     (FLOOR(TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) / 24) * 
                      CASE WHEN WEEKDAY(DATE_ADD(i.timestamp, INTERVAL FLOOR(TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) / 24) DAY)) IN (5, 6) THEN 24 ELSE 0 END)
                    )
                )
        END as hours_remaining`;
    }
    
    query += baseInterventionJoins;
    
    // FIXED: Add agency filter to base condition
    query += ` WHERE i.uid != 0 AND i.agency_uid = 1`;
    
    // Add urgent condition - interventions created in last 48h missing technician OR date
    if (type === 'urgent') {
        query += ` AND (
            -- Missing technician assignment OR missing date assignment
            (i.technician_uid = 0 OR i.technician_uid IS NULL OR i.date_time IS NULL OR i.date_time = '')
            AND
            -- Created within last 48 business hours
            CASE 
                WHEN WEEKDAY(i.timestamp) IN (5, 6) THEN 
                    TIMESTAMPDIFF(HOUR, 
                        DATE_ADD(DATE_ADD(i.timestamp, INTERVAL (7 - WEEKDAY(i.timestamp)) DAY), INTERVAL 9 HOUR),
                        NOW()
                    ) <= 48
                ELSE 
                    (TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) - 
                     (FLOOR(TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) / 24) * 
                      CASE WHEN WEEKDAY(DATE_ADD(i.timestamp, INTERVAL FLOOR(TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) / 24) DAY)) IN (5, 6) THEN 24 ELSE 0 END)
                    ) <= 48
            END
        )`;
    }
    
    // Add recent condition (last 30 days)
    if (type === 'recent') {
        query += ` AND i.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    }
    
    // Add status filter
    if (status) {
        const statusCondition = getStatusCondition(status);
        if (statusCondition) {
            query += ` AND ${statusCondition}`;
        }
    }
    
    // Default ordering
    if (type === 'urgent') {
        query += ` ORDER BY hours_remaining ASC, i.uid DESC LIMIT 10`;
    } else if (type === 'recent') {
        query += ` ORDER BY i.timestamp DESC LIMIT 10`;
    } else {
        query += ` ORDER BY i.timestamp DESC LIMIT ${status === 'billed' || status === 'paid' ? '50' : '10'}`;
    }
    
    return query;
}

function getStatusCondition(status) {
    switch(status) {
        case 'received':
            return "(ist.name LIKE '%reçu%' OR ist.name LIKE '%nouveau%' OR ist.name LIKE '%received%')";
        case 'assigned':
            return "(ist.name LIKE '%assigné%' OR ist.name LIKE '%assigned%' OR ist.name LIKE '%planifié%')";
        case 'in-progress':
            return "(ist.name LIKE '%cours%' OR ist.name LIKE '%progress%' OR ist.name LIKE '%démarré%')";
        case 'completed':
            return "(ist.name LIKE '%terminé%' OR ist.name LIKE '%completed%' OR ist.name LIKE '%fini%')";
        case 'billed':
            return "(ist.name LIKE '%facturé%' OR ist.name LIKE '%billed%')";
        case 'paid':
            return "(ist.name LIKE '%payé%' OR ist.name LIKE '%paid%')";
        default:
            return null;
    }
}

function buildUrgentAllQuery(filters) {
    const {
        search = '',
        status = '',
        missing = '',
        timeFilter = '',
        sortBy = 'hours_remaining',
        sortOrder = 'asc',
        limit = 25,
        offset = 0
    } = filters;

    let baseQuery = `SELECT ${baseInterventionFields}`;
    
    // Add hours_remaining calculation
    baseQuery += `, 
    CASE 
        WHEN WEEKDAY(i.timestamp) IN (5, 6) THEN 
            GREATEST(0, 48 - 
                TIMESTAMPDIFF(HOUR, 
                    DATE_ADD(DATE_ADD(i.timestamp, INTERVAL (7 - WEEKDAY(i.timestamp)) DAY), INTERVAL 9 HOUR),
                    NOW()
                )
            )
        ELSE 
            GREATEST(0, 48 - 
                (TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) - 
                 (FLOOR(TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) / 24) * 
                  CASE WHEN WEEKDAY(DATE_ADD(i.timestamp, INTERVAL FLOOR(TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) / 24) DAY)) IN (5, 6) THEN 24 ELSE 0 END)
                )
            )
    END as hours_remaining`;
    
    baseQuery += baseInterventionJoins;
    
    // FIXED: Add agency filter to urgent interventions
    let whereConditions = [
        'i.uid != 0',
        'i.agency_uid = 1',
        `(
            (i.technician_uid = 0 OR i.technician_uid IS NULL OR i.date_time IS NULL OR i.date_time = '')
            AND
            CASE 
                WHEN WEEKDAY(i.timestamp) IN (5, 6) THEN 
                    TIMESTAMPDIFF(HOUR, 
                        DATE_ADD(DATE_ADD(i.timestamp, INTERVAL (7 - WEEKDAY(i.timestamp)) DAY), INTERVAL 9 HOUR),
                        NOW()
                    ) <= 48
                ELSE 
                    (TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) - 
                     (FLOOR(TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) / 24) * 
                      CASE WHEN WEEKDAY(DATE_ADD(i.timestamp, INTERVAL FLOOR(TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) / 24) DAY)) IN (5, 6) THEN 24 ELSE 0 END)
                    ) <= 48
            END
        )`
    ];

    // Search filter
    if (search && search.trim() !== '') {
        const searchTerm = search.trim();
        whereConditions.push(`(
            i.number LIKE '%${searchTerm}%' OR 
            i.title LIKE '%${searchTerm}%' OR 
            i.address LIKE '%${searchTerm}%' OR 
            i.city LIKE '%${searchTerm}%' OR
            i.description LIKE '%${searchTerm}%' OR
            CONCAT(tech.firstname, ' ', tech.lastname) LIKE '%${searchTerm}%'
        )`);
    }

    // Status filter
    if (status && status !== '') {
        const statusCondition = getStatusCondition(status);
        if (statusCondition) {
            whereConditions.push(statusCondition);
        }
    }

    // Missing info filter
    if (missing && missing !== '') {
        switch(missing) {
            case 'technician':
                whereConditions.push("(i.technician_uid = 0 OR i.technician_uid IS NULL)");
                break;
            case 'date':
                whereConditions.push("(i.date_time IS NULL OR i.date_time = '')");
                break;
            case 'both':
                whereConditions.push("((i.technician_uid = 0 OR i.technician_uid IS NULL) AND (i.date_time IS NULL OR i.date_time = ''))");
                break;
        }
    }

    const whereClause = whereConditions.length > 1 ? 
        ' WHERE ' + whereConditions.join(' AND ') : ' WHERE ' + whereConditions[0];
    
    // Build count query - FIXED: Include agency filter
    const countQuery = `SELECT COUNT(*) as total_count FROM interventions i
        LEFT JOIN tenants t ON i.tenant_uid = t.uid
        LEFT JOIN interventions_status ist ON i.status_uid = ist.uid
        LEFT JOIN technicians tech ON i.technician_uid = tech.uid
        ${whereClause}`;

    // Build main query with sorting
    let orderBy = '';
    if (sortBy && ['intervention_id', 'title', 'status', 'priority', 'hours_remaining', 'created_at', 'assigned_to'].includes(sortBy)) {
        const sortField = sortBy === 'intervention_id' ? 'CAST(i.number AS UNSIGNED)' : 
                         sortBy === 'hours_remaining' ? 'hours_remaining' :
                         sortBy === 'created_at' ? 'i.timestamp' :
                         sortBy;
        orderBy = ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}, i.uid DESC`;
    } else {
        orderBy = ` ORDER BY hours_remaining ASC, i.uid DESC`;
    }

    const query = baseQuery + whereClause + orderBy + ` LIMIT ${limit} OFFSET ${offset}`;

    return { query, countQuery };
}
// NEW: Build query for all recent interventions with filters and DATE RANGE support
function buildAllRecentQuery(filters) {
    const {
        search = '',
        status = '',
        priority = '',
        technician = '',
        date = '',
        sortBy = 'date_time',
        sortOrder = 'desc',
        limit = 25,
        offset = 0
    } = filters;

    let baseQuery = `SELECT ${baseInterventionFields}`;
    baseQuery += baseInterventionJoins;
    
    // FIXED: Add agency filter to base condition
    let whereConditions = ['i.uid != 0', 'i.agency_uid = 1'];

    // Search filter
    if (search && search.trim() !== '') {
        const searchTerm = search.trim();
        whereConditions.push(`(
            i.number LIKE '%${searchTerm}%' OR 
            i.title LIKE '%${searchTerm}%' OR 
            i.address LIKE '%${searchTerm}%' OR 
            i.city LIKE '%${searchTerm}%' OR
            i.description LIKE '%${searchTerm}%' OR
            CONCAT(tech.firstname, ' ', tech.lastname) LIKE '%${searchTerm}%'
        )`);
    }

    // Status filter
    if (status && status !== '') {
        const statusCondition = getStatusCondition(status);
        if (statusCondition) {
            whereConditions.push(statusCondition);
        }
    }

    // Priority filter
    if (priority && priority !== '') {
        switch(priority) {
            case 'normale':
                whereConditions.push("(i.priority = 'Normale' OR i.priority = 'normale')");
                break;
            case 'importante':
                whereConditions.push("(i.priority = 'Importante' OR i.priority = 'importante')");
                break;
            case 'urgente':
                whereConditions.push("(i.priority = 'Urgente' OR i.priority = 'urgente')");
                break;
        }
    }

    // Technician filter
    if (technician && technician !== '') {
        if (technician === 'unassigned') {
            whereConditions.push("(i.technician_uid = 0 OR i.technician_uid IS NULL)");
        } else {
            whereConditions.push(`i.technician_uid = ${parseInt(technician)}`);
        }
    }

    // Enhanced Date filter with range support
    if (date && date !== '') {
        console.log('Date filter - Raw input:', date);
        
        // Check if it's a date range (contains " - ")
        if (date.includes(' - ')) {
            const dateRange = date.split(' - ');
            if (dateRange.length === 2) {
                const startDate = convertToDbFormat(dateRange[0].trim());
                const endDate = convertToDbFormat(dateRange[1].trim());
                
                console.log('Date range filter - Start:', startDate, 'End:', endDate);
                whereConditions.push(`STR_TO_DATE(i.date_time, '%d/%m/%Y') BETWEEN STR_TO_DATE('${startDate}', '%d/%m/%Y') AND STR_TO_DATE('${endDate}', '%d/%m/%Y')`);
            }
        } else {
            // Single date filtering
            const formattedDate = convertToDbFormat(date);
            console.log('Single date filter - Input:', date, 'Formatted:', formattedDate);
            whereConditions.push(`i.date_time LIKE '${formattedDate}%'`);
        }
    }

    const whereClause = whereConditions.length > 1 ? 
        ' WHERE ' + whereConditions.join(' AND ') : ' WHERE ' + whereConditions[0];
    
    // Build count query - FIXED: Include agency filter
    const countQuery = `SELECT COUNT(*) as total_count FROM interventions i
        LEFT JOIN tenants t ON i.tenant_uid = t.uid
        LEFT JOIN interventions_status ist ON i.status_uid = ist.uid
        LEFT JOIN technicians tech ON i.technician_uid = tech.uid
        ${whereClause}`;

    // Build main query with sorting and pagination
    let orderBy = '';
    const validSortFields = ['intervention_id', 'title', 'status', 'priority', 'date_time', 'created_at', 'assigned_to'];
    if (validSortFields.includes(sortBy)) {
        let sortField;
        switch(sortBy) {
            case 'intervention_id':
                sortField = 'CAST(i.number AS UNSIGNED)';  // Proper numeric sort
                break;
            case 'status':
                sortField = 'ist.name';
                break;
            case 'priority':
                sortField = 'i.priority';
                break;
            case 'date_time':
                sortField = 'STR_TO_DATE(i.date_time, "%d/%m/%Y %H:%i")';
                break;
            case 'created_at':
                sortField = 'i.timestamp';
                break;
            case 'assigned_to':
                sortField = 'CONCAT(COALESCE(tech.firstname, ""), " ", COALESCE(tech.lastname, ""))';
                break;
            case 'title':
                sortField = 'i.title';
                break;
            default:
                sortField = 'i.timestamp';
        }
        orderBy = ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}, i.uid DESC`;
    } else {
        orderBy = ` ORDER BY i.timestamp DESC, i.uid DESC`;
    }

    const query = baseQuery + whereClause + orderBy + ` LIMIT ${limit} OFFSET ${offset}`;

    console.log('Generated SQL query with agency filter:', query);
    console.log('Count query with agency filter:', countQuery);

    return { query, countQuery };
}

// Helper function to convert YYYY-MM-DD to DD/MM/YYYY format (as stored in database)
function convertToDbFormat(date) {
    if (date.includes('/')) {
        // Already in DD/MM/YYYY format
        return date;
    } else if (date.includes('-')) {
        // Convert from YYYY-MM-DD to DD/MM/YYYY
        const dateObj = new Date(date + 'T00:00:00'); // Add time to avoid timezone issues
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    }
    return date;
}

module.exports = { buildInterventionQuery, buildUrgentAllQuery, buildAllRecentQuery };