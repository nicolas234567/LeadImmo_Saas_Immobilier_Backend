const router = require('express').Router()
const pool = require('../db')
const bcrypt = require('bcryptjs')

router.post('/createAccount', async (req, res) => {
  const { email, password } = req.body
})