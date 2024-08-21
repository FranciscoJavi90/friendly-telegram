const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const querystring = require('querystring'); // Importa querystring
const axios = require('axios'); 
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env
const router = express.Router();
const REDIRECT_URI = 'http://localhost:5000/api/auth/spotify/callback';
const TOKEN_SPOTIFY_ID = '61664b88054b45baadea6ae5cbfa9271';
const CLIENTE_SPOTIFY_SECRET = '799521dc4c534e8d89a45264b7c59d1a';

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
            return res.status(400).json({ msg: 'Credenciales incorrectas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales incorrectas.' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Respuesta con autenticación exitosa y token
        res.json({
            msg: 'Autenticación exitosa.',
            token: token
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Obtener los datos del usuario actual
router.get('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
          return res.status(404).json({ msg: 'Usuario no encontrado' });
      }
      res.json(user);
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
  }
});

// Obtener todos los usuarios
router.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Redirige al usuario a Spotify para la autenticación
router.get('/spotify', passport.authenticate('spotify', {
    scope: ['user-read-email', 'user-read-private'], // Agrega los scopes que necesites
    showDialog: true
}));

router.get('/spotify/login', (req, res) => {
    const scopes = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
    const authURL = 'https://accounts.spotify.com/authorize?' + querystring.stringify({
        response_type: 'code',
        client_id: process.env.TOKEN_SPOTIFY_ID, // Usa las variables de entorno
        scope: scopes,
        redirect_uri: process.env.REDIRECT_URI, // Usa las variables de entorno
        show_dialog: true
    });
    res.redirect(authURL);
});

// Ruta de callback después de la autorización
router.get('/spotify/callback', async (req, res) => {
    const code = req.query.code || null;
    const error = req.query.error || null;

    if (error) {
        return res.status(400).json({ error: 'Authorization error' });
    }

    if (!code) {
        return res.status(400).json({ error: 'Authorization code is missing.' });
    }

    try {
        const tokenResponse = await exchangeCodeForToken(code);
        const userInfo = await getUserInfo(tokenResponse.access_token);

        // Guarda los datos en la sesión
        req.session.user = userInfo;
        const encodedUserInfo = encodeURIComponent(JSON.stringify(userInfo));

        // Redirige al perfil con la información del usuario en la URL
        res.redirect(`/profile?user=${encodedUserInfo}`);
    } catch (err) {
        console.error('Error al obtener el token:', err.message);
        res.status(500).json({ error: 'Error al obtener el token' });
    }
});

// Ruta para mostrar el perfil
router.get('/profile', (req, res) => {
    if (!req.query.user) {
        return res.status(401).send('No user information available');
    }

    // Envía el archivo HTML
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Ruta para mostrar el login
router.get('/login', (req, res) => {
  if (!req.query.user) {
      return res.status(401).send('No user information available');
  }

  // Envía el archivo HTML
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ruta para mostrar datos de mongo
router.get('/mongo', (req, res) => {
  if (!req.query.user) {
      return res.status(401).send('No user information available');
  }

  // Envía el archivo HTML
  res.sendFile(path.join(__dirname, 'public', 'mongo.html'));
});

async function exchangeCodeForToken(code) {
    const response = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: TOKEN_SPOTIFY_ID,
        client_secret: CLIENTE_SPOTIFY_SECRET
    }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    return response.data;
}

async function getUserInfo(accessToken) {
    const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    return response.data;
}
module.exports = router;