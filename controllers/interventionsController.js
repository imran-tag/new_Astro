// controllers/interventionsController.js - Enhanced with Action Endpoints
const { pool } = require('../config/database');
const { buildInterventionQuery, buildUrgentAllQuery, buildAllRecentQuery } = require('../utils/queryBuilder');
const path = require('path');
const fs = require('fs').promises;
const PDFDocument = require('pdfkit');


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


exports.getAllRecent = async (req, res) => {
    try {
        console.log('=== getAllRecent API called ===');
        console.log('Query parameters:', req.query);
        
        const {
            page = 1,
            limit = 25,
            search = '',
            status = '',
            technician = '',
            priority = '',
            date = '',  // FIXED: Changed from dateRange to date
            sortBy = 'created_at',  // FIXED: Changed default to created_at 
            sortOrder = 'desc'
        } = req.query;

        // Log the extracted parameters
        console.log('Extracted parameters:', {
            page, limit, search, status, technician, priority, date, sortBy, sortOrder
        });

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // FIXED: Pass 'date' instead of 'dateRange' to buildAllRecentQuery
        const { query, countQuery } = buildAllRecentQuery({
            search,
            status,
            technician,
            priority,
            date,  // FIXED: Changed from dateRange to date
            sortBy,
            sortOrder,
            limit: parseInt(limit),
            offset
        });

        console.log('Generated queries:');
        console.log('Main query:', query);
        console.log('Count query:', countQuery);

        const connection = await pool.getConnection();
        
        try {
            // Get total count first
            const [countResult] = await connection.execute(countQuery);
            const totalCount = countResult[0] && countResult[0].total_count ? 
                parseInt(countResult[0].total_count) : 0;
            
            console.log('Total count result:', totalCount);

            // Get results
            const [results] = await connection.execute(query);
            console.log('Results count:', results.length);
            
            // Log first result for debugging
            if (results.length > 0) {
                console.log('First result:', results[0]);
            }

            // Calculate pagination info
            const totalPages = Math.ceil(totalCount / parseInt(limit));
            const hasNextPage = parseInt(page) < totalPages;
            const hasPrevPage = parseInt(page) > 1;

            const responseData = {
                data: results,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNextPage,
                    hasPrevPage,
                    limit: parseInt(limit)
                }
            };
            
            console.log('Response pagination:', responseData.pagination);
            res.json(responseData);
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error in getAllRecent:', error);
        console.error('Error stack:', error.stack);
        
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
            // FIXED: Only get technicians from agency 1
            const query = `
                SELECT uid as technician_id, CONCAT(firstname, ' ', lastname) as name
                FROM technicians 
                WHERE uid != 0 AND agency_uid = 1
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
            // Get detailed intervention info like in old_Astro including all needed fields
            const interventionQuery = `
                SELECT i.*, 
                       c.name as client_name,
                       t.firstname as technician_firstname, 
                       t.lastname as technician_lastname,
                       ist.name as status_name,
                       itype.name as intervention_type,
                       a.name as agency_name,
                       a.address as agency_address,
                       a.city as agency_city,
                       a.zipcode as agency_zipcode,
                       a.gsm as agency_phone,
                       a.email as agency_email,
                       a.logo_url as agency_logo,
                       i.images_before,
                       i.images_after,
                       i.quality,
                       i.security,
                       i.comments,
                       i.signature,
                       i.time_start,
                       i.time_end,
                       i.time_pictures_before,
                       i.time_pictures_after,
                       i.tenant_name,
                       i.building,
                       i.floor,
                       i.description,
                       b.number as business_number,
                       b.title as business_title
                FROM interventions i
                LEFT JOIN clients c ON i.client_uid = c.uid
                LEFT JOIN technicians t ON i.technician_uid = t.uid
                LEFT JOIN interventions_status ist ON i.status_uid = ist.uid
                LEFT JOIN interventions_types itype ON i.type_uid = itype.uid
                LEFT JOIN agency a ON i.agency_uid = a.uid
                LEFT JOIN businesses b ON i.business_uid = b.uid
                WHERE i.number = ?
            `;
            
            const [intervention] = await connection.execute(interventionQuery, [interventionId]);
            
            if (intervention.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention non trouvée'
                });
            }
            
            const interventionData = intervention[0];
            
            // Create timestamp like in old_Astro
            const now = new Date();
            const timeString = now.getHours().toString().padStart(2, '0') + 'h' + 
                             now.getMinutes().toString().padStart(2, '0');
            const dateString = now.getDate().toString().padStart(2, '0') + '-' +
                             (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
                             now.getFullYear();
            
            const filename = `intervention_${dateString}_${timeString}_${now.getTime()}.pdf`;
            const generatedDir = path.join(__dirname, '../generated/interventions');
            
            // Ensure directory exists
            await fs.mkdir(generatedDir, { recursive: true });
            
            const filepath = path.join(generatedDir, filename);
            
            // Create PDF document
            const doc = new PDFDocument();
            const stream = require('fs').createWriteStream(filepath);
            doc.pipe(stream);
            
            // Build PDF content following old_Astro structure
            await generateRapportPDF(doc, interventionData);
            
            doc.end();
            
            // Wait for file to be written
            await new Promise((resolve, reject) => {
                stream.on('finish', resolve);
                stream.on('error', reject);
            });
            
            // Return response like old_Astro
            res.json({
                success: true,
                code: '1',
                name: filename,
                url: `/nodetest/generated/interventions/${filename}`,
                filename: filename,
                logo: interventionData.agency_logo,
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

// UPDATED: Generate Quitus PDF - Following old_Astro implementation  
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
            // Get detailed intervention info like in old_Astro including all needed fields
            const interventionQuery = `
                SELECT i.*, 
                       c.name as client_name,
                       t.firstname as technician_firstname, 
                       t.lastname as technician_lastname,
                       ist.name as status_name,
                       itype.name as intervention_type,
                       a.name as agency_name,
                       a.address as agency_address,
                       a.city as agency_city,
                       a.zipcode as agency_zipcode,
                       a.gsm as agency_phone,
                       a.email as agency_email,
                       a.logo_url as agency_logo,
                       i.images_before,
                       i.images_after,
                       i.quality,
                       i.security,
                       i.comments,
                       i.signature,
                       i.time_start,
                       i.time_end,
                       i.time_pictures_before,
                       i.time_pictures_after,
                       i.tenant_name,
                       i.building,
                       i.floor
                FROM interventions i
                LEFT JOIN clients c ON i.client_uid = c.uid
                LEFT JOIN technicians t ON i.technician_uid = t.uid
                LEFT JOIN interventions_status ist ON i.status_uid = ist.uid
                LEFT JOIN interventions_types itype ON i.type_uid = itype.uid
                LEFT JOIN agency a ON i.agency_uid = a.uid
                WHERE i.number = ?
            `;
            
            const [intervention] = await connection.execute(interventionQuery, [interventionId]);
            
            if (intervention.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention non trouvée'
                });
            }
            
            const interventionData = intervention[0];
            
            // Create timestamp like in old_Astro
            const now = new Date();
            const timeString = now.getHours().toString().padStart(2, '0') + 'h' + 
                             now.getMinutes().toString().padStart(2, '0');
            const dateString = now.getDate().toString().padStart(2, '0') + '-' +
                             (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
                             now.getFullYear();
            
            const filename = `quitus_${dateString}_${timeString}_${now.getTime()}.pdf`;
            const generatedDir = path.join(__dirname, '../generated/interventions');
            
            // Ensure directory exists
            await fs.mkdir(generatedDir, { recursive: true });
            
            const filepath = path.join(generatedDir, filename);
            
            // Create PDF document
            const doc = new PDFDocument();
            const stream = require('fs').createWriteStream(filepath);
            doc.pipe(stream);
            
            // Build PDF content following old_Astro structure  
            await generateQuitusPDF(doc, interventionData);
            
            doc.end();
            
            // Wait for file to be written
            await new Promise((resolve, reject) => {
                stream.on('finish', resolve);
                stream.on('error', reject);
            });
            
            // Return response like old_Astro
            res.json({
                success: true,
                code: '1',
                name: filename,
                url: `/nodetest/generated/interventions/${filename}`,
                filename: filename,
                logo: interventionData.agency_logo,
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


exports.getChantiersOnly = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // Use the exact same query as getRecent, but filter for chantier business numbers
            const chantierNumbers = [144, 146, 150, 155, 156, 157, 158, 159, 160, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184];
            const placeholders = chantierNumbers.map(() => '?').join(',');
            
            const query = `
                SELECT 
                    i.number as intervention_id,
                    i.title,
                    CASE 
                        WHEN i.address IS NOT NULL AND i.address != '' THEN CONCAT(i.address, CASE WHEN i.city IS NOT NULL AND i.city != '' THEN CONCAT(', ', i.city) ELSE '' END)
                        ELSE 'Adresse non définie'
                    END as address,
                    i.description,
                    ist.name as status,
                    i.priority,
                    i.date_time,
                    i.price,
                    CASE 
                        WHEN i.technician_uid = 0 OR i.technician_uid IS NULL THEN 'Non assigné'
                        ELSE CONCAT(tech.firstname, ' ', tech.lastname)
                    END as assigned_to,
                    COALESCE(b.number, 'N/A') as business_number,
                    COALESCE(b.title, 'Titre inconnu') as business_title,
                    i.business_uid
                FROM interventions i
                LEFT JOIN interventions_status ist ON i.status_uid = ist.uid
                LEFT JOIN technicians tech ON i.technician_uid = tech.uid
                LEFT JOIN businesses b ON i.business_uid = b.uid
                WHERE i.uid != 0 
                    AND i.agency_uid = 1 
                    AND b.number IS NOT NULL
                    AND CAST(b.number AS UNSIGNED) IN (${placeholders})
                ORDER BY b.number, i.timestamp DESC 
                LIMIT 2000
            `;
            
            console.log('Executing chantiers query...');
            const [chantiers] = await connection.execute(query, chantierNumbers);
            
            console.log(`Found ${chantiers.length} interventions across chantiers`);
            
            // Debug: Log unique business numbers found
            const uniqueBusinessNumbers = [...new Set(chantiers.map(c => c.business_number))];
            console.log('Unique business numbers found:', uniqueBusinessNumbers);
            
            // Debug: Log sample data
            if (chantiers.length > 0) {
                console.log('Sample intervention data:');
                console.log('First intervention:', {
                    business_number: chantiers[0].business_number,
                    business_title: chantiers[0].business_title,
                    intervention_id: chantiers[0].intervention_id,
                    title: chantiers[0].title
                });
            }
            
            res.json(chantiers);
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Chantiers error:', error);
        res.status(500).json([]);
    }
};

// Helper function to generate Rapport PDF content - Following old_Astro exactly
async function generateRapportPDF(doc, interventionData) {
    try {
        const path = require('path');
        
        // Header section with logo and agency info (following old_Astro structure)
        doc.fontSize(18).font('Helvetica-Bold');
        
        // Add logo if available - using old_Astro path
        if (interventionData.agency_logo) {
            try {
                // Fix logo path - old_Astro is at /home/astrotec/public_html/astro-ges/
                let cleanLogoPath = interventionData.agency_logo.startsWith('/') ? 
                    interventionData.agency_logo.substring(1) : interventionData.agency_logo;
                
                const logoPathsToTry = [
                    `/home/astrotec/public_html/astro-ges/${cleanLogoPath}`,
                    `/home/astrotec/public_html/astro-ges/public/${cleanLogoPath}`,
                    path.join('/home/astrotec/public_html/astro-ges', cleanLogoPath),
                    interventionData.agency_logo, // Original path as fallback
                ];
                
                let foundLogoPath = null;
                for (const tryPath of logoPathsToTry) {
                    if (require('fs').existsSync(tryPath)) {
                        foundLogoPath = tryPath;
                        console.log(`Found logo at: ${foundLogoPath}`);
                        break;
                    }
                }
                
                if (foundLogoPath) {
                    doc.image(foundLogoPath, 50, 50, { width: 100 });
                } else {
                    console.log('Logo not found at any path:', logoPathsToTry);
                }
            } catch (err) {
                console.log('Logo loading failed:', err.message);
            }
        }
        
        // Agency information (top right) - exactly like old_Astro
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(interventionData.agency_name || 'Agency Name', 400, 50, { align: 'right' });
        doc.text(interventionData.agency_address || '', 400, 65, { align: 'right' });
        doc.text(`${interventionData.agency_city || ''}, ${interventionData.agency_zipcode || ''}`, 400, 80, { align: 'right' });
        doc.text(`Tél: ${interventionData.agency_phone || ''}`, 400, 95, { align: 'right' });
        doc.text(`Email: ${interventionData.agency_email || ''}`, 400, 110, { align: 'right' });
        
        // Title - exactly like old_Astro
        doc.fontSize(16).font('Helvetica-Bold');
        doc.fillColor('#0860a8'); // Blue color like old_Astro
        doc.text("RAPPORT D'INTERVENTION", 50, 150, { align: 'center' });
        doc.fillColor('black');
        
        // Intervention details section - following old_Astro format exactly
        let yPosition = 200;
        
        // Business number
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Numéro affaire :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        doc.text(interventionData.business_number || 'N/A', 200, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Titre affaire :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        doc.text(interventionData.business_title || 'N/A', 200, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Titre intervention :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        doc.text(interventionData.title || 'Sans titre', 200, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Date :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        // Fix date formatting
        let dateStr = 'N/A';
        if (interventionData.date_time) {
            try {
                const date = new Date(interventionData.date_time);
                if (!isNaN(date.getTime())) {
                    dateStr = date.toLocaleDateString('fr-FR');
                }
            } catch (e) {
                console.log('Date parsing error:', e);
            }
        }
        doc.text(dateStr, 200, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Type intervention :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        doc.text(interventionData.intervention_type || 'N/A', 200, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Nom du client :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        doc.text(interventionData.client_name || 'N/A', 200, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Nom du locataire :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        doc.text(interventionData.tenant_name || 'N/A', 200, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Immeuble :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        doc.text(interventionData.building || '', 200, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Etage :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        doc.text(interventionData.floor || '', 200, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Adresse :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        doc.text(interventionData.address || 'N/A', 200, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Ville :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        doc.text(interventionData.city || 'N/A', 200, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Nom du technicien :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        const technicianName = interventionData.technician_firstname && interventionData.technician_lastname ?
            `${interventionData.technician_firstname} ${interventionData.technician_lastname}` : 'Non assigné';
        doc.text(technicianName, 200, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Description :', 50, yPosition);
        doc.font('Helvetica').fillColor('black');
        
        // Add description content right after the label
        yPosition += 15;
        const description = interventionData.description || 'Aucune description fournie';
        doc.text(description, 50, yPosition, { width: 500, align: 'left' });
        
        // Add line separator like old_Astro
        yPosition += 40;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 20;
        
        // Images before intervention section
        if (interventionData.images_before && interventionData.images_before.trim() !== '') {
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#0860a8');
            doc.text('Photos avant intervention :', 50, yPosition);
            yPosition += 20;
            
            // Process images - split by ";/" like old_Astro
            const imagesBefore = interventionData.images_before.split(';/').filter(img => img.trim() !== '');
            
            for (const imagePath of imagesBefore) {
                if (imagePath.trim() !== '') {
                    try {
                        // Fix path resolution - old_Astro is at /home/astrotec/public_html/astro-ges/
                        let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
                        
                        // Try different path variations
                        const pathsToTry = [
                            `/home/astrotec/public_html/astro-ges/${cleanPath}`,
                            `/home/astrotec/public_html/astro-ges/public/${cleanPath}`,
                            path.join('/home/astrotec/public_html/astro-ges', cleanPath),
                            imagePath, // Original path as fallback
                        ];
                        
                        let foundPath = null;
                        for (const tryPath of pathsToTry) {
                            if (require('fs').existsSync(tryPath)) {
                                foundPath = tryPath;
                                console.log(`Found image at: ${foundPath}`);
                                break;
                            }
                        }
                        
                        if (foundPath) {
                            // Add image with better sizing like old_Astro - larger images
                            doc.image(foundPath, 50, yPosition, { width: 200, height: 150 });
                            yPosition += 160; // More space between images
                        } else {
                            console.log('Image not found at any path for:', imagePath);
                            console.log('Tried paths:', pathsToTry);
                            // Add placeholder text
                            doc.fontSize(10).font('Helvetica').fillColor('gray');
                            doc.text(`[Image non trouvée: ${cleanPath}]`, 50, yPosition);
                            doc.fillColor('black');
                            yPosition += 20;
                        }
                    } catch (err) {
                        console.log('Error adding image:', err.message);
                        doc.fontSize(10).font('Helvetica').fillColor('gray');
                        doc.text(`[Erreur image: ${imagePath}]`, 50, yPosition);
                        doc.fillColor('black');
                        yPosition += 20;
                    }
                }
            }
        }
        
        // Add new page if needed
        if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
        }
        
        // Images after intervention section
        if (interventionData.images_after && interventionData.images_after.trim() !== '') {
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#0860a8');
            doc.text('Photos après intervention :', 50, yPosition);
            yPosition += 20;
            
            // Process images - split by ";/" like old_Astro
            const imagesAfter = interventionData.images_after.split(';/').filter(img => img.trim() !== '');
            
            for (const imagePath of imagesAfter) {
                if (imagePath.trim() !== '') {
                    try {
                        // Fix path resolution - old_Astro is at /home/astrotec/public_html/astro-ges/
                        let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
                        
                        // Try different path variations
                        const pathsToTry = [
                            `/home/astrotec/public_html/astro-ges/${cleanPath}`,
                            `/home/astrotec/public_html/astro-ges/public/${cleanPath}`,
                            path.join('/home/astrotec/public_html/astro-ges', cleanPath),
                            imagePath, // Original path as fallback
                        ];
                        
                        let foundPath = null;
                        for (const tryPath of pathsToTry) {
                            if (require('fs').existsSync(tryPath)) {
                                foundPath = tryPath;
                                console.log(`Found image at: ${foundPath}`);
                                break;
                            }
                        }
                        
                        if (foundPath) {
                            // Add image with better sizing like old_Astro - larger images
                            doc.image(foundPath, 50, yPosition, { width: 200, height: 150 });
                            yPosition += 160; // More space between images
                        } else {
                            console.log('Image not found at any path for:', imagePath);
                            console.log('Tried paths:', pathsToTry);
                            // Add placeholder text
                            doc.fontSize(10).font('Helvetica').fillColor('gray');
                            doc.text(`[Image non trouvée: ${cleanPath}]`, 50, yPosition);
                            doc.fillColor('black');
                            yPosition += 20;
                        }
                    } catch (err) {
                        console.log('Error adding image:', err.message);
                        doc.fontSize(10).font('Helvetica').fillColor('gray');
                        doc.text(`[Erreur image: ${imagePath}]`, 50, yPosition);
                        doc.fillColor('black');
                        yPosition += 20;
                    }
                }
            }
        }
        
        // Add new page if needed for quality/security sections
        if (yPosition > 600) {
            doc.addPage();
            yPosition = 50;
        }
        
        // Quality section - exactly like old_Astro with checkboxes
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Qualité :', 50, yPosition);
        yPosition += 20;
        
        doc.fontSize(10).font('Helvetica').fillColor('black');
        // Parse quality JSON like old_Astro
        let qualityChecks = [];
        if (interventionData.quality) {
            try {
                const qualityData = JSON.parse(interventionData.quality);
                if (qualityData.ranger_outils) qualityChecks.push('✓ Ranger les outils');
                else qualityChecks.push('☐ Ranger les outils');
                
                if (qualityData.nettoyer_chantier) qualityChecks.push('✓ Nettoyer le chantier');
                else qualityChecks.push('☐ Nettoyer le chantier');
                
                if (qualityData.mise_pression) qualityChecks.push('✓ Mise en pression des appareils sanitaires');
                else qualityChecks.push('☐ Mise en pression des appareils sanitaires');
            } catch (e) {
                // Default checkboxes
                qualityChecks = ['☐ Ranger les outils', '☐ Nettoyer le chantier', '☐ Mise en pression des appareils sanitaires'];
            }
        } else {
            qualityChecks = ['☐ Ranger les outils', '☐ Nettoyer le chantier', '☐ Mise en pression des appareils sanitaires'];
        }
        
        for (const check of qualityChecks) {
            doc.text(check, 50, yPosition);
            yPosition += 15;
        }
        
        yPosition += 10;
        
        // Security section - exactly like old_Astro with checkboxes
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Sécurité :', 50, yPosition);
        yPosition += 20;
        
        doc.fontSize(10).font('Helvetica').fillColor('black');
        // Parse security JSON like old_Astro
        let securityChecks = [];
        if (interventionData.security) {
            try {
                const securityData = JSON.parse(interventionData.security);
                if (securityData.lire_pieces) securityChecks.push('✓ Lire les pièces et informer son équipe');
                else securityChecks.push('☐ Lire les pièces et informer son équipe');
                
                if (securityData.mettre_epi) securityChecks.push('✓ Mettre les EPI');
                else securityChecks.push('☐ Mettre les EPI');
                
                if (securityData.poser_materiel) securityChecks.push('✓ Poser le matériel sur une protection');
                else securityChecks.push('☐ Poser le matériel sur une protection');
            } catch (e) {
                // Default checkboxes
                securityChecks = ['☐ Lire les pièces et informer son équipe', '☐ Mettre les EPI', '☐ Poser le matériel sur une protection'];
            }
        } else {
            securityChecks = ['☐ Lire les pièces et informer son équipe', '☐ Mettre les EPI', '☐ Poser le matériel sur une protection'];
        }
        
        for (const check of securityChecks) {
            doc.text(check, 50, yPosition);
            yPosition += 15;
        }
        
        yPosition += 20;
        
        // Comments section - exactly like old_Astro
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Commentaire :', 50, yPosition);
        yPosition += 20;
        
        doc.fontSize(10).font('Helvetica').fillColor('black');
        const comments = interventionData.comments || '';
        doc.text(comments, 50, yPosition, { width: 500, align: 'left' });
        yPosition += 40;
        
        // Signature section - exactly like old_Astro
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#0860a8');
        doc.text('Signature :', 50, yPosition);
        yPosition += 20;
        
        // Add signature image if available
        if (interventionData.signature && interventionData.signature.trim() !== '') {
            try {
                // Fix signature path - old_Astro is at /home/astrotec/public_html/astro-ges/
                let cleanSignaturePath = interventionData.signature.startsWith('/') ? 
                    interventionData.signature.substring(1) : interventionData.signature;
                
                const signaturePathsToTry = [
                    `/home/astrotec/public_html/astro-ges/${cleanSignaturePath}`,
                    `/home/astrotec/public_html/astro-ges/public/${cleanSignaturePath}`,
                    path.join('/home/astrotec/public_html/astro-ges', cleanSignaturePath),
                    interventionData.signature, // Original path as fallback
                ];
                
                let foundSignaturePath = null;
                for (const tryPath of signaturePathsToTry) {
                    if (require('fs').existsSync(tryPath)) {
                        foundSignaturePath = tryPath;
                        console.log(`Found signature at: ${foundSignaturePath}`);
                        break;
                    }
                }
                
                if (foundSignaturePath) {
                    doc.image(foundSignaturePath, 50, yPosition, { width: 250, height: 120 });
                } else {
                    console.log('Signature not found at any path:', signaturePathsToTry);
                    doc.text('Signature non disponible', 50, yPosition);
                }
            } catch (err) {
                console.log('Error adding signature:', err.message);
                doc.text('Signature non disponible', 50, yPosition);
            }
        } else {
            doc.text('Aucune signature', 50, yPosition);
        }
        
        // No footer - removed as requested
        
    } catch (error) {
        console.error('Error generating PDF content:', error);
        throw error;
    }
}

// Helper function to generate Quitus PDF content
async function generateQuitusPDF(doc, interventionData) {
    try {
        // Header section with logo and agency info
        doc.fontSize(18).font('Helvetica-Bold');
        
        // Add logo if available (simple implementation)
        if (interventionData.agency_logo) {
            try {
                doc.image(interventionData.agency_logo, 50, 50, { width: 100 });
            } catch (err) {
                console.log('Logo loading failed, using text instead');
            }
        }
        
        // Agency information (top right)
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(interventionData.agency_name || 'Agency Name', 400, 50, { align: 'right' });
        doc.text(interventionData.agency_address || '', 400, 65, { align: 'right' });
        doc.text(`${interventionData.agency_city || ''}, ${interventionData.agency_zipcode || ''}`, 400, 80, { align: 'right' });
        doc.text(`Tél: ${interventionData.agency_phone || ''}`, 400, 95, { align: 'right' });
        doc.text(`Email: ${interventionData.agency_email || ''}`, 400, 110, { align: 'right' });
        
        // Title
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text("QUITUS DE FIN DE TRAVAUX", 50, 150, { align: 'center' });
        
        // Quitus details following old_Astro pattern
        let yPosition = 200;
        
        // Main quitus text
        const technicianName = interventionData.technician_firstname && interventionData.technician_lastname ?
            `${interventionData.technician_firstname} ${interventionData.technician_lastname}` : 'Le technicien';
        
        const quitusDetails = `${technicianName}, Technicien et représentant de l'entreprise ${interventionData.agency_name || 'l\'agence'} est intervenu dans ce logement pour la réalisation des travaux suivant :`;
        
        doc.fontSize(10).font('Helvetica');
        doc.text(quitusDetails, 50, yPosition, { width: 500, align: 'justify' });
        
        yPosition += 40;
        
        // Intervention details
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Titre de l\'intervention:', 50, yPosition);
        doc.font('Helvetica').text(interventionData.title || 'Sans titre', 200, yPosition);
        
        yPosition += 20;
        doc.font('Helvetica-Bold').text('Numéro:', 50, yPosition);
        doc.font('Helvetica').text(interventionData.number || 'N/A', 200, yPosition);
        
        yPosition += 20;
        doc.font('Helvetica-Bold').text('Date d\'intervention:', 50, yPosition);
        const dateStr = interventionData.date_time ? 
            new Date(interventionData.date_time).toLocaleDateString('fr-FR') : 'N/A';
        doc.font('Helvetica').text(dateStr, 200, yPosition);
        
        yPosition += 20;
        doc.font('Helvetica-Bold').text('Type d\'intervention:', 50, yPosition);
        doc.font('Helvetica').text(interventionData.intervention_type || 'N/A', 200, yPosition);
        
        yPosition += 20;
        doc.font('Helvetica-Bold').text('Client:', 50, yPosition);
        doc.font('Helvetica').text(interventionData.client_name || 'N/A', 200, yPosition);
        
        yPosition += 20;
        doc.font('Helvetica-Bold').text('Locataire:', 50, yPosition);
        doc.font('Helvetica').text(interventionData.tenant_name || 'N/A', 200, yPosition);
        
        // Description
        yPosition += 40;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Travaux réalisés:', 50, yPosition);
        
        yPosition += 20;
        doc.fontSize(10).font('Helvetica');
        const description = interventionData.description || 'Détails des travaux non spécifiés';
        doc.text(description, 50, yPosition, { width: 500, align: 'justify' });
        
        // Signature section following old_Astro pattern
        yPosition += 80;
        doc.fontSize(10).font('Helvetica');
        doc.text(`Fait à : ${interventionData.agency_city || 'Ville'}`, 50, yPosition);
        
        yPosition += 15;
        const today = new Date();
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                           'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        const dayName = dayNames[today.getDay()];
        const monthName = monthNames[today.getMonth()];
        const dateText = `${dayName} ${today.getDate()} ${monthName} ${today.getFullYear()}`;
        doc.text(`Fait le : ${dateText}`, 50, yPosition);
        
        yPosition += 15;
        doc.font('Helvetica-Bold');
        doc.text('Locataire :', 50, yPosition);
        
        // Space for signature
        yPosition += 40;
        doc.font('Helvetica');
        doc.text('Signature:', 50, yPosition);
        
        // No footer for quitus - removed as requested
        
    } catch (error) {
        console.error('Error generating quitus PDF content:', error);
        throw error;
    }
}

// Add this temporary test endpoint to interventionsController.js

// TEMP: Test endpoint to debug public intervention data
exports.testPublicIntervention = async (req, res) => {
    try {
        const { interventionId } = req.params;
        
        const connection = await pool.getConnection();
        
        try {
            // Test query with explicit field selection
            const query = `
                SELECT 
                    i.number,
                    i.title, 
                    i.description, 
                    i.date_time, 
                    i.address, 
                    i.city,
                    i.priority, 
                    i.status_uid,
                    i.images_before,
                    i.images_after,
                    i.quality,
                    i.security, 
                    i.comments,
                    i.signature,
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
            
            console.log('TEST - Query:', query);
            console.log('TEST - Intervention ID:', interventionId);
            
            const [result] = await connection.execute(query, [interventionId]);
            
            console.log('TEST - Raw result from database:', result);
            
            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention non trouvée'
                });
            }
            
            const intervention = result[0];
            
            console.log('TEST - Individual fields:');
            console.log('images_before:', intervention.images_before);
            console.log('images_after:', intervention.images_after);
            console.log('comments:', intervention.comments);
            console.log('signature:', intervention.signature);
            console.log('quality:', intervention.quality);
            console.log('security:', intervention.security);
            
            res.json({
                success: true,
                debug: true,
                raw_result: result,
                processed_data: intervention,
                field_check: {
                    has_images_before: !!intervention.images_before,
                    has_images_after: !!intervention.images_after,
                    has_comments: !!intervention.comments,
                    has_signature: !!intervention.signature,
                    has_quality: !!intervention.quality,
                    has_security: !!intervention.security,
                    images_before_value: intervention.images_before,
                    images_after_value: intervention.images_after,
                    comments_value: intervention.comments
                }
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('TEST - Error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du test',
            error: error.message
        });
    }
};

