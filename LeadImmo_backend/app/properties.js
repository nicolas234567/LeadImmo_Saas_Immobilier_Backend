const router = require('express').Router()
const pool = require('../db')
const auth = require('../middleware/auth')
const multer = require('multer')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Fichier non supporté'))
    }
    cb(null, true)
  }
})

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, agency_id, title, address, price, status, image_mimetype, created_at FROM properties WHERE agency_id = $1 ORDER BY created_at DESC',
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
      'SELECT id, agency_id, title, address, price, status, image_mimetype, created_at FROM properties WHERE id = $1 AND agency_id = $2',
      [req.params.id, req.user.agency_id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bien introuvable' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/image', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT image_data, image_mimetype FROM properties WHERE id = $1',
      [req.params.id]
    )
    if (result.rows.length === 0 || !result.rows[0].image_data) {
      return res.status(404).json({ error: 'Image introuvable' })
    }
    const { image_data, image_mimetype } = result.rows[0]
    res.set('Content-Type', image_mimetype)
    res.send(image_data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', auth, upload.single('image'), async (req, res) => {
  const { title, address, price, status } = req.body
  const imageData = req.file ? req.file.buffer : null
  const imageMimetype = req.file ? req.file.mimetype : null
  try {
    const result = await pool.query(
      'INSERT INTO properties (agency_id, title, address, price, status, image_data, image_mimetype) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, agency_id, title, address, price, status, image_mimetype, created_at',
      [req.user.agency_id, title, address, price, status || 'available', imageData, imageMimetype]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', auth, upload.single('image'), async (req, res) => {
  const { title, address, price, status } = req.body
  try {
    const existing = await pool.query(
      'SELECT image_data, image_mimetype FROM properties WHERE id = $1 AND agency_id = $2',
      [req.params.id, req.user.agency_id]
    )
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Bien introuvable' })
    }
    const imageData = req.file ? req.file.buffer : existing.rows[0].image_data
    const imageMimetype = req.file ? req.file.mimetype : existing.rows[0].image_mimetype
    const result = await pool.query(
      'UPDATE properties SET title = $1, address = $2, price = $3, status = $4, image_data = $5, image_mimetype = $6 WHERE id = $7 AND agency_id = $8 RETURNING id, agency_id, title, address, price, status, image_mimetype, created_at',
      [title, address, price, status, imageData, imageMimetype, req.params.id, req.user.agency_id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM properties WHERE id = $1 AND agency_id = $2 RETURNING *',
      [req.params.id, req.user.agency_id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bien introuvable' })
    }
    res.json({ message: 'Bien supprimé' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
