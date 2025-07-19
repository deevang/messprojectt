# Google OAuth Authentication Setup Guide

## ✅ What's Been Implemented

### Backend (Server)
1. **User Model**: Added `googleId` field for Google OAuth users
2. **Passport Configuration**: Google OAuth strategy with proper user creation/finding
3. **Auth Routes**: `/google` and `/google/callback` endpoints
4. **Dependencies**: `passport-google-oauth20` installed

### Frontend (Client)
1. **Login Page**: Added Google Sign-In button with proper styling
2. **Register Page**: Added Google Sign-Up button with proper styling
3. **Auth Context**: Enhanced to handle Google authentication tokens
4. **Token Handling**: Proper JWT decoding and user data management
5. **Role-based Redirects**: Automatic navigation based on user role

## 🔧 Setup Instructions

### Step 1: Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API or Google Identity API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`

### Step 2: Environment Variables
Create/update `server/.env` file:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_here
```

### Step 3: Test the Setup
1. Start server: `cd server && npm start`
2. Start client: `cd client && npm run dev`
3. Visit login page (`/login`) or register page (`/register`)
4. Click "Sign in with Google" or "Sign up with Google"
5. Complete Google OAuth flow
6. Should redirect to appropriate dashboard based on role

## 🔄 How It Works

### Authentication Flow
1. User clicks "Sign in with Google" or "Sign up with Google" button
2. Redirected to `http://localhost:5000/api/auth/google`
3. Google OAuth consent screen appears
4. User authorizes the application
5. Google redirects to callback URL with authorization code
6. Server exchanges code for user profile
7. Server creates/finds user in database
8. Server issues JWT token
9. Server redirects to frontend with token
10. Frontend decodes token and stores user data
11. User redirected to appropriate dashboard

### User Creation
- New Google users are automatically created with role 'student'
- Existing users are found by `googleId`
- Password field is optional for Google users
- Works the same for both login and register pages

## 🛠️ Customization Options

### Change Default Role
Edit `server/passport.js` line 15:
```javascript
role: 'admin' // or 'mess_staff', 'staff_head'
```

### Custom User Fields
Edit `server/passport.js` lines 12-17 to add more fields:
```javascript
user = await User.create({
  googleId: profile.id,
  name: profile.displayName,
  email: profile.emails[0].value,
  role: 'student',
  // Add custom fields here
});
```

### Frontend Styling
The Google button uses Tailwind CSS classes. Customize in:
- `client/src/pages/LoginPage.jsx` (for login page)
- `client/src/pages/RegisterPage.jsx` (for register page)

## 🚀 Production Deployment

### Update URLs
1. Change `localhost` URLs to your production domain
2. Update Google Cloud Console authorized origins/redirects
3. Update environment variables

### Security
1. Use strong JWT secrets
2. Enable HTTPS in production
3. Set proper CORS policies
4. Validate tokens on protected routes

## 🐛 Troubleshooting

### Common Issues
1. **redirect_uri_mismatch**: Check callback URL in Google Console
2. **invalid_client**: Verify Client ID and Secret
3. **Token decode errors**: Check JWT secret
4. **User not found**: Check database connection and User model

### Debug Steps
1. Check server logs for errors
2. Verify environment variables
3. Test Google OAuth flow manually
4. Check browser console for frontend errors

## 📝 Notes
- Google users don't need passwords
- Users are automatically assigned 'student' role
- JWT tokens expire in 7 days
- Frontend handles token storage and user state
- Google Sign-In works on both login and register pages
- Same OAuth flow for both pages - Google handles new vs existing users 