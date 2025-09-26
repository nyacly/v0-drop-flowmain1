# DropFlow Setup Guide 🚛

Complete setup instructions for running DropFlow locally and deploying to production.

## 📋 Prerequisites

Before setting up DropFlow, ensure you have:

- **Node.js 18+** with npm
- **PostgreSQL database** (local or cloud)
- **Google Maps API account**
- **Stripe account** (for payments)
- **Email service** (Replit Mail or SMTP)

## 🚀 Quick Start

### 1. Clone & Install

\`\`\`bash
git clone https://github.com/your-username/DropFlow.git
cd DropFlow
npm install
\`\`\`

### 2. Environment Configuration

Copy the environment template:

\`\`\`bash
cp .env.example .env
\`\`\`

Fill in your API keys and configuration in `.env` (see [Environment Variables](#environment-variables) section below).

### 3. Database Setup

#### Option A: Use Provided Seed Data
\`\`\`bash
# Push database schema
npm run db:push

# Seed with sample data
npm run db:seed
\`\`\`

#### Option B: Start Fresh
\`\`\`bash
# Push database schema only
npm run db:push
\`\`\`

### 4. Start Development Servers

**Terminal 1 - Backend:**
\`\`\`bash
cd server
node index.js
\`\`\`

**Terminal 2 - Frontend:**
\`\`\`bash
npx expo start --web --port 5000
\`\`\`

### 5. Access the Application

- **Web**: http://localhost:5000
- **Mobile**: Scan QR code with Expo Go app

---

## 📁 Project Structure

\`\`\`
DropFlow/
├── app/                    # React Native screens & components
│   ├── (tabs)/            # Tab navigation
│   ├── auth.tsx           # Authentication screen
│   ├── onboarding.tsx     # User onboarding
│   └── _layout.tsx        # App layout & navigation
├── server/                # Express.js backend
│   ├── index.js          # Main server file
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   └── replitmail.ts     # Email service
├── shared/               # Shared schemas & types
│   └── schema.ts         # Database schema
├── hooks/                # Custom React hooks
├── contexts/             # React context providers
├── theme/                # UI theme system
├── seed/                 # Database seed files
└── docs/                 # Additional documentation
\`\`\`

---

## 🔧 Environment Variables

### Required Variables

Create a `.env` file with these variables:

#### Database
\`\`\`env
DATABASE_URL=postgresql://username:password@localhost:5432/dropflow
\`\`\`

#### Authentication
\`\`\`env
SESSION_SECRET=your-super-secret-session-key-here
ADMIN_SECRET=your-admin-secret-for-testing
\`\`\`

#### Google Maps API
\`\`\`env
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
\`\`\`

#### Stripe Payments
\`\`\`env
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_PRICE_ID_MONTHLY_AUD=price_your-monthly-price-id
STRIPE_PRICE_ID_YEARLY_AUD=price_your-yearly-price-id
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
\`\`\`

#### API Configuration
\`\`\`env
EXPO_PUBLIC_API_URL=http://localhost:8000
\`\`\`

### Getting API Keys

#### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Maps JavaScript API
   - Geocoding API  
   - Directions API
4. Create credentials → API Key
5. Restrict key to your domains

#### Stripe Setup
1. Create account at [stripe.com](https://stripe.com)
2. Go to Developers → API Keys
3. Copy publishable and secret keys
4. Create Products:
   - **Pro Monthly**: $4.99 AUD/month
   - **Pro Yearly**: $49.99 AUD/year (17% discount)
5. Copy Price IDs from Products section

---

## 🗄️ Database Schema

DropFlow uses PostgreSQL with Drizzle ORM. The schema includes:

### Tables
- **users**: User accounts and authentication
- **delivery_routes**: Saved route optimizations
- **user_sessions**: Session management

### Key Features
- Email-based authentication with verification
- Subscription management integration
- Route data persistence
- Session-based security

### Database Commands

\`\`\`bash
# View current schema
npm run db:introspect

# Push schema changes
npm run db:push

# Generate migrations (if needed)
npm run db:generate

# Reset database (destructive)
npm run db:reset
\`\`\`

---

## 🧪 Seed Data

The project includes realistic seed data for testing:

### Included Data
- **Test Users**: Pre-verified accounts for testing
- **Sample Routes**: Realistic delivery addresses in Brisbane, Australia
- **Subscription Plans**: Test subscription configurations

### Seeding Commands

\`\`\`bash
# Seed all data
npm run db:seed

# Seed specific datasets
npm run seed:users
npm run seed:routes
npm run seed:test-data
\`\`\`

### Test Accounts

After seeding, you can use these accounts:

**Driver Account:**
- Email: `driver@dropflow.com`
- Password: `driver123`
- Role: Regular user with some test routes

**Admin Account:**
- Email: `admin@dropflow.com`  
- Password: `admin123`
- Role: Admin access for testing Pro features

---

## 🔐 Authentication Flow

DropFlow implements a complete email-based authentication system:

1. **Sign Up**: User registers with email/password
2. **Email Verification**: 6-digit code sent via email
3. **Login**: Session-based authentication
4. **Session Management**: Secure cookie-based sessions
5. **Password Reset**: Email-based password recovery

### Authentication Features
- ✅ Email verification required
- ✅ Secure password hashing (scrypt)
- ✅ Session-based auth with PostgreSQL storage
- ✅ CSRF protection
- ✅ Rate limiting on auth endpoints

---

## 💳 Subscription System

### Subscription Plans

**Free Tier:**
- Up to 10 delivery stops per route
- Basic route optimization
- Standard support

**Pro Monthly ($4.99 AUD/month):**
- Unlimited delivery stops
- Advanced route optimization
- Priority support
- 7-day free trial

**Pro Yearly ($49.99 AUD/year):**
- All Pro Monthly features
- 17% cost savings
- 7-day free trial

### Subscription Flow
1. User selects plan in app
2. Stripe Checkout handles payment
3. Webhook confirms payment
4. User access level updated
5. Pro features unlocked

---

## 🗺️ Route Optimization

DropFlow uses Google Maps APIs for intelligent route optimization:

### Features
- **Real-time traffic data** integration
- **Multi-stop optimization** using Google's algorithms
- **Fuel cost calculations** based on vehicle settings
- **ETA predictions** for each delivery stop
- **Turn-by-turn navigation** integration

### Optimization Process
1. Import addresses (text input or CSV)
2. Geocode addresses using Google Maps
3. Calculate optimal route order
4. Consider current traffic patterns
5. Generate navigation instructions
6. Provide fuel cost estimates

---

## 📱 Mobile App Features

### Core Functionality
- **Address Import**: Manual entry or CSV upload
- **Route Planning**: Drag-and-drop stop reordering
- **Navigation**: Integrated maps with turn-by-turn
- **Proof of Delivery**: Photo capture and notes
- **Offline Support**: Cached routes work offline

### UI/UX Features  
- **Dark/Light Mode**: Automatic theme switching
- **Responsive Design**: Works on all screen sizes
- **Gesture Navigation**: Intuitive mobile interactions
- **Error Handling**: User-friendly error messages

---

## 🚀 Deployment

### Production Checklist

#### Environment Setup
- [ ] Set production environment variables
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure CORS for production domains

#### Security
- [ ] Enable rate limiting
- [ ] Set secure session cookies
- [ ] Configure CSP headers
- [ ] Enable HTTPS only

#### Services
- [ ] Set up production Stripe webhooks
- [ ] Configure email service (SMTP)
- [ ] Set up error monitoring
- [ ] Configure backup systems

### Deployment Platforms

#### Replit (Recommended)
- Pre-configured with PostgreSQL
- Built-in secrets management
- Automatic HTTPS
- Easy domain configuration

#### Vercel + Railway
- Frontend on Vercel
- Backend + database on Railway
- Serverless scaling
- Global CDN

#### Docker Deployment
\`\`\`dockerfile
# Use provided Dockerfile
docker build -t dropflow .
docker run -p 5000:5000 -p 8000:8000 dropflow
\`\`\`

---

## 🔧 Development

### Development Scripts

\`\`\`bash
# Development servers
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Frontend only (port 5000)  
npm run dev:backend      # Backend only (port 8000)

# Database management
npm run db:push          # Sync schema to database
npm run db:seed          # Populate with test data
npm run db:reset         # Reset database (destructive)
npm run db:studio        # Open Drizzle Studio (database GUI)

# Code quality
npm run lint             # ESLint code checking
npm run type-check       # TypeScript validation
npm run test             # Run test suite

# Building
npm run build            # Build for production
npm run build:web        # Web build only
npm run build:mobile     # Mobile build only
\`\`\`

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with React Native rules
- **Prettier**: Consistent code formatting
- **File Structure**: Feature-based organization

---

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
\`\`\`bash
# Check database connection
npm run db:ping

# Reset if corrupted
npm run db:reset
npm run db:seed
\`\`\`

#### Google Maps API
- Verify API key is valid
- Check API restrictions
- Ensure billing is enabled
- Confirm required APIs are enabled

#### Stripe Integration
- Verify webhook endpoints
- Check API key permissions
- Confirm product/price IDs
- Test in Stripe dashboard

#### Email Delivery
- Check SMTP configuration
- Verify sender reputation
- Test email templates
- Check spam filters

### Debug Mode

Enable debug logging:

\`\`\`env
DEBUG=dropflow:*
NODE_ENV=development
EXPO_DEBUG=1
\`\`\`

### Getting Help

1. **Check logs**: Server logs contain detailed error info
2. **Database GUI**: Use `npm run db:studio` to inspect data
3. **API Testing**: Use provided Postman collection
4. **GitHub Issues**: Report bugs with full error logs

---

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Follow code style guidelines
4. Add tests for new features
5. Submit pull request

### Code Guidelines
- Use TypeScript for all new code
- Follow existing file structure
- Add JSDoc comments for functions
- Write tests for business logic
- Update documentation for API changes

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Resources

- [Google Maps APIs Documentation](https://developers.google.com/maps/documentation)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

**Ready to optimize delivery routes!** 🚛✨

For additional help, check the `docs/` directory or open an issue on GitHub.
