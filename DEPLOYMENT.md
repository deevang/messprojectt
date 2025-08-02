# 🚀 Deployment Guide - Mess Management System

## 📋 Prerequisites

Before deploying, ensure you have:
- [ ] MongoDB Atlas account (or local MongoDB)
- [ ] GitHub repository
- [ ] Environment variables ready
- [ ] Domain name (optional)

---

## 🔧 Environment Setup

### 1. Create Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mess_management

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Email Configuration (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# CORS Configuration
CLIENT_URL=https://your-frontend-domain.com
```

### 2. Update API Configuration

Update `client/src/services/api.js` to use production API URL:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

---

## 🌐 Deployment Options

### Option 1: Render (Recommended - Free Tier)

#### Backend Deployment:
1. **Sign up at [Render.com](https://render.com)**
2. **Create New Web Service**
3. **Connect your GitHub repository**
4. **Configure:**
   - **Name**: `mess-management-api`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free

5. **Add Environment Variables:**
   - `MONGO_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `EMAIL_USER` (optional)
   - `EMAIL_PASS` (optional)

#### Frontend Deployment:
1. **Create New Static Site**
2. **Configure:**
   - **Name**: `mess-management-client`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`

3. **Add Environment Variable:**
   - `VITE_API_URL=https://your-backend-url.onrender.com`

### Option 2: Vercel + Railway

#### Frontend (Vercel):
1. **Sign up at [Vercel.com](https://vercel.com)**
2. **Import your GitHub repository**
3. **Configure:**
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variable:**
   - `VITE_API_URL=https://your-backend-url.railway.app`

#### Backend (Railway):
1. **Sign up at [Railway.app](https://railway.app)**
2. **Deploy from GitHub**
3. **Configure:**
   - **Root Directory**: `server`
   - **Start Command**: `npm start`

4. **Add Environment Variables** (same as Render)

### Option 3: Heroku

1. **Install Heroku CLI**
2. **Login to Heroku:**
   ```bash
   heroku login
   ```

3. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

4. **Add MongoDB addon:**
   ```bash
   heroku addons:create mongolab:sandbox
   ```

5. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_secret_key
   heroku config:set EMAIL_USER=your_email@gmail.com
   heroku config:set EMAIL_PASS=your_app_password
   ```

6. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

---

## 🗄️ Database Setup

### MongoDB Atlas (Recommended):

1. **Create MongoDB Atlas account**
2. **Create a new cluster**
3. **Get connection string**
4. **Add your IP to whitelist**
5. **Create database user**

### Connection String Format:
```
mongodb+srv://username:password@cluster.mongodb.net/mess_management?retryWrites=true&w=majority
```

---

## 🔒 Security Checklist

- [ ] **JWT Secret**: Use a strong, random secret
- [ ] **MongoDB**: Enable authentication
- [ ] **CORS**: Configure allowed origins
- [ ] **Environment Variables**: Never commit to Git
- [ ] **HTTPS**: Enable SSL certificates
- [ ] **Rate Limiting**: Implement API rate limits

---

## 🧪 Testing Deployment

### 1. Health Check
```bash
curl https://your-api-url.com/api/health
```

### 2. Test API Endpoints
```bash
# Test registration
curl -X POST https://your-api-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Frontend Testing
- Visit your frontend URL
- Test user registration/login
- Test meal booking functionality
- Test payment flow

---

## 🐛 Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Update CORS configuration in server
   - Check allowed origins

2. **MongoDB Connection:**
   - Verify connection string
   - Check IP whitelist
   - Verify database credentials

3. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

4. **Environment Variables:**
   - Ensure all required variables are set
   - Check variable names (case-sensitive)
   - Verify no extra spaces

---

## 📊 Monitoring

### Recommended Tools:
- **Uptime Monitoring**: UptimeRobot
- **Error Tracking**: Sentry
- **Performance**: New Relic
- **Logs**: Papertrail

---

## 🔄 CI/CD Setup

### GitHub Actions Example:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v1
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

---

## 📞 Support

If you encounter issues:
1. Check the logs in your deployment platform
2. Verify environment variables
3. Test locally first
4. Check MongoDB connection
5. Review CORS configuration

---

## 🎉 Success!

Once deployed, your Mess Management System will be available at:
- **Frontend**: `https://your-frontend-url.com`
- **Backend API**: `https://your-backend-url.com`

Remember to:
- Test all functionality thoroughly
- Monitor performance and errors
- Set up regular backups
- Keep dependencies updated 