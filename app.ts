import express from 'express';
import { join } from 'path';
import Database from 'better-sqlite3';
import { sha256 } from './utils';


const app = express();
const db = Database('database.db', { verbose: console.log });

app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public/index.html'));
});

app.get('/showDB', (req, res) => {
  const stmt = db.prepare('SELECT * FROM users');
  const users = stmt.all();
  res.json(users);
});

app.post('/register', (req, res) => {
  if (req.body.name === '' || req.body.surname === '' || req.body.email === '' || req.body.password === '') {
    res.send('<script>alert("Please fill in all fields"); window.location.href="/register";</script>');
  } else {
    const hash = sha256(req.body.password)
    const insertStmt = db.prepare('INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)');
    insertStmt.run(req.body.name, req.body.surname, req.body.email, hash);
    res.send('<script>alert("Registration successful"); window.location.href="/login";</script>');
    res.redirect('/login');
  }
});

app.post('/login', (req, res) => {
  const userSTMT = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = userSTMT.get(req.body.email) as { email: string, password: string }

  if (user) {
    const result = sha256(req.body.password) === user.password
    if (result) {
      res.send('<script>alert("Login successful"); window.location.href="/login";</script>');
      res.redirect('index.html');
    } else if (!result) {
      res.send('Wrong password');
    }
  } else {
    res.send('User not found');
  }
});


app.post('/deleteU', (req, res) => {
  const deleteStmt = db.prepare('DELETE FROM users WHERE email = ?');
  deleteStmt.run(req.body.email);
  res.send('<script>alert("User Deleted"); window.location.href="/delete";</script>');
});

app.listen(3000, () => {
  console.log('Server running on port http://localhost:3000');
});
