import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(':memory:');

const pad = (n: number): string => n.toString().padStart(2, '0');

// Initialize the database and create the table
db.serialize(() => {
  db.run(
    `CREATE TABLE log_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT, 
      description TEXT, 
      date TEXT, 
      location TEXT, 
      active BOOLEAN DEFAULT 'TRUE', 
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  db.run(      
    `CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE)`
  );
});

// Insert sample data
for (let i = 0; i < 7; i++) {
  db.run(
    `INSERT INTO log_entries (name, description, date, location) VALUES (?, ?, ?, ?)`,
    [
      `Name ${i}`,
      `Description ${i}`,
      `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}-${pad(new Date().getDate() - i)}`,
      `Location ${i}`,
    ]
  );
  db.run(
    `INSERT INTO users (username) VALUES (?)`,
    [`Name ${i}`]
  );
}

console.log('Database created and table initialized with sample initial data.');

// Fetch logs with pagination
app.get('/v1/logs', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;
  const offset = (page - 1) * limit;

  console.log('Received request to fetch log entries with pagination:', { page, limit, offset });

  const sql = `SELECT * FROM log_entries WHERE active = 'TRUE' ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
  db.all(sql, [limit, offset], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    db.get(`SELECT COUNT(*) as total FROM log_entries WHERE active = 'TRUE'`, (err, countRow: { total: number }) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      console.log('Fetched log entries:', rows);
      res.json({
        logs: rows,
        total: countRow.total,
        page: page,
        totalPages: Math.ceil(countRow.total / limit),
      });
    });
  });
});

// Create a new log entry
app.post('/v1/logs', (req: Request, res: Response) => {
  console.log('Received request to create a new log entry:', req.body);
  const { name, description, date, location } = req.body;
  if (!name || !description || !date || !location) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const log_entry_sql = `INSERT INTO log_entries (name, description, date, location) VALUES (?, ?, ?, ?)`;
  const user_sql = `INSERT OR IGNORE INTO users (username) VALUES (?)`;
  db.run(user_sql, [name], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
  }); 
  db.run(log_entry_sql, [name, description, date, location], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});


// Fetch all users
app.get('/v1/users', (req: Request, res: Response) => {
  console.log('Received request to fetch all users');
  const sql = `SELECT username FROM users`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Fetched users:', rows);
    res.json(rows);
  });
});

// Update a log entry
app.put('/v1/logs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, date, location } = req.body;

  if (!validateRequestId(id, res)) return;

  console.log('Received request to update log entry with ID:', id, 'Data:', req.body);
  const sql = `UPDATE log_entries SET name = ?, description = ?, date = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  db.run(sql, [name, description, date, location, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ changes: this.changes });
  });
});

// Delete a log entry
app.delete('/v1/logs/:id', async(req: Request, res: Response) => {
  const { id } = req.params;

  const isValid = await validateRequestId(id, res);
  if (!isValid) return;

  console.log('Received request to delete log entry with ID:', id);
  const sql = `UPDATE log_entries SET active = 'FALSE' WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Entry deleted' });
  });
});

// Validate request ID
const validateRequestId = (id: string, res: Response): Promise<boolean> => {
  console.log('Validating ID:', id);
  return new Promise((resolve) => {
  if (!id || isNaN(Number(id))) {
    res.status(404).json({ error: 'Invalid ID' });
    return resolve(false);
  }

  db.get("SELECT id from log_entries where id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return resolve(false);
    }
    if (!row) {
      res.status(404).json({ error: 'Log entry not found' });
      return resolve(false);
    }
    
    console.log('ID is valid:', id);
    return resolve(true);
  });
});
};

export default app;