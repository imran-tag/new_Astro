// utils/queryBuilder.js - SQL query organization (FIXED)

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
    CASE 
        WHEN i.technician_uid = 0 OR i.technician_uid IS NULL THEN 'Non assigné'
        ELSE CONCAT(tech.firstname, ' ', tech.lastname)
    END as assigned_to,
    CASE 
        WHEN (i.technician_uid = 0 OR i.technician_uid IS NULL) AND (i.date_time IS NULL OR i.date_time = '') THEN 'Technicien et Date manquants'
        WHEN i.technician_uid = 0 OR i.technician_uid IS NULL THEN 'Technicien manquant'
        WHEN i.date_time IS NULL OR i.date_time = '' THEN 'Date manquante'
        ELSE 'Complet'
    END as missing_info
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
                -- If created on weekend, start counting from Monday 9 AM
                GREATEST(0, 48 - 
                    TIMESTAMPDIFF(HOUR, 
                        DATE_ADD(DATE_ADD(i.timestamp, INTERVAL (7 - WEEKDAY(i.timestamp)) DAY), INTERVAL 9 HOUR),
                        NOW()
                    )
                )
            ELSE 
                -- Normal business days calculation
                GREATEST(0, 48 - 
                    (TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) - 
                     (FLOOR(TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) / 24) * 
                      CASE WHEN WEEKDAY(DATE_ADD(i.timestamp, INTERVAL FLOOR(TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) / 24) DAY)) IN (5, 6) THEN 24 ELSE 0 END)
                    )
                )
        END as hours_remaining,
        i.timestamp as created_at`;
    }
    
    query += baseInterventionJoins;
    query += ` WHERE i.uid != 0`;
    
    // Add urgent condition - interventions created in last 48h missing technician OR date
    if (type === 'urgent') {
        query += ` AND (
            -- Missing technician assignment OR missing date assignment
            (i.technician_uid = 0 OR i.technician_uid IS NULL OR i.date_time IS NULL OR i.date_time = '')
            AND
            -- Created within last 48 business hours
            CASE 
                WHEN WEEKDAY(i.timestamp) IN (5, 6) THEN 
                    -- Weekend creation: check if within 48h from next Monday 9 AM
                    TIMESTAMPDIFF(HOUR, 
                        DATE_ADD(DATE_ADD(i.timestamp, INTERVAL (7 - WEEKDAY(i.timestamp)) DAY), INTERVAL 9 HOUR),
                        NOW()
                    ) <= 48
                ELSE 
                    -- Business days: exclude weekends from hour calculation
                    (TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) - 
                     (FLOOR(TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) / 24) * 
                      CASE WHEN WEEKDAY(DATE_ADD(i.timestamp, INTERVAL FLOOR(TIMESTAMPDIFF(HOUR, i.timestamp, NOW()) / 24) DAY)) IN (5, 6) THEN 24 ELSE 0 END)
                    ) <= 48
            END
            AND
            -- Only include specific statuses
            (ist.name LIKE '%planifi%' OR ist.name LIKE '%maintenance%' OR ist.name LIKE '%CDC%' OR ist.name LIKE '%SCH%' OR ist.name LIKE '%MOSELIS%' OR ist.name LIKE '%VIVEST%' OR ist.name = 'Reçue' OR ist.name = 'Assignée')
        )`;
        query += ` ORDER BY hours_remaining ASC, i.uid DESC LIMIT 10`;
    } else if (type === 'recent') {
        query += ` AND i.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
        query += ` ORDER BY i.timestamp DESC LIMIT 10`;
    } else if (type === 'filtered' && status) {
        const statusCondition = getStatusCondition(status);
        if (statusCondition) {
            query += ` AND ${statusCondition}`;
        }
        query += ` ORDER BY i.timestamp DESC LIMIT ${status === 'urgent' ? '50' : '10'}`;
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
    END as hours_remaining,
    i.timestamp as created_at`;

    baseQuery += baseInterventionJoins;
    
    let whereConditions = ['i.uid != 0'];
    
    // Base urgent condition
    whereConditions.push(`(
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
        AND
        (ist.name LIKE '%planifi%' OR ist.name LIKE '%maintenance%' OR ist.name LIKE '%CDC%' OR ist.name LIKE '%SCH%' OR ist.name LIKE '%MOSELIS%' OR ist.name LIKE '%VIVEST%' OR ist.name = 'Reçue' OR ist.name = 'Assignée')
    )`);

    // Search filter
    if (search && search.trim() !== '') {
        const searchTerm = search.trim();
        whereConditions.push(`(
            i.number LIKE '%${searchTerm}%' OR 
            i.title LIKE '%${searchTerm}%' OR 
            i.address LIKE '%${searchTerm}%' OR 
            i.city LIKE '%${searchTerm}%' OR
            i.description LIKE '%${searchTerm}%'
        )`);
    }

    // Status filter
    if (status && status !== '') {
        switch(status) {
            case 'planifie':
                whereConditions.push("(ist.name LIKE '%planifi%')");
                break;
            case 'maintenance':
                whereConditions.push("(ist.name LIKE '%maintenance%')");
                break;
            case 'recu':
                whereConditions.push("(ist.name = 'Reçue')");
                break;
            case 'assigne':
                whereConditions.push("(ist.name = 'Assignée')");
                break;
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

    // Time filter
    if (timeFilter && timeFilter !== '') {
        const timeCondition = `CASE 
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
        END`;
        
        switch(timeFilter) {
            case 'expired':
                whereConditions.push(`(${timeCondition}) <= 0`);
                break;
            case 'critical':
                whereConditions.push(`(${timeCondition}) > 0 AND (${timeCondition}) <= 6`);
                break;
            case 'urgent':
                whereConditions.push(`(${timeCondition}) > 6 AND (${timeCondition}) <= 12`);
                break;
            case 'warning':
                whereConditions.push(`(${timeCondition}) > 12 AND (${timeCondition}) <= 24`);
                break;
            case 'good':
                whereConditions.push(`(${timeCondition}) > 24 AND (${timeCondition}) <= 48`);
                break;
        }
    }

    const whereClause = ' WHERE ' + whereConditions.join(' AND ');
    
    // Build count query
    const countQuery = `SELECT COUNT(*) as total_count FROM interventions i
        LEFT JOIN tenants t ON i.tenant_uid = t.uid
        LEFT JOIN interventions_status ist ON i.status_uid = ist.uid
        LEFT JOIN technicians tech ON i.technician_uid = tech.uid
        ${whereClause}`;

    // Build main query with sorting and pagination
    let orderBy = '';
    const validSortFields = ['intervention_id', 'title', 'status', 'hours_remaining', 'created_at'];
    if (validSortFields.includes(sortBy)) {
        const sortField = sortBy === 'intervention_id' ? 'i.number' : 
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

module.exports = { buildInterventionQuery, buildUrgentAllQuery };