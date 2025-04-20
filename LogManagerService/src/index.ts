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
});

console.log('Database created and table initialized with sample initial data.');

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
}

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
  const sql = `INSERT INTO log_entries (name, description, date, location) VALUES (?, ?, ?, ?)`;
  db.run(sql, [name, description, date, location], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
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
app.delete('/v1/logs/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  if (!validateRequestId(id, res)) return;

  console.log('Received request to delete log entry with ID:', id);
  const sql = `UPDATE log_entries SET active = 'FALSE' WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ changes: this.changes });
  });
});

// Validate request ID
const validateRequestId = (id: string, res: Response): boolean => {
  console.log('Validating ID:', id);
  if (!id || isNaN(Number(id))) {
    res.status(400).json({ error: 'Invalid ID' });
    return false;
  }
  return true;
};

const PORT = 1984;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});