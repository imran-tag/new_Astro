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
        console.log('Getting intervention statuses...');
        
        // Return only the specific statuses requested
        const statuses = [
            { uid: 1, name: 'reçus' },
            { uid: 2, name: 'assigné' },
            { uid: 3, name: 'maintenance Moselis' },
            { uid: 4, name: 'Maintenance Vivest' },
            { uid: 5, name: 'Maintenace CDC habitat' },
            { uid: 6, name: 'Maintenance SCH' }
        ];
        
        console.log('Returning statuses:', statuses);
        res.json(statuses);
        
    } catch (error) {
        console.error('Error fetching intervention statuses:', error);
        res.status(500).json([]);
    }
};

// UPDATED: Get intervention types - only specific ones requested  
exports.getInterventionTypes = async (req, res) => {
    try {
        console.log('Getting intervention types...');
        
        // Return only the specific types requested
        const types = [
            { uid: 1, name: 'Installation' },
            { uid: 2, name: 'maintenance' },
            { uid: 3, name: 'Service' },
            { uid: 4, name: 'Dépannage' },
            { uid: 5, name: 'Visite D\'appel d\'offre' },
            { uid: 6, name: 'Réunion de chantier' }
        ];
        
        console.log('Returning types:', types);
        res.json(types);
        
    } catch (error) {
        console.error('Error fetching intervention types:', error);
        res.status(500).json([]);
    }
};

// UPDATED: Get businesses - COMPLETELY FIXED to avoid undefined
exports.getBusinesses = async (req, res) => {
    try {
        console.log('Getting businesses...');
        
        const connection = await pool.getConnection();
        
        try {
            const query = `
                SELECT uid, title
                FROM businesses 
                WHERE uid > 0 
                  AND title IS NOT NULL 
                  AND title != '' 
                  AND title != 'undefined'
                  AND TRIM(title) != ''
                ORDER BY title
            `;
            
            console.log('Business query:', query);
            
            const [businesses] = await connection.execute(query);
            
            console.log('Raw businesses from DB:', businesses);
            
            // Additional filtering to be extra sure
            const validBusinesses = businesses
                .filter(business => {
                    const isValid = business.title && 
                                   business.title.trim() !== '' && 
                                   business.title !== 'undefined' &&
                                   business.title !== 'null' &&
                                   business.uid > 0;
                    
                    if (!isValid) {
                        console.log('Filtering out invalid business:', business);
                    }
                    
                    return isValid;
                })
                .map(business => ({
                    uid: business.uid,
                    name: business.title // Map title to name for consistency
                }));
            
            console.log('Filtered businesses:', validBusinesses);
            
            res.json(validBusinesses);
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error fetching businesses:', error);
        res.status(500).json([]);
    }
};

// UPDATED: Get clients - COMPLETELY FIXED to avoid undefined
exports.getClients = async (req, res) => {
    try {
        const { business_id } = req.query;
        console.log('Getting clients for business_id:', business_id);
        
        const connection = await pool.getConnection();
        
        try {
            let query = `
                SELECT uid, name 
                FROM clients 
                WHERE uid > 0 
                  AND name IS NOT NULL 
                  AND name != '' 
                  AND name != 'undefined'
                  AND TRIM(name) != ''
            `;
            
            const params = [];
            
            if (business_id && business_id !== '0' && business_id !== '') {
                query += ` AND business_uid = ?`;
                params.push(business_id);
            }
            
            query += ` ORDER BY name`;
            
            console.log('Client query:', query, 'Params:', params);
            
            const [clients] = await connection.execute(query, params);
            
            console.log('Raw clients from DB:', clients);
            
            // Additional filtering to be extra sure
            const validClients = clients.filter(client => {
                const isValid = client.name && 
                               client.name.trim() !== '' && 
                               client.name !== 'undefined' &&
                               client.name !== 'null' &&
                               client.uid > 0;
                
                if (!isValid) {
                    console.log('Filtering out invalid client:', client);
                }
                
                return isValid;
            });
            
            console.log('Filtered clients:', validClients);
            
            res.json(validClients);
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