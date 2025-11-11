const express = require('express')
const app = express()
const port = 3000

/// users
app.get('/users', (req, res) => {
  res.send('get all users')
})
app.post('/users', (req, res) => {
  res.send(' post user') 
})
app.put('/users', (req, res) => {
  res.send(' put user')
})
app.delete('/users', (req, res) => {
  res.send(' delete user')
})

/// products
app.get('/products', (req, res) => {
  res.send('get all products')
})
app.post('/products', (req, res) => {
  res.send(' post product')
})
app.put('/products', (req, res) => {
  res.send(' put product')
})
app.delete('/products', (req, res) => {
  res.send(' delete product')
})

app.get('/users/:id', (req, res) => {
  res.send(req.params)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})