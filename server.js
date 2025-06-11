const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       // change if your MySQL username is different
    password: '',       // change if your MySQL has a password
    database: 'pharmacydb'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

// --- Medicines ---
app.get('/api/medicines', (req, res) => {
    let q = req.query.q ? `%${req.query.q}%` : "%";
    db.query(
        `SELECT medicines.*, suppliers.name AS supplier_name 
         FROM medicines LEFT JOIN suppliers ON medicines.supplier_id=suppliers.id
         WHERE medicines.name LIKE ?`, [q],
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
});
app.post('/api/medicines', (req, res) => {
    const { name, quantity, price, supplier_id } = req.body;
    db.query(
        'INSERT INTO medicines (name, quantity, price, supplier_id) VALUES (?, ?, ?, ?)',
        [name, quantity, price, supplier_id || null],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ id: result.insertId });
        }
    );
});
app.put('/api/medicines/:id', (req, res) => {
    const { name, quantity, price, supplier_id } = req.body;
    db.query(
        'UPDATE medicines SET name=?, quantity=?, price=?, supplier_id=? WHERE id=?',
        [name, quantity, price, supplier_id || null, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ affectedRows: result.affectedRows });
        }
    );
});
app.delete('/api/medicines/:id', (req, res) => {
    db.query('DELETE FROM medicines WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ affectedRows: result.affectedRows });
    });
});

// --- Suppliers ---
app.get('/api/suppliers', (req, res) => {
    let q = req.query.q ? `%${req.query.q}%` : "%";
    db.query('SELECT * FROM suppliers WHERE name LIKE ?', [q], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});
app.post('/api/suppliers', (req, res) => {
    const { name, phone, email, address } = req.body;
    db.query(
        'INSERT INTO suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)',
        [name, phone, email, address],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ id: result.insertId });
        }
    );
});
app.put('/api/suppliers/:id', (req, res) => {
    const { name, phone, email, address } = req.body;
    db.query(
        'UPDATE suppliers SET name=?, phone=?, email=?, address=? WHERE id=?',
        [name, phone, email, address, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ affectedRows: result.affectedRows });
        }
    );
});
app.delete('/api/suppliers/:id', (req, res) => {
    db.query('DELETE FROM suppliers WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ affectedRows: result.affectedRows });
    });
});

// --- Customers ---
app.get('/api/customers', (req, res) => {
    let q = req.query.q ? `%${req.query.q}%` : "%";
    db.query('SELECT * FROM customers WHERE name LIKE ?', [q], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});
app.post('/api/customers', (req, res) => {
    const { name, phone, email, address } = req.body;
    db.query(
        'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
        [name, phone, email, address],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ id: result.insertId });
        }
    );
});
app.put('/api/customers/:id', (req, res) => {
    const { name, phone, email, address } = req.body;
    db.query(
        'UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?',
        [name, phone, email, address, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ affectedRows: result.affectedRows });
        }
    );
});
app.delete('/api/customers/:id', (req, res) => {
    db.query('DELETE FROM customers WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ affectedRows: result.affectedRows });
    });
});

// --- Purchases ---
app.get('/api/purchases', (req, res) => {
    db.query(
        `SELECT purchases.*, medicines.name AS medicine_name, suppliers.name AS supplier_name 
         FROM purchases 
         LEFT JOIN medicines ON purchases.medicine_id = medicines.id 
         LEFT JOIN suppliers ON purchases.supplier_id = suppliers.id
         ORDER BY purchases.purchase_date DESC`, 
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
});
app.post('/api/purchases', (req, res) => {
    const { medicine_id, supplier_id, quantity, purchase_price } = req.body;
    db.beginTransaction(err => {
        if (err) return res.status(500).json(err);
        db.query('UPDATE medicines SET quantity=quantity+? WHERE id=?', [quantity, medicine_id], err => {
            if (err) return db.rollback(() => res.status(500).json(err));
            db.query(
                'INSERT INTO purchases (medicine_id, supplier_id, quantity, purchase_price) VALUES (?, ?, ?, ?)',
                [medicine_id, supplier_id, quantity, purchase_price],
                (err, result) => {
                    if (err) return db.rollback(() => res.status(500).json(err));
                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json(err));
                        res.json({ purchase_id: result.insertId });
                    });
                }
            );
        });
    });
});

// --- Invoices ---
app.get('/api/invoices', (req, res) => {
    db.query(
        `SELECT invoices.*, customers.name AS customer_name 
         FROM invoices 
         LEFT JOIN customers ON invoices.customer_id = customers.id
         ORDER BY invoices.invoice_date DESC`, 
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
});
app.get('/api/invoices/:id/items', (req, res) => {
    db.query(
        `SELECT invoice_items.*, medicines.name AS medicine_name
         FROM invoice_items
         LEFT JOIN medicines ON invoice_items.medicine_id = medicines.id
         WHERE invoice_id=?`, [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
});
app.post('/api/invoices', (req, res) => {
    const { customer_id, items } = req.body;
    let total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    db.beginTransaction(err => {
        if (err) return res.status(500).json(err);
        db.query('INSERT INTO invoices (customer_id, total) VALUES (?, ?)', [customer_id, total], (err, result) => {
            if (err) return db.rollback(() => res.status(500).json(err));
            const invoice_id = result.insertId;
            const invoiceItems = items.map(item => [invoice_id, item.medicine_id, item.quantity, item.price]);
            db.query('INSERT INTO invoice_items (invoice_id, medicine_id, quantity, price) VALUES ?', [invoiceItems], err => {
                if (err) return db.rollback(() => res.status(500).json(err));
                let updateTasks = items.map(item =>
                    new Promise((resolve, reject) => {
                        db.query('UPDATE medicines SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.medicine_id], err => {
                            if (err) reject(err); else resolve();
                        });
                    })
                );
                Promise.all(updateTasks).then(() => {
                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json(err));
                        res.json({ invoice_id });
                    });
                }).catch(err => db.rollback(() => res.status(500).json(err)));
            });
        });
    });
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));