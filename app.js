const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();
const db = require('better-sqlite3')('database.db', { verbose: console.log })

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(express.static(path.join(__dirname, 'public')));



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
})


app.get('/showDB', (req, res) => {
  const stmt = db.prepare('SELECT * FROM users')
  const users = stmt.all()
  res.json(users) // Send users data as JSON
})


app.post('/register', (req, res) => {
  if (req.body.name === '' || req.body.surname || req.body.email === '' || req.body.password === '') {
      res.send('<script>alert("Please fill in all fields"); window.location.href="/register";</script>')
  } else {
      const bcrypt = require('bcrypt')
      const saltedRounds = 10
      const hash = bcrypt.hashSync(req.body.password, saltedRounds)
      const insertStmt = db.prepare('INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)')
      insertStmt.run(req.body.name, req.body.surname, req.body.email, hash)
      res.send('<script>alert("Registration successful"); window.location.href="/login";</script>')
      res.redirect('/login')
  }
})


app.post('/login', (req, res) => {
  const userSTMT = db.prepare('SELECT * FROM users WHERE email = ?')
  const user = userSTMT.get(req.body.email)

  const result = bcrypt.compareSync(req.body.password, user.password)
  
  if (user) {
      if (result) {
          res.send('Login successful')
      } else if (!result){
          res.send('Wrong password')
      } else {
          res.send('<script>alert("Please fill in all fields"); window.location.href="/login";</script>')
      }
  } else {
      res.send('User not found')
  }
})


app.post('/deleteU', (req, res) => {
  const deleteStmt = db.prepare('DELETE FROM users WHERE email = ?')
  deleteStmt.run(req.body.email)
  res.send('<script>alert("User Deleted"); window.location.href="/delete";</script>>')
  res.redirect('/delete')
})


app.listen(3000, () => {
  console.log('Server running on port http://localhost:3000')
})