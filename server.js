const express = require('express');
const connectDB = require('./config/database');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

// Usar las rutas de autenticación
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
