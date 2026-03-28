const router = require('express').Router();
const pool = require('../db');

router.get('/dropdown', async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ error: 'Category required' });
    }
    const result = await pool.query(
      'SELECT * FROM dropdown_options WHERE category = $1 ORDER BY label ASC',
      [category]
    );
    res.json({ options: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
