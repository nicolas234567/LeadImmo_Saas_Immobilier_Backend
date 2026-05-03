const router = require('express').Router()
const pool = require('../db')
const auth = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE agency_id = $1 ORDER BY created_at ASC',
      [req.user.agency_id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', auth, async (req, res) => {
  const { email } = req.body
  try {
    const result = await pool.query(
      'UPDATE users SET email = $1 WHERE id = $2 AND agency_id = $3 RETURNING id, email, role, created_at',
      [email, req.params.id, req.user.agency_id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte introuvable' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const count = await pool.query(
      'SELECT COUNT(*) FROM users WHERE agency_id = $1',
      [req.user.agency_id]
    )
    if (parseInt(count.rows[0].count) <= 1) {
      return res.status(400).json({ error: "L'agence doit avoir au minimum un compte" })
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND agency_id = $2 RETURNING id',
      [req.params.id, req.user.agency_id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte introuvable' })
    }
    res.json({ message: 'Compte supprimé' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
