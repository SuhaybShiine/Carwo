const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

// Routes
const employeeRoutes = require('./routes/employeeRoutes');
const customerRoutes = require('./routes/customerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const orderStateRoutes = require('./routes/orderStateRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const systemReportRoutes = require('./routes/systemReportRoutes');
const authRoutes = require('./routes/authRoutes');
const fabricRoutes = require('./routes/fabricRoutes');
const fabricInventoryRoutes = require('./routes/fabricInventoryRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-states', orderStateRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/system-report', systemReportRoutes);
app.use('/api/auth', authRoutes);

// Formula + old stock/calculator
app.use('/api/fabric', fabricRoutes);

// Inventory cusub (Code + Color + Waar)
app.use('/api/fabric-inventory', fabricInventoryRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Carwo Furniture Backend is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});