const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const User = require('../models/User');

passport.use(new OAuth2Strategy({
    authorizationURL: 'https://github.com/login/oauth/authorize',
    tokenURL: 'https://github.com/login/oauth/access_token',
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Usando `accessToken` para obtener información del perfil del usuario
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const profileData = await response.json();
      
      // Puedes usar `profileData` para buscar o crear el usuario en la base de datos
      let user = await User.findOne({ oauthId: profileData.id });
      if (!user) {
        user = new User({
          oauthId: profileData.id,
          username: profileData.login,
          // Otros campos que quieras guardar del perfil
        });
        await user.save();
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }
));

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
