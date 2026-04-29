const router = require('express').Router()
const pool = require('../db')
const bcrypt = require('bcryptjs')

router.post('/createAccount', async (req, res) => {
  const { email, password } = req.body

  try {
    const hash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
      [email, hash]
    )

    const { password: _pw, ...user } = result.rows[0]
    res.status(201).json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router