// Add this route to routes/api/index.js:
// router.get('/test-public/:interventionId', interventionsController.testPublicIntervention);
// Debug helper for image paths - Add this to interventionsController.js for debugging

// NEW: Debug endpoint to check image paths
exports.debugImagePaths = async (req, res) => {
    try {
        const { interventionId } = req.params;
        const fs = require('fs');
        const path = require('path');
        
        const connection = await pool.getConnection();
        
        try {
            // Get intervention with images
            const query = `
                SELECT number, images_before, images_after, signature, 
                       a.logo_url as agency_logo
                FROM interventions i
                LEFT JOIN agency a ON i.agency_uid = a.uid
                WHERE i.number = ?
            `;
            
            const [intervention] = await connection.execute(query, [interventionId]);
            
            if (intervention.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention non trouvée'
                });
            }
            
            const data = intervention[0];
            const debugInfo = {
                interventionId: interventionId,
                rawData: {
                    images_before: data.images_before,
                    images_after: data.images_after,
                    signature: data.signature,
                    agency_logo: data.agency_logo
                },
                pathAnalysis: {}
            };
            
            // Check images_before paths
            if (data.images_before) {
                const imagesBefore = data.images_before.split(';/').filter(img => img.trim() !== '');
                debugInfo.pathAnalysis.images_before = [];
                
                for (const imagePath of imagesBefore) {
                    let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
                    
                    const pathsToTry = [
                        `/home/astrotec/public_html/astro-ges/${cleanPath}`,
                        `/home/astrotec/public_html/astro-ges/public/${cleanPath}`,
                        path.join('/home/astrotec/public_html/astro-ges', cleanPath),
                        imagePath
                    ];
                    
                    const pathInfo = {
                        originalPath: imagePath,
                        cleanPath: cleanPath,
                        pathsChecked: [],
                        foundAt: null
                    };
                    
                    for (const tryPath of pathsToTry) {
                        const exists = fs.existsSync(tryPath);
                        pathInfo.pathsChecked.push({
                            path: tryPath,
                            exists: exists
                        });
                        if (exists && !pathInfo.foundAt) {
                            pathInfo.foundAt = tryPath;
                        }
                    }
                    
                    debugInfo.pathAnalysis.images_before.push(pathInfo);
                }
            }
            
            // Check images_after paths
            if (data.images_after) {
                const imagesAfter = data.images_after.split(';/').filter(img => img.trim() !== '');
                debugInfo.pathAnalysis.images_after = [];
                
                for (const imagePath of imagesAfter) {
                    let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
                    
                    const pathsToTry = [
                        `/home/astrotec/public_html/astro-ges/${cleanPath}`,
                        `/home/astrotec/public_html/astro-ges/public/${cleanPath}`,
                        path.join('/home/astrotec/public_html/astro-ges', cleanPath),
                        imagePath
                    ];
                    
                    const pathInfo = {
                        originalPath: imagePath,
                        cleanPath: cleanPath,
                        pathsChecked: [],
                        foundAt: null
                    };
                    
                    for (const tryPath of pathsToTry) {
                        const exists = fs.existsSync(tryPath);
                        pathInfo.pathsChecked.push({
                            path: tryPath,
                            exists: exists
                        });
                        if (exists && !pathInfo.foundAt) {
                            pathInfo.foundAt = tryPath;
                        }
                    }
                    
                    debugInfo.pathAnalysis.images_after.push(pathInfo);
                }
            }
            
            // Check signature path
            if (data.signature) {
                let cleanPath = data.signature.startsWith('/') ? data.signature.substring(1) : data.signature;
                
                const pathsToTry = [
                    `/home/astrotec/public_html/astro-ges/${cleanPath}`,
                    `/home/astrotec/public_html/astro-ges/public/${cleanPath}`,
                    path.join('/home/astrotec/public_html/astro-ges', cleanPath),
                    data.signature
                ];
                
                const pathInfo = {
                    originalPath: data.signature,
                    cleanPath: cleanPath,
                    pathsChecked: [],
                    foundAt: null
                };
                
                for (const tryPath of pathsToTry) {
                    const exists = fs.existsSync(tryPath);
                    pathInfo.pathsChecked.push({
                        path: tryPath,
                        exists: exists
                    });
                    if (exists && !pathInfo.foundAt) {
                        pathInfo.foundAt = tryPath;
                    }
                }
                
                debugInfo.pathAnalysis.signature = pathInfo;
            }
            
            // Check logo path
            if (data.agency_logo) {
                let cleanPath = data.agency_logo.startsWith('/') ? data.agency_logo.substring(1) : data.agency_logo;
                
                const pathsToTry = [
                    `/home/astrotec/public_html/astro-ges/${cleanPath}`,
                    `/home/astrotec/public_html/astro-ges/public/${cleanPath}`,
                    path.join('/home/astrotec/public_html/astro-ges', cleanPath),
                    data.agency_logo
                ];
                
                const pathInfo = {
                    originalPath: data.agency_logo,
                    cleanPath: cleanPath,
                    pathsChecked: [],
                    foundAt: null
                };
                
                for (const tryPath of pathsToTry) {
                    const exists = fs.existsSync(tryPath);
                    pathInfo.pathsChecked.push({
                        path: tryPath,
                        exists: exists
                    });
                    if (exists && !pathInfo.foundAt) {
                        pathInfo.foundAt = tryPath;
                    }
                }
                
                debugInfo.pathAnalysis.agency_logo = pathInfo;
            }
            
            res.json({
                success: true,
                debug: debugInfo
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error debugging image paths:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du debug des chemins d\'images'
        });
    }
};

