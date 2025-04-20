const express = require('express');
const sqlite = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite.Database(':memory:');

const pad = (n) => n.toString().padStart(2, '0');

db.serialize(() => {
  db.run("CREATE TABLE log_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, name text, description TEXT, date TEXT," +
     "location TEXT, active BOOLEAN DEFAULT 'TRUE', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

console.log('Database created and table initialized with sample initial data.');

for (let i = 0; i < 7; i++) {
  db.run("INSERT INTO log_entries (name, description, date, location) VALUES (?, ?, ?, ?)", 
    [`Name ${i}`, `Description ${i}`, new Date().getFullYear() + '-' + (pad(new Date().getMonth() + 1)) + '-' + (new Date().getDate() - i), `Location ${i}`]);
}

app.get('/v1/logs', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5; 
  const offset = (page - 1) * limit;
  console.log('Received request to fetch log entries with pagination:', { page, limit, offset });

  const sql = "SELECT * FROM log_entries where active = 'TRUE' ORDER BY updated_at DESC LIMIT ? OFFSET ?";
  db.all(sql, [limit, offset], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    db.get("SELECT COUNT(*) as total FROM log_entries where active = 'TRUE'", (err, countRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
    console.log('Fetched log entries:', rows);
    res.json({
      logs: rows,
      total: countRow.total,
      page: page,
      totalPages: Math.ceil(countRow.total / limit)
    }
    );
  });
});
});

app.post('/v1/logs', (req, res) => {
  console.log('Received request to create a new log entry:', req.body);
  const { name, description, date, location } = req.body;
  const sql = "INSERT INTO log_entries (name, description, date, location) VALUES (?, ?, ?, ?)";
  db.run(sql, [name, description, date, location], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

app.put('/v1/logs/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, date, location } = req.body;
  // Validate the ID before proceeding with the update
  validateRequestId(id);
  console.log('Received request to update log entry with ID:', id, 'Data:', req.body);
  const sql = "UPDATE log_entries SET name = ?, description = ?, date = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
  db.run(sql, [name, description, date, location, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ changes: this.changes });
  });
});

app.delete('/v1/logs/:id', (req, res) => {
  const { id } = req.params;
  // Validate the ID before proceeding with the deletion
  validateRequestId(id);
  console.log('Received request to delete log entry with ID:', id);
 
  // Proceed with the deletion
  const sql = "UPDATE log_entries SET active = 'FALSE' WHERE id = ?";
  db.run(sql, [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ changes: this.changes });
  });
});

validateRequestId = (id) => {
   // Check if the ID is valid
   console.log('Validating ID:', id);
   if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  // Check if the ID exists in the database
  const checkSql = "SELECT * FROM log_entries WHERE id = ?";
  db.get(checkSql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Log entry not found' });
    }
  });
};



const PORT = 1984;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});