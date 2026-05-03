const router = require('express').Router()
const pool = require('../db')
const bcrypt = require('bcryptjs')

router.post('/createAccountAgency', async (req, res) => {
  const { email, password, agency_name } = req.body

  if (!agency_name) {
    return res.status(400).json({ error: 'Le nom de l\'agence est requis' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const hash = await bcrypt.hash(password, 10)

    const agencyResult = await client.query(
      'INSERT INTO agencies (name, email) VALUES ($1, $2) RETURNING id',
      [agency_name, email]
    )
    const agency_id = agencyResult.rows[0].id

    const result = await client.query(
      'INSERT INTO users (email, password, agency_id) VALUES ($1, $2, $3) RETURNING *',
      [email, hash, agency_id]
    )

    await client.query('COMMIT')

    const { password: _pw, ...user } = result.rows[0]
    res.status(201).json(user)
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

module.exports = router