// Add this route to routes/api/index.js:
// router.get('/debug-images/:interventionId', interventionsController.debugImagePaths);
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
            // Get intervention details for public view - using exact same query as test
            const query = `
                SELECT 
                    i.number,
                    i.title, 
                    i.description, 
                    i.date_time, 
                    i.address, 
                    i.city,
                    i.priority, 
                    i.status_uid,
                    i.images_before,
                    i.images_after,
                    i.quality,
                    i.security, 
                    i.comments,
                    i.signature,
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
// UPDATED: Get intervention statuses - only specific ones requested
// COMPLETE FIXED METHODS - Replace these in your interventionsController.js

// UPDATED: Get intervention statuses - only specific ones requested
exports.getInterventionStatuses = async (req, res) => {
    try {
        // FIXED: Only get statuses from agency 1 (if they have agency_uid column)
        // Or return the standard statuses since they're probably global
        const statuses = [
            { uid: 1, name: 'reçus' },
            { uid: 2, name: 'assigné' },
            { uid: 3, name: 'maintenance Moselis' },
            { uid: 4, name: 'Maintenance Vivest' },
            { uid: 5, name: 'Maintenace CDC habitat' },
            { uid: 6, name: 'Maintenance SCH' }
        ];
        
        res.json(statuses);
        
    } catch (error) {
        console.error('Error fetching intervention statuses:', error);
        res.status(500).json([]);
    }
};

// UPDATED: Get intervention types - only specific ones requested  
exports.getInterventionTypes = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // FIXED: Only get types from agency 1 (if they have agency_uid column)
            // Check if interventions_types table has agency_uid column
            const query = `
                SELECT uid, name 
                FROM interventions_types 
                WHERE uid > 0
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

