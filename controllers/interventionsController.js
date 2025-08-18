// controllers/interventionsController.js - FIXED for Node.js v12
const { pool } = require('../config/database');
const { buildInterventionQuery, buildUrgentAllQuery } = require('../utils/queryBuilder');

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
            const totalCount = countResult[0] && countResult[0].total_count ? countResult[0].total_count : 0;

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
                    totalPages,
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