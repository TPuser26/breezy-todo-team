# Deployment Guide

## Production Deployment Configuration

### Environment Variables Required

For any production deployment (Render, Railway, Vercel, etc.), set these environment variables:

```bash
# Database
DATABASE_URL=your_postgresql_connection_string

# Session Security
SESSION_SECRET=your_very_long_random_secret_key_at_least_32_characters

# Environment
NODE_ENV=production

# Platform-specific (choose one)
RENDER=true                    # For Render deployments
RAILWAY=true                  # For Railway deployments
REPLIT_DEPLOYMENT=true        # For Replit deployments
```

### Platform-Specific Instructions

#### 1. Render Deployment

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18 or higher

4. Add Environment Variables:
   ```bash
   DATABASE_URL=your_postgresql_url
   SESSION_SECRET=your_secret_key
   NODE_ENV=production
   RENDER=true
   ```

5. Deploy and test authentication flow

#### 2. Railway Deployment

1. Connect your GitHub repository to Railway
2. Add Environment Variables:
   ```bash
   DATABASE_URL=your_postgresql_url
   SESSION_SECRET=your_secret_key
   NODE_ENV=production
   RAILWAY=true
   ```

3. Deploy and test authentication flow

#### 3. Replit Deployment

1. Ensure environment variables are set in Replit Secrets:
   ```bash
   DATABASE_URL=your_postgresql_url
   SESSION_SECRET=your_secret_key
   NODE_ENV=production
   REPLIT_DEPLOYMENT=true
   ```

2. Use the "Deploy" button in Replit

### Database Setup

1. Create a PostgreSQL database on your preferred provider:
   - **Neon** (recommended): Free tier available
   - **Supabase**: Free tier available
   - **Railway**: Integrated PostgreSQL
   - **Render**: PostgreSQL add-on

2. Get the connection string (DATABASE_URL)

3. The application will automatically create the necessary tables including:
   - users
   - tasks
   - teams
   - team_members
   - notifications
   - comments
   - user_sessions (for session persistence)

### Session Security

The application uses PostgreSQL-based session storage for production deployments. This ensures:
- Session persistence across server restarts
- Proper authentication in distributed environments
- Secure session management in production

### Troubleshooting Authentication Issues

If you experience "Authentication required" errors after login:

1. Check that SESSION_SECRET is set and is at least 32 characters
2. Verify DATABASE_URL is correctly configured
3. Ensure the correct platform environment variable is set (RENDER=true, etc.)
4. Check that cookies are being set correctly in browser dev tools

### Security Notes

- Always use HTTPS in production
- Set a strong SESSION_SECRET (32+ random characters)
- Database connections are encrypted by default
- Sessions expire after 7 days
- Passwords are hashed with bcrypt

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Production start
npm start
```