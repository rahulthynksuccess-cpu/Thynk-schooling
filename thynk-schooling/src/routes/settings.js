const router = require('express').Router();
const pool   = require('../db');

// GET /api/settings/dropdown?category=board&includeInactive=true&parentValue=maharashtra
router.get('/dropdown', async (req, res) => {
  try {
    const { category, parentValue, includeInactive } = req.query;

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const conditions = ['category = $1'];
    const params     = [category];

    if (parentValue) {
      params.push(parentValue);
      conditions.push(`parent_value = $${params.length}`);
    }

    if (includeInactive !== 'true') {
      conditions.push('is_active = true');
    }

    const sql = `
      SELECT
        id,
        category,
        label,
        value,
        sort_order   AS "sortOrder",
        is_active    AS "isActive",
        parent_value AS "parentValue"
      FROM dropdown_options
      WHERE ${conditions.join(' AND ')}
      ORDER BY sort_order ASC, label ASC
    `;

    const result = await pool.query(sql, params);
    res.json({ options: result.rows });

  } catch (err) {
    console.error('Dropdown GET error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/settings/dropdown — create new option
router.post('/dropdown', async (req, res) => {
  try {
    const { category, label, value, sortOrder = 0, parentValue } = req.body;
    if (!category || !label || !value) {
      return res.status(400).json({ error: 'category, label and value are required' });
    }
    const result = await pool.query(
      `INSERT INTO dropdown_options (category, label, value, sort_order, parent_value)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, category, label, value,
                 sort_order AS "sortOrder", is_active AS "isActive", parent_value AS "parentValue"`,
      [category, label, value, sortOrder, parentValue || null]
    );
    res.status(201).json({ option: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Option already exists in this category' });
    }
    console.error('Dropdown POST error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/settings/dropdown/:id — update option
router.put('/dropdown/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { label, value, sortOrder, isActive, parentValue } = req.body;
    const result = await pool.query(
      `UPDATE dropdown_options
       SET label        = COALESCE($1, label),
           value        = COALESCE($2, value),
           sort_order   = COALESCE($3, sort_order),
           is_active    = COALESCE($4, is_active),
           parent_value = $5
       WHERE id = $6
       RETURNING id, category, label, value,
                 sort_order AS "sortOrder", is_active AS "isActive", parent_value AS "parentValue"`,
      [label, value, sortOrder, isActive, parentValue || null, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Option not found' });
    res.json({ option: result.rows[0] });
  } catch (err) {
    console.error('Dropdown PUT error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/settings/dropdown/:id
router.delete('/dropdown/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM dropdown_options WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Option not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Dropdown DELETE error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
