const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();


// ================= MIDDLEWARE =================

// allow frontend to access backend
app.use(cors());

// parse JSON data
app.use(express.json());

// parse form data
app.use(express.urlencoded({ extended: true }));


// ================= DATABASE CONNECTION =================

mongoose
  .connect('mongodb://127.0.0.1:27017/registrationDB')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error', err));


// ================= ROUTES =================

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);


// ================= ROOT ROUTE =================

app.get('/', (req, res) => {
  res.send('Online Registration Portal API is running');
});


// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({
    message: "Server error",
    error: err.message
  });
});


// ================= SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});