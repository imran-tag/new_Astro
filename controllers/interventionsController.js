// controllers/interventionsController.js - Enhanced with Action Endpoints
const { pool } = require('../config/database');
const { buildInterventionQuery, buildUrgentAllQuery, buildAllRecentQuery } = require('../utils/queryBuilder');
const path = require('path');
const fs = require('fs').promises;

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

// NEW: Get technicians for dropdowns
exports.getTechnicians = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            const query = `
                SELECT uid as technician_id, CONCAT(firstname, ' ', lastname) as name
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
                message: 'ID intervention et technicien requis'
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
                WHERE number REGEXP '^[0-9]+$' 
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

// NEW: Generate Rapport PDF
exports.generateRapport = async (req, res) => {
    try {
        const { interventionId } = req.body;
        
        if (!interventionId) {
            return res.status(400).json({
                success: false,
                message: 'ID intervention requis'
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            // Get intervention details
            const query = `
                SELECT i.*, 
                       c.name as client_name,
                       t.firstname as technician_firstname, 
                       t.lastname as technician_lastname,
                       ist.name as status_name,
                       itype.name as type_name
                FROM interventions i
                LEFT JOIN clients c ON i.client_uid = c.uid
                LEFT JOIN technicians t ON i.technician_uid = t.uid
                LEFT JOIN interventions_status ist ON i.status_uid = ist.uid
                LEFT JOIN interventions_types itype ON i.type_uid = itype.uid
                WHERE i.number = ?
            `;
            
            const [intervention] = await connection.execute(query, [interventionId]);
            
            if (intervention.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention non trouvée'
                });
            }
            
            // Generate PDF filename
            const filename = `rapport_${interventionId}_${Date.now()}.pdf`;
            const filepath = path.join(__dirname, '../generated/interventions', filename);
            
            // Ensure directory exists
            await fs.mkdir(path.dirname(filepath), { recursive: true });
            
            // For now, create a simple text file as placeholder
            // TODO: Implement actual PDF generation using libraries like PDFKit or jsPDF
            const content = `RAPPORT D'INTERVENTION\n\nN° ${interventionId}\nTitre: ${intervention[0].title}\nDescription: ${intervention[0].description}\nDate: ${new Date().toLocaleDateString('fr-FR')}`;
            await fs.writeFile(filepath.replace('.pdf', '.txt'), content);
            
            res.json({
                success: true,
                url: `/nodetest/generated/interventions/${filename.replace('.pdf', '.txt')}`,
                filename: filename.replace('.pdf', '.txt'),
                message: 'Rapport généré avec succès'
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error generating rapport:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du rapport'
        });
    }
};

// NEW: Generate Quitus PDF
exports.generateQuitus = async (req, res) => {
    try {
        const { interventionId } = req.body;
        
        if (!interventionId) {
            return res.status(400).json({
                success: false,
                message: 'ID intervention requis'
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            // Get intervention details
            const query = `
                SELECT i.*, 
                       c.name as client_name,
                       t.firstname as technician_firstname, 
                       t.lastname as technician_lastname,
                       ist.name as status_name,
                       itype.name as type_name
                FROM interventions i
                LEFT JOIN clients c ON i.client_uid = c.uid
                LEFT JOIN technicians t ON i.technician_uid = t.uid
                LEFT JOIN interventions_status ist ON i.status_uid = ist.uid
                LEFT JOIN interventions_types itype ON i.type_uid = itype.uid
                WHERE i.number = ?
            `;
            
            const [intervention] = await connection.execute(query, [interventionId]);
            
            if (intervention.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention non trouvée'
                });
            }
            
            // Generate PDF filename
            const filename = `quitus_${interventionId}_${Date.now()}.pdf`;
            const filepath = path.join(__dirname, '../generated/interventions', filename);
            
            // Ensure directory exists
            await fs.mkdir(path.dirname(filepath), { recursive: true });
            
            // For now, create a simple text file as placeholder
            // TODO: Implement actual PDF generation
            const content = `QUITUS D'INTERVENTION\n\nN° ${interventionId}\nTitre: ${intervention[0].title}\nClient: ${intervention[0].client_name}\nDate: ${new Date().toLocaleDateString('fr-FR')}`;
            await fs.writeFile(filepath.replace('.pdf', '.txt'), content);
            
            res.json({
                success: true,
                url: `/nodetest/generated/interventions/${filename.replace('.pdf', '.txt')}`,
                filename: filename.replace('.pdf', '.txt'),
                message: 'Quitus généré avec succès'
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error generating quitus:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du quitus'
        });
    }
};

// NEW: Delete intervention
exports.deleteIntervention = async (req, res) => {
    try {
        const { interventionId } = req.body;
        
        if (!interventionId) {
            return res.status(400).json({
                success: false,
                message: 'ID intervention requis'
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            // First check if intervention exists
            const checkQuery = `SELECT uid FROM interventions WHERE number = ?`;
            const [existing] = await connection.execute(checkQuery, [interventionId]);
            
            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention non trouvée'
                });
            }
            
            // Delete intervention
            const deleteQuery = `DELETE FROM interventions WHERE number = ?`;
            const [result] = await connection.execute(deleteQuery, [interventionId]);
            
            if (result.affectedRows > 0) {
                res.json({
                    success: true,
                    message: 'Intervention supprimée avec succès'
                });
            } else {
                res.json({
                    success: false,
                    message: 'Échec de la suppression'
                });
            }
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error deleting intervention:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'intervention'
        });
    }
};

// NEW: Get intervention details for public view
exports.getPublicIntervention = async (req, res) => {
    try {
        const { interventionId } = req.params;
        
        if (!interventionId) {
            return res.status(400).json({
                success: false,
                message: 'ID intervention requis'
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            // Get intervention details for public view
            const query = `
                SELECT i.number, i.title, i.description, i.date_time, i.address, i.city,
                       i.priority, i.status_uid,
                       c.name as client_name,
                       t.firstname as technician_firstname, 
                       t.lastname as technician_lastname,
                       ist.name as status_name,
                       itype.name as type_name
                FROM interventions i
                LEFT JOIN clients c ON i.client_uid = c.uid
                LEFT JOIN technicians t ON i.technician_uid = t.uid
                LEFT JOIN interventions_status ist ON i.status_uid = ist.uid
                LEFT JOIN interventions_types itype ON i.type_uid = itype.uid
                WHERE i.number = ?
            `;
            
            const [intervention] = await connection.execute(query, [interventionId]);
            
            if (intervention.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention non trouvée'
                });
            }
            
            res.json({
                success: true,
                data: intervention[0]
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error fetching public intervention:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'intervention'
        });
    }
};

// Existing functions remain unchanged...
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

exports.getBusinesses = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            const query = `
                SELECT uid, title as name 
                FROM businesses 
                WHERE uid != 0 
                ORDER BY title
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

exports.getClients = async (req, res) => {
    try {
        const { business_id } = req.query;
        
        const connection = await pool.getConnection();
        
        try {
            let query = `
                SELECT uid, name 
                FROM clients 
                WHERE uid != 0
            `;
            
            if (business_id && business_id !== '0') {
                query += ` AND business_uid = ?`;
            }
            
            query += ` ORDER BY name`;
            
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

// Helper function to generate public number (UUID-like)
function generatePublicNumber() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}