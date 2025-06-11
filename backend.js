const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost', // Change to your database host
    user: 'root',      // Change to your database username
    password: '',      // Change to your database password
    database: 'pharmacydb' // Change to your database name
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Routes

// Get all medicines
app.get('/api/medicines', (req, res) => {
    const { q } = req.query;
    let query = 'SELECT * FROM medicines';
    if (q) {
        query += ` WHERE name LIKE '%${q}%'`;
    }
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching medicines');
        } else {
            res.json(results);
        }
    });
});

// Add a new medicine
app.post('/api/medicines', (req, res) => {
    const { name, quantity, price, supplier_id } = req.body;
    const query = 'INSERT INTO medicines (name, quantity, price, supplier_id) VALUES (?, ?, ?, ?)';
    db.query(query, [name, quantity, price, supplier_id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error adding medicine');
        } else {
            res.status(201).json({ id: result.insertId, name, quantity, price, supplier_id });
        }
    });
});

// Update a medicine
app.put('/api/medicines/:id', (req, res) => {
    const { id } = req.params;
    const { name, quantity, price, supplier_id } = req.body;
    const query = 'UPDATE medicines SET name = ?, quantity = ?, price = ?, supplier_id = ? WHERE id = ?';
    db.query(query, [name, quantity, price, supplier_id, id], (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error updating medicine');
        } else {
            res.send('Medicine updated successfully');
        }
    });
});

// Delete a medicine
app.delete('/api/medicines/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM medicines WHERE id = ?';
    db.query(query, [id], (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error deleting medicine');
        } else {
            res.status(204).send();
        }
    });
});

// Get all suppliers
app.get('/api/suppliers', (req, res) => {
    db.query('SELECT * FROM suppliers', (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching suppliers');
        } else {
            res.json(results);
        }
    });
});

// Add a new supplier
app.post('/api/suppliers', (req, res) => {
    const { name, phone, email, address } = req.body;
    const query = 'INSERT INTO suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)';
    db.query(query, [name, phone, email, address], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error adding supplier');
        } else {
            res.status(201).json({ id: result.insertId, name, phone, email, address });
        }
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});