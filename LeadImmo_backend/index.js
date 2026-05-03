const express = require('express')
const app = express()
const port = 3000

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use(express.json())

app.use('/auth', require('./auth/login'))
app.use('/auth', require('./auth/createAccount'))
app.use('/auth', require('./auth/createAccountAgency'))
app.use('/properties', require('./app/properties'))
app.use('/leads', require('./app/leads'))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