// UPDATED: Get businesses - COMPLETELY FIXED to avoid undefined
exports.getBusinesses = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // FIXED: Added b.number field to SELECT - this was missing before
            const query = `
                SELECT 
                    b.uid, 
                    b.title, 
                    b.number,
                    b.client_uid, 
                    b.tenant_uid, 
                    c.name as client_name 
                FROM businesses b 
                INNER JOIN clients c ON b.client_uid = c.uid 
                WHERE b.uid != 0 AND b.agency_uid = ?
                ORDER BY CAST(b.number AS UNSIGNED) ASC
            `;
            
            const [result] = await connection.execute(query, [1]); // Replace 1 with actual agency_uid from session/token
            
            // Format for dropdown compatibility
            const businesses_array = {};
            businesses_array[0] = "Choisissez une affaire...";
            
            for(let i = 0; i < result.length; i++) {
                const business = result[i];
                // FIXED: Include number in display - this fixes your "no number" issue
                const value = business.number ? `${business.number} - ${business.title}` : business.title;
                businesses_array[business.uid] = value;
            }
            
            console.log(`Loaded ${result.length} total businesses with numbers`);
            
            res.json({
                code: '1',
                message: 'success',
                response: businesses_array
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error getting businesses:', error);
        res.json({
            code: '0',
            message: 'failed',
            error: error.message
        });
    }
};

