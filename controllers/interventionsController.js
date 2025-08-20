// controllers/interventionsController.js - FIXED for Node.js v12
const { pool } = require('../config/database');
const { buildInterventionQuery, buildUrgentAllQuery, buildAllRecentQuery } = require('../utils/queryBuilder');

exports.getUrgent = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            const query = buildInterventionQuery('urgent');
            const [urgent] = await connection.execute(query);
            res.json(urgent);
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Urgent error:', error);
        res.status(500).json([]);
    }
};

exports.getRecent = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            const query = buildInterventionQuery('recent');
            const [recent] = await connection.execute(query);
            res.json(recent);
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Recent error:', error);
        res.status(500).json([]);
    }
};

exports.getFiltered = async (req, res) => {
    const status = req.params.status;
    
    try {
        const connection = await pool.getConnection();
        
        try {
            const query = buildInterventionQuery('filtered', status);
            const [interventions] = await connection.execute(query);
            res.json(interventions);
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Filtered interventions error:', error);
        res.status(500).json([]);
    }
};

// NEW: Urgent interventions with pagination and filters
exports.getUrgentAll = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 25,
            search = '',
            status = '',
            missing = '',
            timeFilter = '',
            sortBy = 'hours_remaining',
            sortOrder = 'asc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const { query, countQuery } = buildUrgentAllQuery({
            search,
            status,
            missing,
            timeFilter,
            sortBy,
            sortOrder,
            limit: parseInt(limit),
            offset
        });

        const connection = await pool.getConnection();
        
        try {
            // Get total count
            const [countResult] = await connection.execute(countQuery);
            const totalCount = countResult[0] && countResult[0].total_count ? 
                countResult[0].total_count : 0;

            // Get results
            const [results] = await connection.execute(query);

            // Calculate pagination info
            const totalPages = Math.ceil(totalCount / parseInt(limit));
            const hasNextPage = parseInt(page) < totalPages;
            const hasPrevPage = parseInt(page) > 1;

            res.json({
                data: results,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNextPage,
                    hasPrevPage,
                    limit: parseInt(limit)
                }
            });
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error fetching urgent interventions with pagination:', error);
        res.status(500).json({ 
            error: 'Failed to fetch urgent interventions',
            message: error.message,
            data: [],
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalCount: 0,
                hasNextPage: false,
                hasPrevPage: false,
                limit: 25
            }
        });
    }
};

// NEW: All recent interventions with pagination and filters  
exports.getAllRecent = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 25,
            search = '',
            status = '',
            priority = '',
            technician = '',
            date = '',
            sortBy = 'date_time',
            sortOrder = 'desc'
        } = req.query;

        // Debug: Log received parameters
        console.log('getAllRecent - Received parameters:', {
            page, limit, search, status, priority, technician, date, sortBy, sortOrder
        });

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const { query, countQuery } = buildAllRecentQuery({
            search,
            status,
            priority,
            technician,
            date,
            sortBy,
            sortOrder,
            limit: parseInt(limit),
            offset
        });

        const connection = await pool.getConnection();
        
        try {
            // Get total count
            const [countResult] = await connection.execute(countQuery);
            const totalCount = countResult[0] && countResult[0].total_count ? 
                countResult[0].total_count : 0;

            // Get results
            const [results] = await connection.execute(query);

            // Debug: Log query results
            console.log('getAllRecent - Query executed, found', results.length, 'results, total count:', totalCount);

            // Calculate pagination info
            const totalPages = Math.ceil(totalCount / parseInt(limit));
            const hasNextPage = parseInt(page) < totalPages;
            const hasPrevPage = parseInt(page) > 1;

            res.json({
                data: results,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNextPage,
                    hasPrevPage,
                    limit: parseInt(limit)
                }
            });
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error fetching all recent interventions:', error);
        res.status(500).json({ 
            error: 'Failed to fetch interventions',
            message: error.message,
            data: [],
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalCount: 0,
                hasNextPage: false,
                hasPrevPage: false,
                limit: 25
            }
        });
    }
};

// NEW: Get all technicians for filter dropdown
exports.getTechnicians = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            const query = `
                SELECT 
                    uid as technician_id,
                    CONCAT(firstname, ' ', lastname) as name,
                    firstname,
                    lastname
                FROM technicians 
                WHERE uid != 0 
                ORDER BY firstname, lastname
            `;
            
            const [technicians] = await connection.execute(query);
            res.json(technicians);
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error fetching technicians:', error);
        res.status(500).json([]);
    }
};

