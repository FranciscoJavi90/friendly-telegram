const express = require('express');
const connectDB = require('./config/database');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const path = require('path');

dotenv.config();

connectDB();

// Cargar la configuración de passport antes de usar las rutas
require('./config/passport');

const app = express();

// Configura la sesión
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.get('/profile', (req, res) => {
    // Asegúrate de que 'public' es el directorio correcto
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/login', (req, res) => {
  // Asegúrate de que 'public' es el directorio correcto
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/mongo', (req, res) => {
  // Asegúrate de que 'public' es el directorio correcto
  res.sendFile(path.join(__dirname, 'public', 'mongo.html'));
});

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json()); // Middleware para parsear JSON

// Usar las rutas de autenticación
app.use('/api/auth', authRoutes);

// Manejar todas las demás rutas no definidas
app.get('*', (req, res) => {
    res.status(404).send('Página no encontrada');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