exports.getBusinessesByStatusAndType = async (req, res) => {
    try {
        const { status_uid, business_type, agency_uid = 1 } = req.body;
        
        // Define business numbers for each type based on your requirements
        const maintenanceNumbers = [104, 123, 139, 140, 161];
        const chantierNumbers = [144, 146, 150, 155, 156, 157, 158, 159, 160, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184];
        
        const connection = await pool.getConnection();
        
        try {
            let businessNumbers = [];
            
            if (business_type === 'maintenance') {
                businessNumbers = maintenanceNumbers;
            } else if (business_type === 'chantier') {
                businessNumbers = chantierNumbers;
            } else {
                return res.json({ 
                    code: '0', 
                    message: 'Invalid business type. Use "maintenance" or "chantier"' 
                });
            }
            
            // Create the WHERE clause for business numbers
            const placeholders = businessNumbers.map(() => '?').join(',');
            
            // Query with business number filtering - INCLUDES the number field that was missing
            const query = `
                SELECT 
                    b.uid, 
                    b.title, 
                    b.number, 
                    b.client_uid, 
                    b.tenant_uid, 
                    c.name as client_name 
                FROM businesses b 
                INNER JOIN clients c ON b.client_uid = c.uid 
                WHERE b.uid != 0 
                    AND b.agency_uid = ? 
                    AND CAST(b.number AS UNSIGNED) IN (${placeholders})
                ORDER BY CAST(b.number AS UNSIGNED) ASC
            `;
            
            const queryParams = [agency_uid, ...businessNumbers];
            const [result] = await connection.execute(query, queryParams);
            
            // Format response like old_Astro for compatibility with existing frontend
            const businesses_array = {};
            businesses_array[0] = `Toutes les affaires ${business_type}...`;
            
            for(let i = 0; i < result.length; i++) {
                const business = result[i];
                // This will now show "104 - Business Title" instead of "no number"
                const value = business.number ? `${business.number} - ${business.title}` : business.title;
                businesses_array[business.uid] = value;
            }
            
            console.log(`Found ${result.length} ${business_type} businesses`);
            
            res.json({
                code: '1',
                message: 'success',
                response: businesses_array,
                business_type: business_type,
                filtered_count: result.length
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error getting businesses by status and type:', error);
        res.json({
            code: '0',
            message: 'failed',
            error: error.message
        });
    }
};

exports.getBusinessCategories = async (req, res) => {
    try {
        const maintenanceNumbers = [104, 123, 139, 140, 161];
        const chantierNumbers = [144, 146, 150, 155, 156, 157, 158, 159, 160, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184];
        
        res.json({
            code: '1',
            message: 'success',
            maintenance_numbers: maintenanceNumbers,
            chantier_numbers: chantierNumbers,
            categories: {
                maintenance: {
                    label: 'Maintenance',
                    numbers: maintenanceNumbers,
                    count: maintenanceNumbers.length
                },
                chantier: {
                    label: 'Chantiers', 
                    numbers: chantierNumbers,
                    count: chantierNumbers.length
                }
            }
        });
        
    } catch (error) {
        console.error('Error getting business categories:', error);
        res.json({
            code: '0',
            message: 'failed',
            error: error.message
        });
    }
};

exports.getBusinessesArray = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            const query = `
                SELECT 
                    b.uid, 
                    b.title, 
                    b.number,
                    b.client_uid, 
                    b.tenant_uid, 
                    c.name as client_name 
                FROM businesses b 
                INNER JOIN clients c ON b.client_uid = c.uid 
                WHERE b.uid != 0 AND b.agency_uid = ?
                ORDER BY CAST(b.number AS UNSIGNED) ASC
            `;
            
            const [result] = await connection.execute(query, [1]);
            
            // Format as array with proper number display
            const businesses = result.map(business => ({
                uid: business.uid,
                name: business.number ? `${business.number} - ${business.title}` : business.title,
                title: business.title,
                number: business.number,
                client_uid: business.client_uid,
                client_name: business.client_name
            }));
            
            res.json(businesses);
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error getting businesses array:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du chargement des affaires'
        });
    }
};

