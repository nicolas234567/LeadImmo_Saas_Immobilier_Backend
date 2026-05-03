const router = require('express').Router()
const pool = require('../db')
const bcrypt = require('bcryptjs')
const auth = require('../middleware/auth')

router.post('/createAccount', auth, async (req, res) => {
  const { email, password } = req.body
  const agency_id = req.user.agency_id

  try {
    const hash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      'INSERT INTO users (email, password, agency_id) VALUES ($1, $2, $3) RETURNING *',
      [email, hash, agency_id]
    )

    const { password: _pw, ...user } = result.rows[0]
    res.status(201).json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
