import express, { json, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { join } from 'path';
import Database from 'better-sqlite3';
import { sha256 } from './utils';
import multer from 'multer';
import { SessionData } from 'express-session';
import './types.ts'

import { Users } from './types';

const app = express();
const db = Database('database.db', { verbose: console.log });
const upload = multer({ dest: 'public/uploads/' }); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));
app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: true
}));

interface MemberData {
  peleton_id: number;
  name: string;
}

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

app.get('editCompany', (req, res) => {
  const companyId = req.query.id;
  if (companyId) {
    const stmt = db.prepare('SELECT * FROM companies WHERE id = ?');
    const company = stmt.get(companyId);
    res.json(company);
  } else {
    res.status(400).send('Invalid company ID');
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

app.delete('/deleteAccount', (req, res) => {
  res.status(403).send('You are not allowed to delete your account');
});

app.put('/changePassword', (req, res) => {
  res.status(403).send('You are not allowed to change your password');
});

app.get('/showDB', (req, res) => {
  const role = req.query.role;
  const stmt = db.prepare('SELECT * FROM users WHERE role = ?');
  const users = stmt.all(role);
  res.json(users);
});

app.post('/register', async (req, res) => {
  const { name, surname, email, password, role } = req.body;

  const hash = sha256(password);
  const insertStmt = db.prepare('INSERT INTO users (name, surname, email, password, role) VALUES (?, ?, ?, ?, ?)');
  insertStmt.run(name, surname, email, hash, role);

  res.redirect('/');
})

// Register  member route
app.post('/registerMember', async (req, res) => {
  const { name, surname, email, password, role, memberAddress, memberPhone, assignPeleton, assignParent } = req.body;

  try {
    const hash = sha256(password);
    const insertUserStmt = db.prepare('INSERT INTO users (name, surname, email, password, role) VALUES (?, ?, ?, ?, ?)');
    const user = insertUserStmt.run(name, surname, email, hash, role);

    if (user && user.lastInsertRowid) {
      const userId = user.lastInsertRowid;

      const insertMemberStmt = db.prepare('INSERT INTO members (user_id, name, surname, address, email, phone) VALUES (?, ?, ?, ?, ?, ?)');
      insertMemberStmt.run(userId, name, surname, memberAddress, email, memberPhone);

      if (assignPeleton) {
        const peletonId = req.body.peletonId; // Get the peleton ID from the request body

        // Check if the peleton ID is provided and valid
        if (peletonId) {
          const peletonCheckStmt = db.prepare('SELECT * FROM peleton WHERE id = ?');
          const peleton = peletonCheckStmt.get(peletonId);

          if (peleton) {
            const insertPeletonStmt = db.prepare('UPDATE members SET peleton_id = ? WHERE user_id = ?');
            insertPeletonStmt.run(peletonId, userId);
          } else {
            res.status(400).send('Invalid peleton ID');
            return;
          }
        } else {
          res.status(400).send('No peleton ID provided');
          return;
        }
      }

      if (assignParent) {
        const parentId = req.body.parentId; // Get the parent ID from the request body

        // Check if the parent ID is provided and valid
        if (parentId) {
          const parentCheckStmt = db.prepare('SELECT * FROM parents WHERE id = ?');
          const parent = parentCheckStmt.get(parentId);

          if (parent) {
            const insertMemberParentStmt = db.prepare('INSERT INTO member_parent (member_id, parent_id) VALUES (?, ?)');
            insertMemberParentStmt.run(userId, parentId);
          } else {
            res.status(400).send('Invalid parent ID');
            return;
          }
        } else {
          res.status(400).send('No parent ID provided');
          return;
        }
      }

      res.redirect('/');
    } else {
      res.status(500).send('Failed to create member');
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send('Failed to create user');
  }
});

app.post('/registerParent', async (req, res) => {
  const { name, surname, email, password, role, address, phone, assignPeleton } = req.body;

  try {
    const hash = sha256(password);
    const insertUserStmt = db.prepare('INSERT INTO users (name, surname, email, password, role) VALUES (?, ?, ?, ?, ?)');
    const user = insertUserStmt.run(name, surname, email, hash, role);
    

    if (user && user.lastInsertRowid) {
      const userId = user.lastInsertRowid;
      const memberId = req.body.memberId;

      const insertParentStmt = db.prepare('INSERT INTO parents (user_id, name, surname, address, email, phone, peleton_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const parent = insertParentStmt.run(userId, name, surname, email, address, phone, assignPeleton);

      // Assign the member to the parent in the member_parent table
      const insertMemberParentStmt = db.prepare('INSERT INTO member_parent (member_id, parent_id) VALUES (?, ?)');
      const memberParent = insertMemberParentStmt.run(memberId, parent.lastInsertRowid);

      if (parent && parent.lastInsertRowid && memberParent && memberParent.lastInsertRowid) {
        res.redirect('/');
      } else {
        res.status(500).send('Failed to create parent or assign member to parent');
      }
    } else {
      res.status(500).send('Failed to create parent');
    }
  } catch (error) {
    console.error('Error creating parent:', error);
    res.status(500).send(`Failed to create parent: ${error.message}`);
  }
});

// Login route
app.post('/login', (req, res) => {
  const userSTMT = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = userSTMT.get(req.body.email) as Users;

  if (user) {
    const result = sha256(req.body.password) === user.password;
    if (result) {
      // Store user data in the session upon successful login
      req.session.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      if (req.session.user.role === 'parent') {
        res.redirect('/member');
      } else {
        res.redirect('/' + req.session.user.role);
      }
    } else if (!user) {
      res.send('Wrong password');
    }
  } else {
    res.redirect('/');
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

app.get('/getUser', (req, res) => {
  const userId = req.query.id;
  if (userId) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(userId);
    res.json(user);
  } else {
    res.status(400).send('Invalid user ID');
  }
});

app.get('/editUser', (req, res) => {
  const userId = req.query.id;
  if (userId) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(userId);
    res.redirect('/admin/edit/user/?id=' + userId);
  } else {
    res.status(400).send('Invalid user ID');
  }
});

app.put('/updateUser', async (req: Request, res: Response) => {
  const userId = req.query.id;
  if (userId) {
    const { userName, userSurname, userEmail, userPassword, userRole, userAddress, userPhone } = req.body;

    let updateUserStmt;
    let updateMemberStmt;
    let updateParentStmt;

    switch (userRole) {
      case 'member':
        updateUserStmt = db.prepare('UPDATE users SET name = ?, surname = ?, email = ?, password = ? WHERE id = ?');
        updateUserStmt.run(userName, userSurname, userEmail, userPassword, userId);

        updateMemberStmt = db.prepare('UPDATE members SET name = ?, surname = ?, address = ?, email = ?, phone = ? WHERE user_id = ?');
        updateMemberStmt.run(userName, userSurname, userAddress, userEmail, userPhone, userId);
        break;

      case 'parent':
        updateUserStmt = db.prepare('UPDATE users SET name = ?, surname = ?, email = ?, password = ? WHERE id = ?');
        updateUserStmt.run(userName, userSurname, userEmail, userPassword, userId);

        updateParentStmt = db.prepare('UPDATE parents SET name = ?, surname = ?, email = ?, phone = ? WHERE user_id = ?');
        updateParentStmt.run(userName, userSurname, userEmail, userPhone, userId);
        break;

      case 'admin':
      case 'leader':
        updateUserStmt = db.prepare('UPDATE users SET name = ?, surname = ?, email = ?, password = ? WHERE id = ?');
        updateUserStmt.run(userName, userSurname, userEmail, userPassword, userId);
        break;
    }

    res.sendStatus(200); // Respond with success status if update is successful
  } else {
    res.status(400).send('Invalid user ID');
  }
});

app.get('/editCompany', (req, res) => {
  const companyId = req.query.id;
  if (companyId) {
    const stmt = db.prepare('SELECT * FROM companies WHERE id = ?');
    const company = stmt.get(companyId);
    res.json(company);
  } else {
    res.status(400).send('Invalid company ID');
  }
});

app.put('/updateCompany', (req, res) => {
  const { id, name, description, logo, address, city, leader_id } = req.body;
  if (!id) {
    res.status(400).send('Company id is required');
    return;
  }
  const stmt = db.prepare(`UPDATE companies SET name = ?, description = ?, logo = ?, address = ?, city = ?, leader_id = ? WHERE id = ?`);
  const info = stmt.run(name, description, logo, address, city, leader_id, id);
  if (info.changes > 0) {
    res.send('Company updated successfully');
  } else {
    res.status(404).send('Company not found');
  }
});

app.post('/admin/company', upload.single('logo'), (req, res) => {
  const { name, description, address, city, leader } = req.body;
  const logo = req.file ? req.file.filename : null; // Get the path of the uploaded file
  const insertStmt = db.prepare('INSERT INTO companies (name, description, logo, address, city, leader_id) VALUES (?, ?, ?, ?, ?, ?)');
  insertStmt.run(name, description, logo, address, city, leader);
  res.json({ message: 'Company added'	})
});

app.post('/admin/peleton', (req, res) => {
  const { name, companies_id } = req.body;
  const insertStmt = db.prepare('INSERT INTO peleton (name, companies_id) VALUES (?, ?)');
  insertStmt.run(name, companies_id);

  res.redirect('/admin/register/peleton');
});

// Endpoint to retrieve existing companies
app.get('/admin/companies', (req, res) => {
  const stmt = db.prepare('SELECT id, name FROM companies');
  const companies = stmt.all();

  res.json(companies);
});

// Endpoint to fetch all peletons
app.get('/admin/showPeletons', (req, res) => {
  const stmt = db.prepare('SELECT * FROM peleton');
  const peletons = stmt.all();
  
  res.json(peletons);
});

// Endpoint to fetch all companies
app.get('/admin/showCompanies', (req, res) => {
  const stmt = db.prepare('SELECT companies.id, companies.name, companies.description, companies.logo, companies.address, companies.city, users.name AS owner_name FROM companies LEFT JOIN users ON companies.leader_id = users.id');
  const companies = stmt.all();
  
  res.json(companies);
});

// Endpoint to fetch all members
app.get('/admin/showMembers', (req, res) => {
  const stmt = db.prepare('SELECT * FROM members');
  const members = stmt.all();

  res.json(members);
});

app.get('/admin/showParents', (req, res) => {
  const stmt = db.prepare('SELECT * FROM parents');
  const parents = stmt.all();

  res.json(parents);
});

app.get('/admin/peletonsByCompany/:companyId', (req, res) => {
  const companyId = req.params.companyId;
  const stmt = db.prepare('SELECT * FROM peleton WHERE companies_id = ?');
  const peletons = stmt.all(companyId);

  res.json(peletons);
});

app.delete('/admin/deleteCompany', (req, res) => {
  const companyId = req.query.id;
  if (companyId) {
    const deleteStmt = db.prepare('DELETE FROM companies WHERE id = ?');
    deleteStmt.run(companyId);
    res.sendStatus(200); // Respond with success status if deletion is successful
  } else {
    res.status(400).send('Invalid company ID');
  }
});

// Endpoint to fetch members of the logged-in user's peleton
app.get('/memberPeletonMembers', (req, res) => {
  const loggedInUserId = req.session?.user?.id;

  const peletonIdQuery = db.prepare('SELECT peleton_id FROM members WHERE user_id = ?');
  const peletonIdResult = peletonIdQuery.get(loggedInUserId) as MemberData;

  if (peletonIdResult && 'peleton_id' in peletonIdResult) {
    const peletonId = peletonIdResult.peleton_id;

    const stmt = db.prepare('SELECT * FROM members WHERE peleton_id = ?');
    const members = stmt.all(peletonId);

    res.json(members);
  } else {
    res.status(404).send('Peleton not found for the logged-in user');
  }
});

// Endpoint to fetch the peleton name of the logged-in user
app.get('/getPeletonName', (req, res) => {
  const loggedInUserId = req.session?.user?.id;

  const peletonIdQuery = db.prepare('SELECT peleton_id FROM members WHERE user_id = ?');
  const peletonIdResult = peletonIdQuery.get(loggedInUserId) as { peleton_id?: number };

  if (peletonIdResult && 'peleton_id' in peletonIdResult) {
    const peletonId = peletonIdResult.peleton_id || 0; // Default value if peleton_id is undefined

    const peletonNameQuery = db.prepare('SELECT name FROM peleton WHERE id = ?');
    const peletonNameResult = peletonNameQuery.get(peletonId) as { name?: string };

    if (peletonNameResult && 'name' in peletonNameResult && peletonNameResult.name) {
      const peletonName = peletonNameResult.name;
      res.json({ peletonName });
    } else {
      res.status(404).send('Peleton name not found');
    }
  } else {
    res.status(404).send('Peleton not found for the logged-in user');
  }
});

// Endpoint to fetch users
app.get('/admin/showUsers', (req, res) => {
  const stmt = db.prepare('SELECT id, name, surname, email, password, role, leader_id FROM users'); 
  const users = stmt.all();
  res.json(users);
});

function getUserById(userId: number) {
  const stmt = db.prepare('SELECT name, surname FROM users WHERE leader_id = ?');
  const user = stmt.get(userId);
  return user;
}




app.listen(3000, () => {
  console.log('Server running on port http://localhost:3000');
});