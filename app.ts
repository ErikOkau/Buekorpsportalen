import express, { json, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { join } from 'path';
import Database from 'better-sqlite3';
import { sha256 } from './utils';
import multer from 'multer';
import { SessionData } from 'express-session';

declare module 'express-serve-static-core' {
  interface Request {
    session: SessionData;
  }
}

const app = express();
const db = Database('database.db', { verbose: console.log });
const upload = multer({ dest: 'uploads/' });

app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));
app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: true
}));


// Logout route
app.get('/logout', (req: Request<{}, any, any, SessionData>, res: Response, next: NextFunction) => {
  if (req.session) {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Error destroying session:', err);
        res.status(500).send('Error logging out');
      } else {
        res.redirect('/'); // Redirect to the login page after successful logout
      }
    });
  } else {
    res.redirect('/'); // Redirect to the login page if there's no active session
  }
});

app.get('/membersData', (req, res) => {
  const stmt = db.prepare('SELECT * FROM members');
  const members = stmt.all();
  res.json(members);
});

// Delete member route
app.delete('/deleteMember', (req, res) => {
  const memberId = req.query.id;
  if (memberId) {
    const deleteStmt = db.prepare('DELETE FROM members WHERE id = ?');
    deleteStmt.run(memberId);
    res.sendStatus(200); // Respond with success status if deletion is successful
  } else {
    res.status(400).send('Invalid member ID');
  }
});

app.get('/editMember', (req, res) => {
  const memberId = req.query.id;
  if (memberId) {
    const stmt = db.prepare('SELECT * FROM members WHERE id = ?');
    const member = stmt.get(memberId);
    res.json(member);
  } else {
    res.status(400).send('Invalid member ID');
  }
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public/index.html'));
});

app.get('/admin', (req, res) => {
  res.redirect('public/admin/');
});

app.get('/leader', (req, res) => {
  res.redirect('public/leader/');
});



app.get('/showDB', (req, res) => {
  const role = req.query.role;
  const stmt = db.prepare('SELECT * FROM users WHERE role = ?');
  const users = stmt.all(role);
  res.json(users);
});

app.post('/register', (req, res) => {
  if (req.body.name === '' || req.body.surname === '' || req.body.email === '' || req.body.password === '' || req.body.role === '') {
    res.send('<script>alert("Please fill in all fields"); window.location.href="/admin/register";</script>');
  } else {
    const hash = sha256(req.body.password)
    const insertStmt = db.prepare('INSERT INTO users (name, surname, email, password, role) VALUES (?, ?, ?, ?, ?)');
    insertStmt.run(req.body.name, req.body.surname, req.body.email, hash, req.body.role);
    res.redirect('/');
  }
});


// Login route
app.post('/login', (req, res) => {
  const userSTMT = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = userSTMT.get(req.body.email) as { id: number, email: string, password: string, role: string };

  if (user) {
    const result = sha256(req.body.password) === user.password;
    if (result) {
      // Store user data in the session upon successful login
      req.session.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };
    } else if (!user) {
      res.send('Wrong password');
    }
  } else {
    res.send('User not found');
  }

  if (req.session.user.role === 'Parent') {
    res.redirect('/');
  } else {
    res.redirect('/' + req.session.user.role);
  }
});

app.delete('/deleteUser', (req, res) => {
  const userId = req.query.id;
  if (userId) {
    const deleteStmt = db.prepare('DELETE FROM users WHERE id = ?');
    deleteStmt.run(userId);
    res.sendStatus(200); // Respond with success status if deletion is successful
  } else {
    res.status(400).send('Invalid user ID');
  }
});

app.get('/editUser', (req, res) => {
  const userId = req.query.id;
  if (userId) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(userId);
    res.json(user);
  } else {
    res.status(400).send('Invalid user ID');
  }
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