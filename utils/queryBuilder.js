// utils/queryBuilder.js - SQL query organization

const baseInterventionFields = `
    i.public_number as intervention_id,
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
    CASE 
        WHEN i.technician_uid = 0 OR i.technician_uid IS NULL THEN 'Non assigné'
        ELSE CONCAT(tech.firstname, ' ', tech.lastname)
    END as assigned_to
`;

const baseInterventionJoins = `
    FROM interventions i
    LEFT JOIN tenants t ON i.tenant_uid = t.uid
    LEFT JOIN interventions_status ist ON i.status_uid = ist.uid
    LEFT JOIN technicians tech ON i.technician_uid = tech.uid
`;

function buildInterventionQuery(type, status = null) {
    let query = `SELECT ${baseInterventionFields}`;
    
    // Add hours_remaining for urgent interventions
    if (type === 'urgent') {
        query += `, CASE 
            WHEN i.due_date IS NOT NULL AND i.due_date != '' THEN 
                TIMESTAMPDIFF(HOUR, NOW(), STR_TO_DATE(i.due_date, '%d/%m/%Y'))
            ELSE 24
        END as hours_remaining`;
    }
    
    query += baseInterventionJoins;
    query += ` WHERE i.uid != 0`;
    
    // Add urgent condition
    if (type === 'urgent') {
        query += ` AND (
            (i.due_date IS NOT NULL AND i.due_date != '' AND STR_TO_DATE(i.due_date, '%d/%m/%Y') >= CURDATE() AND TIMESTAMPDIFF(HOUR, NOW(), STR_TO_DATE(i.due_date, '%d/%m/%Y')) <= 48)
            OR (i.due_date IS NULL OR i.due_date = '')
        )`;
    }
    
    // Add status filtering
    if (type === 'filtered' && status) {
        const statusCondition = getStatusCondition(status);
        if (statusCondition) {
            query += ` AND ${statusCondition}`;
        }
    }
    
    // Add ordering and limits
    if (type === 'urgent') {
        query += ` ORDER BY 
            CASE WHEN i.due_date IS NOT NULL AND i.due_date != '' THEN STR_TO_DATE(i.due_date, '%d/%m/%Y') ELSE CURDATE() END ASC,
            i.uid DESC LIMIT 10`;
    } else {
        query += ` ORDER BY i.uid DESC LIMIT ${type === 'filtered' ? '50' : '10'}`;
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

module.exports = { buildInterventionQuery };