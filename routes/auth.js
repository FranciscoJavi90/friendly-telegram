const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Registrar usuario
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

module.exports = router;