// Add this function to your controllers/interventionsController.js

// CREATE: Create new intervention
// CORRECTED: exports.createIntervention function for controllers/interventionsController.js
// This replaces the existing createIntervention function

exports.createIntervention = async (req, res) => {
    try {
        console.log('=== Creating Intervention ===');
        console.log('Request body:', req.body);
        
        const connection = await pool.getConnection();
        
        try {
            // Extract form data with proper defaults for optional fields
            const {
                numero,
                titre,
                description = '',
                priorite = 'normale',
                statut,
                type,
                affaire,
                client,
                technicien = '',     // Default to empty string
                prix = '',
                adresse = '',
                ville = '',
                immeuble = '',
                etage = '',
                appartement = '',
                date = '',           // Allow empty date
                heure_debut = '',    // Allow empty time
                heure_fin = ''       // Allow empty time
            } = req.body;
            
            console.log('Processing with values:', {
                numero, titre, technicien, date, heure_debut, heure_fin
            });

            // Validate required fields only
            if (!numero || !titre || !statut || !type || !priorite || !affaire || !client || !adresse || !ville || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Champs obligatoires manquants'
                });
            }

            // Process price field
            let processedPrice = 0; // Default to 0, not NULL
            if (prix && prix.trim() !== '') {
                const numericPrice = parseFloat(prix);
                if (!isNaN(numericPrice) && numericPrice >= 0) {
                    processedPrice = numericPrice;
                }
            }

            // Generate public number for external sharing
            const publicNumber = generatePublicNumber();
            
            // Handle date and time fields - provide defaults for NOT NULL columns
            let dateTime = '';
            let timeFrom = '';
            let timeTo = '';
            
            // Only process date/time if provided
            if (date && date.trim() !== '') {
                // Convert from YYYY-MM-DD to DD/MM/YYYY format for database
                const dateParts = date.split('-');
                if (dateParts.length === 3) {
                    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                    
                    if (heure_debut && heure_debut.trim() !== '') {
                        dateTime = `${formattedDate} ${heure_debut}`;
                        timeFrom = heure_debut;
                    } else {
                        dateTime = formattedDate;
                    }
                    
                    if (heure_fin && heure_fin.trim() !== '') {
                        timeTo = heure_fin;
                    }
                }
            }
            
            // Calculate duration if both times are provided
            let duration = 0; // Default to 0, not NULL
            if (timeFrom && timeTo) {
                try {
                    const startTime = new Date(`2000-01-01 ${timeFrom}:00`);
                    const endTime = new Date(`2000-01-01 ${timeTo}:00`);
                    const diffMs = endTime - startTime;
                    
                    if (diffMs > 0) {
                        duration = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
                    }
                } catch (e) {
                    console.log('Duration calculation error:', e);
                    duration = 0;
                }
            }
            
            // FIXED: Insert with proper handling of NULL/empty values
            const insertQuery = `
                INSERT INTO interventions (
                    public_number, agency_uid, business_uid, client_uid, tenant_uid, 
                    tenant_name, technician_uid, referent_uid, number, status_uid, 
                    title, date_time, due_date, time_from, time_to, address, city, 
                    building, floor, appartment, duration, priority, type_uid, description, price
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const insertValues = [
                publicNumber,                           // public_number
                1,                                     // agency_uid (default to 1)
                parseInt(affaire) || 0,                // business_uid
                parseInt(client) || 0,                 // client_uid
                0,                                     // tenant_uid (default to 0)
                '',                                    // tenant_name (empty string, not NULL)
                parseInt(technicien) || 0,             // technician_uid (0 = unassigned)
                0,                                     // referent_uid (default to 0)
                numero,                                // number
                parseInt(statut) || 1,                 // status_uid
                titre,                                 // title
                dateTime,                              // date_time (empty string if not provided)
                dateTime,                              // due_date (same as date_time)
                timeFrom,                              // time_from (empty string, not NULL)
                timeTo,                                // time_to (empty string, not NULL)
                adresse,                               // address
                ville,                                 // city
                immeuble,                              // building (empty string, not NULL)
                etage,                                 // floor (empty string, not NULL)
                appartement,                           // appartment (empty string, not NULL)
                duration,                              // duration (0, not NULL)
                priorite,                              // priority
                parseInt(type) || 1,                   // type_uid
                description,                           // description
                processedPrice                         // price (0, not NULL)
            ];
            
            console.log('Insert query:', insertQuery);
            console.log('Insert values:', insertValues);
            
            const [result] = await connection.execute(insertQuery, insertValues);
            const interventionId = result.insertId;
            
            console.log('Intervention created with ID:', interventionId);
            
            // Handle PDF file upload if present
            if (req.files && req.files.pdf) {
                try {
                    const pdfFile = req.files.pdf;
                    const uploadPath = path.join(__dirname, '../uploads/interventions', `${interventionId}_${pdfFile.name}`);
                    
                    // Ensure directory exists
                    await fs.mkdir(path.dirname(uploadPath), { recursive: true });
                    
                    // Move file to upload directory
                    await pdfFile.mv(uploadPath);
                    
                    console.log('PDF file uploaded successfully:', uploadPath);
                } catch (uploadError) {
                    console.error('PDF upload error:', uploadError);
                    // Don't fail the entire creation for PDF upload issues
                }
            }
            
            // Return success response
            res.json({
                success: true,
                message: 'Intervention créée avec succès',
                data: {
                    interventionId: interventionId,
                    number: numero,
                    publicNumber: publicNumber,
                    title: titre,
                    price: processedPrice,
                    createdAt: new Date().toISOString()
                }
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error creating intervention:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'intervention',
            error: error.message
        });
    }
};

// Helper function to generate public number (UUID-like) - if not already exists
function generatePublicNumber() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Helper function to generate intervention number
exports.getInterventionNumber = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // Get the next intervention number
            const query = `SELECT MAX(CAST(number AS UNSIGNED)) as max_number FROM interventions`;
            const [result] = await connection.execute(query);
            
            let nextNumber = 1;
            if (result[0] && result[0].max_number) {
                nextNumber = parseInt(result[0].max_number) + 1;
            }
            
            // Format number with leading zeros (e.g., 00001)
            const formattedNumber = nextNumber.toString().padStart(5, '0');
            
            res.json({
                number: formattedNumber,
                raw_number: nextNumber
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error getting intervention number:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du numéro',
            number: '00001' // fallback
        });
    }
};

// Helper function to generate public number (UUID-like)
function generatePublicNumber() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// UPDATED: Get clients - COMPLETELY FIXED to avoid undefined
// FIXED: Get clients - corrected relationship logic
exports.getClients = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // FIXED: Only get clients from agency 1
            const query = `
                SELECT uid, name 
                FROM clients 
                WHERE uid > 0 AND agency_uid = 1
                  AND name IS NOT NULL 
                  AND name != '' 
                  AND name != 'undefined'
                  AND TRIM(name) != ''
                ORDER BY name
            `;
            
            const [clients] = await connection.execute(query);
            res.json(clients);
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json([]);
    }
};
// Add this debug endpoint to interventionsController.js 

// DEBUG: Check what data is being returned for dropdowns
exports.debugDropdownData = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // Check businesses
            const businessQuery = `SELECT uid, title, title as name FROM businesses LIMIT 10`;
            const [businesses] = await connection.execute(businessQuery);
            
            // Check clients  
            const clientQuery = `SELECT uid, name FROM clients LIMIT 10`;
            const [clients] = await connection.execute(clientQuery);
            
            res.json({
                success: true,
                debug: {
                    businesses: {
                        raw: businesses,
                        filtered: businesses.filter(b => b.title && b.title.trim() !== '' && b.title !== 'undefined')
                    },
                    clients: {
                        raw: clients,
                        filtered: clients.filter(c => c.name && c.name.trim() !== '' && c.name !== 'undefined')
                    }
                }
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Add this route to routes/api/index.js:
// router.get('/debug-dropdowns', interventionsController.debugDropdownData);

// Helper function to generate public number (UUID-like)
function generatePublicNumber() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}