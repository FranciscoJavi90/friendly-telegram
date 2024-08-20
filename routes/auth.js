const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

// Registrar usuario JWT
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        let user = await User.findOne({ username });

        if (user) {
            return res.status(400).json({ msg: 'Usuario ya existente!' });
        }

        // Hash de la contraseña antes de guardar
        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({
            username,
            password: hashedPassword
        });

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Iniciar sesión
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        let user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({ msg: 'Credenciales incorrectas.!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales incorrectas.!' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Authorization Code Grant
router.get('/auth', passport.authenticate('oauth2'));

// Ruta de callback después de la autorización
router.get('/auth/callback', passport.authenticate('oauth2', { 
    failureRedirect: '/' 
  }), (req, res) => {
    // Redirigir al usuario a la página de perfil después de autenticarse
    res.redirect('/profile');
});

// Ruta protegida de ejemplo
router.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ msg: 'No autenticado' });
  }
  res.json(req.user);
});

module.exports = router;