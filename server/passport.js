const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth profile received:', {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails[0]?.value
    });
    
    // Try to find user by googleId
    let user = await User.findOne({ googleId: profile.id });
    if (user) {
      console.log('Found existing user by googleId:', user.email);
      return done(null, user);
    }
    
    // If not found, try to find by email
    user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
      console.log('Found existing user by email, linking Google account:', user.email);
      // Link Google account to existing user
      user.googleId = profile.id;
      await user.save();
      return done(null, user);
    }
    
    // Create new user with pending role
    console.log('Creating new user for Google OAuth:', profile.emails[0].value);
    user = await User.create({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      role: 'pending' // Will be updated when user selects role
    });
    
    console.log('New user created successfully:', user.email);
    return done(null, user);
  } catch (err) {
    console.error('Error in Google OAuth strategy:', err);
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}); 