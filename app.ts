import express, { json } from 'express';
import { join } from 'path';
import Database from 'better-sqlite3';
import { sha256 } from './utils';
import multer from 'multer';

const app = express();
const db = Database('database.db', { verbose: console.log });

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });


app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'admin_page/index.html'));
});

app.get('/leader', (req, res) => {
  res.sendFile(join(__dirname, 'leader_page/index.html'));
});

app.get('/admin/register', (req, res) => {
  res.sendFile(join(__dirname, 'admin_page/register/index.html'));
});

app.get('/admin/delete', (req, res) => {
  res.sendFile(join(__dirname, 'admin_page/delete/index.html'));
});

app.get('/admin/edit', (req, res) => {
  res.sendFile(join(__dirname, 'admin_page/edit/index.html'));
});

app.get('/admin/company', (req, res) => {
  res.sendFile(join(__dirname, 'admin_page/company/index.html'));
});

app.get('/admin/peleton', (req, res) => {
  res.sendFile(join(__dirname, 'admin_page/peleton/index.html'));
});




app.get('/showDB', (req, res) => {
  const stmt = db.prepare('SELECT * FROM users');
  const users = stmt.all();
  res.json(users);
});

app.post('/admin/register', (req, res) => {
  if (req.body.name === '' || req.body.surname === '' || req.body.email === '' || req.body.password === '' || req.body.role === '') {
    res.send('<script>alert("Please fill in all fields"); window.location.href="/admin/register";</script>');
  } else {
    const hash = sha256(req.body.password)
    const insertStmt = db.prepare('INSERT INTO users (name, surname, email, password, role) VALUES (?, ?, ?, ?, ?)');
    insertStmt.run(req.body.name, req.body.surname, req.body.email, hash, req.body.role);
    res.redirect('/login');
  }
});

app.post('/login', (req, res) => {
  const userSTMT = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = userSTMT.get(req.body.email) as { email: string, password: string, role: string }

  if (user) {
    const result = sha256(req.body.password) === user.password
    if (result) {
      res.redirect("/" + user.role);

    } else if (!result) {
      res.send('Wrong password');
    }
  } else {
    res.send('User not found');
  }
});

app.post('/admin/deleteU', (req, res) => {
  const deleteStmt = db.prepare('DELETE FROM users WHERE email = ?');
  deleteStmt.run(req.body.email);
});

app.post('/admin/edit', (req, res) => {
  const updateStmt = db.prepare('UPDATE users SET name = ?, surname = ?, email = ?, password = ? WHERE email = ?');
});

app.post('/admin/company', upload.single('logo'), (req, res) => {
  const { name, description, address, city } = req.body;
  const logo = req.file ? req.file.path : null; // Get the path of the uploaded file
  const insertStmt = db.prepare('INSERT INTO companies (name, description, logo, address, city) VALUES (?, ?, ?, ?, ?)');
  insertStmt.run(name, description, logo, address, city);
  res.json({ message: 'Company added'	})
});

app.post('/admin/peleton', (req, res) => {
  const { name, companies_id } = req.body;
  const insertStmt = db.prepare('INSERT INTO peleton (name, companies_id) VALUES (?, ?)');
  insertStmt.run(name, companies_id);
  res.json({ message: 'Peleton added'	})
});


app.listen(3000, () => {
  console.log('Server running on port http://localhost:3000');
});