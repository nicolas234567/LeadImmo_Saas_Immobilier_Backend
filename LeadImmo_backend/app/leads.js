const router = require('express').Router()
const pool = require('../db')
const auth = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT leads.*, properties.title AS property_title
       FROM leads
       LEFT JOIN properties ON leads.property_id = properties.id
       WHERE leads.agency_id = $1
       ORDER BY leads.created_at DESC`,
      [req.user.agency_id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT leads.*, properties.title AS property_title
       FROM leads
       LEFT JOIN properties ON leads.property_id = properties.id
       WHERE leads.id = $1 AND leads.agency_id = $2`,
      [req.params.id, req.user.agency_id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead introuvable' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', auth, async (req, res) => {
  const { property_id, name, email, phone, status, budget, notes } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO leads (agency_id, property_id, name, email, phone, status, budget, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.agency_id, property_id, name, email, phone, status || 'new', budget || null, notes || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', auth, async (req, res) => {
  const { property_id, name, email, phone, status, budget, notes } = req.body
  try {
    const result = await pool.query(
      `UPDATE leads
       SET property_id = $1, name = $2, email = $3, phone = $4, status = $5,
           budget = $6, notes = $7
       WHERE id = $8 AND agency_id = $9
       RETURNING *`,
      [property_id, name, email, phone, status, budget || null, notes || null, req.params.id, req.user.agency_id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead introuvable' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM leads WHERE id = $1 AND agency_id = $2 RETURNING *',
      [req.params.id, req.user.agency_id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead introuvable' })
    }
    res.json({ message: 'Lead supprimé' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