// NEW: Assign technician to intervention
exports.assignTechnician = async (req, res) => {
    try {
        const { interventionId, technicianId } = req.body;
        
        if (!interventionId || !technicianId) {
            return res.status(400).json({
                success: false,
                message: 'ID intervention et ID technicien requis'
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            const updateQuery = `
                UPDATE interventions 
                SET technician_uid = ? 
                WHERE number = ?
            `;
            
            const [result] = await connection.execute(updateQuery, [technicianId, interventionId]);
            
            if (result.affectedRows > 0) {
                res.json({
                    success: true,
                    message: 'Technicien assigné avec succès'
                });
            } else {
                res.json({
                    success: false,
                    message: 'Intervention non trouvée'
                });
            }
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error assigning technician:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'assignation du technicien'
        });
    }
};

// NEW: Assign date to intervention
exports.assignDate = async (req, res) => {
    try {
        const { interventionId, date, time } = req.body;
        
        if (!interventionId || !date) {
            return res.status(400).json({
                success: false,
                message: 'ID intervention et date requis'
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            // Construct the date_time field (DD/MM/YYYY format as used in old system)
            let dateTimeValue = date;
            if (time) {
                dateTimeValue += ` ${time}`;
            }
            
            const updateQuery = `
                UPDATE interventions 
                SET date_time = ? 
                WHERE number = ?
            `;
            
            const [result] = await connection.execute(updateQuery, [dateTimeValue, interventionId]);
            
            if (result.affectedRows > 0) {
                res.json({
                    success: true,
                    message: 'Date assignée avec succès'
                });
            } else {
                res.json({
                    success: false,
                    message: 'Intervention non trouvée'
                });
            }
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error assigning date:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'assignation de la date'
        });
    }
};

// NEW: Generate intervention number
exports.getInterventionNumber = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // Get the highest existing intervention number
            const query = `
                SELECT CAST(number AS UNSIGNED) as number 
                FROM interventions 
                WHERE number REGEXP '^[0-9]+ 
                ORDER BY CAST(number AS UNSIGNED) DESC 
                LIMIT 1
            `;
            
            const [result] = await connection.execute(query);
            
            let nextNumber = 1;
            if (result.length > 0 && result[0].number) {
                nextNumber = parseInt(result[0].number) + 1;
            }
            
            // Format with leading zeros (4 digits)
            const formattedNumber = nextNumber.toString().padStart(4, '0');
            
            res.json({
                success: true,
                number: formattedNumber
            });
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error generating intervention number:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du numéro'
        });
    }
};

// NEW: Get intervention statuses
exports.getInterventionStatuses = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            const query = `
                SELECT uid, name 
                FROM interventions_status 
                WHERE uid != 0 
                ORDER BY name
            `;
            
            const [statuses] = await connection.execute(query);
            res.json(statuses);
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error fetching intervention statuses:', error);
        res.status(500).json([]);
    }
};

// NEW: Get intervention types
exports.getInterventionTypes = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            const query = `
                SELECT uid, name 
                FROM interventions_types 
                WHERE uid != 0 
                ORDER BY name
            `;
            
            const [types] = await connection.execute(query);
            res.json(types);
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error fetching intervention types:', error);
        res.status(500).json([]);
    }
};

// NEW: Get businesses
exports.getBusinesses = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            const query = `
                SELECT uid, number, title 
                FROM businesses 
                WHERE uid != 0 
                ORDER BY number, title
            `;
            
            const [businesses] = await connection.execute(query);
            res.json(businesses);
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error fetching businesses:', error);
        res.status(500).json([]);
    }
};

// NEW: Get clients for a business
exports.getClients = async (req, res) => {
    try {
        const { business_id } = req.query;
        const connection = await pool.getConnection();
        
        try {
            let query = `
                SELECT uid, firstname, lastname 
                FROM clients 
                WHERE uid != 0 
            `;
            
            if (business_id) {
                query += ` AND business_uid = ? `;
            }
            
            query += ` ORDER BY firstname, lastname`;
            
            const [clients] = await connection.execute(query, business_id ? [business_id] : []);
            res.json(clients);
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json([]);
    }
};

// NEW: Create intervention
exports.createIntervention = async (req, res) => {
    try {
        const {
            numero,
            statut,
            type,
            priorite,
            affaire,
            client,
            adresse,
            ville,
            immeuble,
            etage,
            appartement,
            titre,
            date,
            date_echeance,
            technicien,
            description
        } = req.body;
        
        // Validate required fields
        if (!numero || !statut || !type || !priorite || !affaire || !client || !adresse || !ville || !titre || !description) {
            return res.status(400).json({
                success: false,
                message: 'Champs obligatoires manquants'
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            // Check if intervention number already exists
            const checkQuery = `SELECT uid FROM interventions WHERE number = ?`;
            const [existing] = await connection.execute(checkQuery, [numero]);
            
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ce numéro d\'intervention existe déjà'
                });
            }
            
            // Generate public number (UUID-like)
            const publicNumber = generatePublicNumber();
            
            // Insert intervention
            const insertQuery = `
                INSERT INTO interventions (
                    public_number,
                    agency_uid,
                    business_uid,
                    client_uid,
                    tenant_uid,
                    tenant_name,
                    technician_uid,
                    referent_uid,
                    number,
                    status_uid,
                    type_uid,
                    priority,
                    title,
                    date_time,
                    due_date,
                    time_from,
                    time_to,
                    address,
                    city,
                    building,
                    floor,
                    appartment,
                    description,
                    timestamp
                ) VALUES (?, 1, ?, ?, 0, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?, ?, NOW())
            `;
            
            const values = [
                publicNumber,
                affaire,
                client,
                appartement || '',
                technicien || 0,
                numero,
                statut,
                type,
                priorite,
                titre,
                date || null,
                date_echeance || null,
                adresse,
                ville,
                immeuble || '',
                etage || '',
                appartement || '',
                description
            ];
            
            const [result] = await connection.execute(insertQuery, values);
            
            if (result.insertId) {
                res.json({
                    success: true,
                    message: 'Intervention créée avec succès',
                    interventionId: result.insertId,
                    publicNumber: publicNumber
                });
            } else {
                throw new Error('Échec de l\'insertion');
            }
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error creating intervention:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'intervention'
        });
    }
};

// Helper function to generate public number (similar to old system)
function generatePublicNumber() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}