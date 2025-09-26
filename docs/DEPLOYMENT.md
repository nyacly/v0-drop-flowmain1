# DropFlow Deployment Guide 🚀

Complete guide for deploying DropFlow to production environments.

## 🏗️ Architecture Overview

\`\`\`
Frontend (React Native/Expo Web)
    ↓
Backend API (Express.js + PostgreSQL)
    ↓
External Services (Google Maps, Stripe, Email)
\`\`\`

## 🌐 Deployment Platforms

### Option 1: Replit (Recommended for Beginners)

**Advantages:**
- Pre-configured PostgreSQL database
- Built-in secrets management
- Automatic HTTPS certificates
- Easy domain configuration
- Zero-config deployment

**Setup Steps:**

1. **Fork to Replit:**
   \`\`\`bash
   # Import GitHub repository to Replit
   # Or use Replit's GitHub integration
   \`\`\`

2. **Configure Secrets:**
   \`\`\`bash
   # In Replit's Secrets tab, add:
   GOOGLE_MAPS_API_KEY=your_api_key
   STRIPE_SECRET_KEY=sk_live_...
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_PRICE_ID_MONTHLY_AUD=price_...
   STRIPE_PRICE_ID_YEARLY_AUD=price_...
   SESSION_SECRET=your_session_secret
   \`\`\`

3. **Database Setup:**
   \`\`\`bash
   # Database is auto-provisioned
   # Run migrations:
   npm run db:push
   npm run db:seed  # Optional: add test data
   \`\`\`

4. **Start Application:**
   \`\`\`bash
   # Backend runs on port 8000
   # Frontend runs on port 5000
   # Both are automatically configured
   \`\`\`

---

### Option 2: Vercel + Railway

**Frontend (Vercel):**
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
vercel --prod

# Configure environment variables in Vercel dashboard
\`\`\`

**Backend + Database (Railway):**
\`\`\`bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway link  # Link to existing project or create new
railway deploy

# Add environment variables via Railway dashboard
\`\`\`

---

### Option 3: Docker Deployment

**Dockerfile:**
\`\`\`dockerfile
# Use Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose ports
EXPOSE 5000 8000

# Start both servers
CMD ["npm", "run", "start:prod"]
\`\`\`

**Docker Compose:**
\`\`\`yaml
version: '3.8'

services:
  dropflow:
    build: .
    ports:
      - "5000:5000"
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/dropflow
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=dropflow
      - POSTGRES_USER=dropflow
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
\`\`\`

**Deploy Commands:**
\`\`\`bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale dropflow=3
\`\`\`

---

## 🔧 Environment Configuration

### Production Environment Variables

Create a `.env.production` file:

\`\`\`env
# === CORE CONFIGURATION ===
NODE_ENV=production
PORT=8000
EXPO_PUBLIC_API_URL=https://api.yourdomain.com

# === DATABASE ===
DATABASE_URL=postgresql://user:password@host:port/database
# For Supabase: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# === AUTHENTICATION ===
SESSION_SECRET=your_super_secure_session_secret_32_chars_min
ADMIN_SECRET=your_admin_secret_for_testing_features

# === GOOGLE MAPS ===
GOOGLE_MAPS_API_KEY=AIza_your_production_google_maps_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza_your_production_google_maps_key

# === STRIPE PAYMENTS ===
STRIPE_SECRET_KEY=sk_live_your_production_stripe_secret_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_stripe_publishable_key
STRIPE_PRICE_ID_MONTHLY_AUD=price_your_monthly_price_id
STRIPE_PRICE_ID_YEARLY_AUD=price_your_yearly_price_id  
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# === EMAIL SERVICE ===
# Option 1: Continue using Replit Mail (if on Replit)
# No additional config needed

# Option 2: SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# === SECURITY ===
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# === MONITORING ===
SENTRY_DSN=https://your_sentry_dsn  # Optional: Error tracking
LOG_LEVEL=info
\`\`\`

---

## 🗄️ Database Migration

### PostgreSQL Setup

**Option A: Managed Database (Recommended)**
- **Supabase**: Free tier available, excellent for startups
- **Railway**: Simple PostgreSQL deployment
- **AWS RDS**: Enterprise-grade with backups
- **Google Cloud SQL**: Global scale with automatic backups

**Option B: Self-Hosted**
\`\`\`bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb dropflow
sudo -u postgres createuser --interactive

# Apply schema
npm run db:push

# Seed data (optional)
npm run db:seed
\`\`\`

### Migration Commands

\`\`\`bash
# Production migration workflow
npm run db:push --force     # Apply schema changes
npm run db:seed:production  # Add essential data only

# Backup before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore if needed
psql $DATABASE_URL < backup_file.sql
\`\`\`

---

## 🔒 Security Checklist

### SSL/TLS Configuration
- [ ] Enable HTTPS only (no HTTP)
- [ ] Use strong SSL certificates
- [ ] Set secure cookie flags
- [ ] Enable HSTS headers

### API Security
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection
- [ ] Authentication on protected routes

### Environment Security
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API keys properly scoped
- [ ] Admin endpoints protected
- [ ] Webhook signature verification

### Code Security
\`\`\`javascript
// Example security middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5000'],
  credentials: true
}));

// Rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
}));
\`\`\`

---

## 📊 Monitoring & Logging

### Error Tracking
\`\`\`bash
# Install Sentry for error tracking
npm install @sentry/node @sentry/tracing

# Configure in server
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
\`\`\`

### Health Monitoring
\`\`\`javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    // Check external APIs
    const googleMapsHealthy = await checkGoogleMapsAPI();
    const stripeHealthy = await checkStripeAPI();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        googleMaps: googleMapsHealthy ? 'healthy' : 'degraded',
        stripe: stripeHealthy ? 'healthy' : 'degraded'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
\`\`\`

### Log Management
\`\`\`javascript
// Structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
\`\`\`

---

## 🚀 Performance Optimization

### Frontend Optimization
\`\`\`bash
# Enable production optimizations
EXPO_PUBLIC_NODE_ENV=production

# Bundle optimization
npx expo export --platform web
npx expo build:web

# CDN for static assets
# Configure CDN to serve /static/* files
\`\`\`

### Backend Optimization
\`\`\`javascript
// Compression middleware
const compression = require('compression');
app.use(compression());

// Response caching
const apicache = require('apicache');
app.use('/api/config', apicache.middleware('1 hour'));

// Database connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
\`\`\`

### Database Optimization
\`\`\`sql
-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_delivery_routes_user_id ON delivery_routes(user_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Optimize queries
VACUUM ANALYZE users;
VACUUM ANALYZE delivery_routes;
\`\`\`

---

## 🔄 Continuous Deployment

### GitHub Actions Workflow

`.github/workflows/deploy.yml`:
\`\`\`yaml
name: Deploy DropFlow

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Check TypeScript
      run: npm run type-check
      
    - name: Lint code
      run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        # Deploy to your chosen platform
        # Example for Vercel:
        npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
\`\`\`

---

## 📱 Mobile App Deployment

### iOS App Store
\`\`\`bash
# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
\`\`\`

### Google Play Store
\`\`\`bash
# Build for Android
eas build --platform android --profile production

# Submit to Play Store  
eas submit --platform android --profile production
\`\`\`

### Web Progressive App
\`\`\`bash
# Build web version
npx expo export --platform web

# Deploy to CDN or hosting platform
# Configure service worker for offline support
\`\`\`

---

## 🆘 Troubleshooting

### Common Deployment Issues

**Database Connection Errors:**
\`\`\`bash
# Check connection string format
# PostgreSQL: postgresql://user:pass@host:port/db
# Add connection pooling for high traffic

# Test connection
npx tsx -e "
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(console.log).catch(console.error);
"
\`\`\`

**CORS Issues:**
\`\`\`javascript
// Update CORS configuration for production domains
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    // Add all your production domains
  ],
  credentials: true
}));
\`\`\`

**Environment Variable Issues:**
\`\`\`bash
# Debug environment loading
node -e "console.log(process.env)" | grep -E "(GOOGLE|STRIPE|DATABASE)"

# Verify all required variables are set
npm run env:check
\`\`\`

**Google Maps API Issues:**
- Verify API key restrictions
- Check billing account status  
- Ensure required APIs are enabled:
  - Maps JavaScript API
  - Geocoding API
  - Directions API

**Stripe Integration Issues:**
- Verify webhook endpoint URL
- Check webhook signing secret
- Test payment flow in Stripe dashboard

### Performance Issues
\`\`\`bash
# Monitor application performance
npm install clinic
clinic doctor -- node server/index.js

# Database performance
EXPLAIN ANALYZE SELECT * FROM delivery_routes WHERE user_id = $1;
\`\`\`

---

## 📋 Post-Deployment Checklist

### Functional Testing
- [ ] User registration and email verification
- [ ] Login and session management
- [ ] Route optimization with real addresses
- [ ] Subscription flow (test mode)
- [ ] Google Maps integration
- [ ] Mobile responsive design
- [ ] Password reset functionality

### Performance Testing
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] Database query optimization
- [ ] CDN configuration for static assets
- [ ] Mobile app performance

### Security Testing
- [ ] SSL certificate valid and configured
- [ ] HTTPS redirect working
- [ ] Rate limiting active
- [ ] CORS configured correctly
- [ ] Authentication protecting sensitive routes
- [ ] Input validation working
- [ ] SQL injection protection

### Monitoring Setup
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Log aggregation working
- [ ] Database monitoring setup
- [ ] Uptime monitoring configured
- [ ] Alert thresholds configured

---

## 🔄 Maintenance

### Regular Tasks
- [ ] Monitor application logs
- [ ] Review performance metrics
- [ ] Update dependencies monthly
- [ ] Backup database weekly
- [ ] Review security alerts
- [ ] Test disaster recovery procedures

### Updates
\`\`\`bash
# Update dependencies
npm update
npm audit fix

# Update database schema
npm run db:push

# Deploy updates
git push origin main  # Triggers CI/CD
\`\`\`

---

**Your DropFlow app is now ready for production!** 🚛🎉

For ongoing support and updates, monitor the GitHub repository and check the documentation regularly.
