const express = require('express');
const sqlite = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE log_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, name text, description TEXT, date DATETIME," +
     "location TEXT, active BOOLEAN DEFAULT 'TRUE', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

console.log('Database created and table initialized with sample initial data.');

for (let i = 0; i < 7; i++) {
  db.run("INSERT INTO log_entries (name, description, date, location) VALUES (?, ?, ?, ?)", 
    [`Name ${i}`, `Description ${i}`, new Date() - i, `Location ${i}`]);
}

app.get('/v1/logs', (req, res) => {
  console.log('Received request to fetch all log entries');
  const sql = "SELECT * FROM log_entries where active = 'TRUE' ORDER BY created_at DESC LIMIT 5";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
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


const PORT = 1984;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});