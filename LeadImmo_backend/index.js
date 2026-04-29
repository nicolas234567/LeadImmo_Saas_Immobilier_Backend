const express = require('express')
const app = express()
const port = 3000

app.use(express.json())  

app.use('/auth', require('./auth/login'))
app.use('/auth', require('./auth/createAccount'))
app.use('/properties', require('./app/properties'))
app.use('/leads', require('./app/leads'))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
