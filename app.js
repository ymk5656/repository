const express = require('express');
const mysql = require('mysql');
const app = express();

// DB connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin123',
  database: 'myapp'
});

// Get user by ID - SQL Injection vulnerability
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});

// Search - XSS vulnerability
app.get('/search', (req, res) => {
  const keyword = req.query.q;
  res.send('<h1>Results for: ' + keyword + '</h1>');
});

// Get all users - performance issue (no pagination)
app.get('/users', (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) throw err;
    // Synchronous heavy operation in request handler
    for (let i = 0; i < results.length; i++) {
      results[i].fullName = results[i].first_name + ' ' + results[i].last_name;
      results[i].hash = require('crypto').createHash('md5').update(results[i].email).digest('hex');
    }
    res.json(results);
  });
});

// Login - insecure password handling
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
  db.query(query, (err, results) => {
    if (results.length > 0) {
      res.json({ token: Buffer.from(username + ':' + password).toString('base64') });
    } else {
      res.json({ error: 'Invalid credentials' });
    }
  });
});

// File upload - path traversal vulnerability
app.post('/upload', (req, res) => {
  const filename = req.body.filename;
  const fs = require('fs');
  fs.writeFileSync('/uploads/' + filename, req.body.content);
  res.send('Uploaded');
});

var PORT = 3000
app.listen(PORT, () => {
  console.log("Server running on port " + PORT)
})
