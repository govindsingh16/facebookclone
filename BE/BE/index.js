const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();

app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'facebook'
});

db.connect(err => {
    if (err) throw err;
    console.log('Database connected!');
});

app.post("/user/signup", (req, res) => {
    const { semail, spassword, sname } = req.body;
    const q = `INSERT INTO user (email, password, name) VALUES (?, ?, ?)`;
    db.query(q, [semail, spassword, sname], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Signup failed" });
        }
        res.json({ message: "Signup successful" });
    });
});

app.post("/user/login", (req, res) => {
    const { lemail, lpassword } = req.body;
    const q = `SELECT * FROM user WHERE email = ?`;
    db.query(q, [lemail], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Login failed" });
        }
        if (result.length > 0) {
            const [row] = result;
            if (row.password === lpassword) {
                const payload = { email: lemail, name: row.name };
                const options = { expiresIn: '1h' };
                const secretKey = "#$%^&*()!ABCD&";
                const token = jwt.sign(payload, secretKey, options);
                res.json({ message: "valid", token, name: row.name });
            } else {
                res.json({ message: "invalid password", token: "" });
            }
        } else {
            res.json({ message: "invalid email", token: "" });
        }
    });
});

app.post('/friend-request/send', (req, res) => {
    const { sender, receiver } = req.body;
  
    if (!sender || !receiver) {
      return res.status(400).json({ message: 'Sender and receiver are required' });
    }
  
    const q = 'INSERT INTO friend_requests (sender, receiver, status) VALUES (?, ?, ?)';
    const values = [sender, receiver, 'pending'];
  
    db.query(q, values, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      res.json({ message: 'Friend request sent successfully' });
    });
  });
  

  app.get('/friend-request/pending/:email', (req, res) => {
    const email = req.params.email;
  
    const q = 'SELECT sender, receiver, status FROM friend_requests WHERE receiver = ? AND status = ?';
    const values = [email, 'pending'];
  
    db.query(q, values, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      res.json(results);
    });
  });
  
  app.post('/friend-request/respond', (req, res) => {
    const { sender, receiver, status } = req.body;
  
    if (!sender || !receiver || !status) {
      return res.status(400).json({ message: 'Sender, receiver, and status are required' });
    }
  
    const q = 'UPDATE friend_requests SET status = ? WHERE sender = ? AND receiver = ?';
    const values = [status, sender, receiver];
  
    db.query(q, values, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      res.json({ message: `Friend request ${status}` });
    });
  });
  
  

app.listen(8000, () => {
    console.log("Server is running on port 8000");
});



