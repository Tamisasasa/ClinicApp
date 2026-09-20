const express = require('express');
const cors = require('cors');
require('dotenv').config();

const clinicRoutes = require('./routes/clinicRoutes');
const petRoutes = require('./routes/petRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/clinics', clinicRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/bookings', bookingRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});