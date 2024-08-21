const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const SpotifyStrategy = require('passport-spotify').Strategy;
const User = require('../models/User');
const fetch = require('node-fetch'); // Asegúrate de tener node-fetch instalado

// Configuración de SpotifyStrategy para autenticación con Spotify
passport.use(new SpotifyStrategy({
    clientID: process.env.TOKEN_SPOTIFY_ID,
    clientSecret: process.env.CLIENTE_SPOTIFY_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  async (accessToken, refreshToken, expires_in, profile, done) => {
    try {
      // Puedes usar profile para buscar o crear el usuario en la base de datos
      let user = await User.findOne({ spotifyId: profile.id });
      if (!user) {
        user = new User({
          spotifyId: profile.id,
          username: profile.username || profile.displayName,
          // Otros campos que quieras guardar del perfil
        });
        await user.save();
      }
      
      // Agregar el token al usuario para ser utilizado en la respuesta
      user.token = accessToken;
      done(null, user);
    } catch (err) {
      done(err);
    }
  }
));

// Serialización y deserialización del usuario
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Configuración de JwtStrategy para manejar JWT
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
        const user = await User.findById(jwt_payload.user.id);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (err) {
        return done(err, false);
    }
}));

