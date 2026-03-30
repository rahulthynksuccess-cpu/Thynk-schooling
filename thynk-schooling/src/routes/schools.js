const router = require('express').Router();
const pool = require('../db');

// Get all schools with filters
router.get('/', async (req, res) => {
  try {
    const { city, board, search } = req.query;
    let query = 'SELECT * FROM schools WHERE 1=1';
    const params = [];

    if (city) { params.push(city); query += ` AND city = $${params.length}`; }
    if (board) { params.push(board); query += ` AND board = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND name ILIKE $${params.length}`; }

    query += ' ORDER BY created_at DESC LIMIT 50';
    const result = await pool.query(query, params);
    res.json({ schools: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single school by slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM schools WHERE slug = $1', [req.params.slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }
    res.json({ school: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
