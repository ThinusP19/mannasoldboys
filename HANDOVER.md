# Alumni Connect Hub - Handover Documentation

> **Version:** 1.1.0
> **Last Updated:** February 2026

## Project Overview

Alumni Connect Hub is a comprehensive platform for Potch Gim alumni to connect, view profiles, participate in reunions, and stay updated with school activities. The platform consists of:

- **Backend API** (Node.js/Express with SQL Server)
- **Web Frontend** (React with Vite)
- **Mobile App** (React Native with Expo)

## Related Documentation

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Quick start and project overview |
| [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | Production server deployment |
| [docs/APP_STORE_GUIDE.md](./docs/APP_STORE_GUIDE.md) | iOS App Store submission |
| [docs/PLAY_STORE_GUIDE.md](./docs/PLAY_STORE_GUIDE.md) | Google Play Store submission |
| [docs/PRODUCTION_CHECKLIST.md](./docs/PRODUCTION_CHECKLIST.md) | Pre-launch verification checklist |

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- SQL Server database (local or remote)
- For mobile development: Expo Go app on your phone

### 1. Backend Setup

```bash
cd server
npm install

# Copy environment template and fill in your values
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# Start development server
npm run dev
```

The backend will run on `http://localhost:3001`

### 2. Web Frontend Setup

```bash
# From project root
npm install

# Start development server
npm run dev
```

The web app will run on `http://localhost:3000`

### 3. Mobile App Setup

```bash
cd apps/mobile
npm install

# Start Expo development server
npx expo start
```

Scan the QR code with Expo Go app on your phone.

---

## Environment Variables

### Backend (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` or `production` |
| `DB_HOST` | SQL Server host | `192.168.1.100` |
| `DB_PORT` | SQL Server port | `1433` |
| `DB_NAME` | Database name | `potch_gim_alumni_db` |
| `DB_USER` | Database username | `your_username` |
| `DB_PASS` | Database password | `your_password` |
| `JWT_SECRET` | JWT signing secret (64+ chars) | Generate with `openssl rand -base64 64` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:3000` |

### Root `.env` (Web Frontend)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001/api` |

---

## Mobile App Configuration

### Changing API URL for Production

The mobile app API URL is configured in `apps/mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:3001/api"
    }
  }
}
```

**To change for production:**

1. Open `apps/mobile/app.json`
2. Change `extra.apiUrl` to your production server URL:
   ```json
   "apiUrl": "https://your-production-server.com/api"
   ```
3. Rebuild the app

### Building for Production

```bash
cd apps/mobile

# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project (first time only)
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## Deployment

### Docker Deployment

The project includes Docker configuration for easy deployment:

```bash
# Build and start all services
docker-compose up --build

# For production
docker-compose -f docker-compose.prod.yml up --build -d
```

### Manual Deployment

1. **Backend:**
   ```bash
   cd server
   npm run build
   npm start
   ```

2. **Web Frontend:**
   ```bash
   npm run build
   # Deploy dist/ folder to your static hosting
   ```

---

## App Store Submission (Owner Tasks)

### iOS (App Store)

1. **Apple Developer Account** ($99/year)
   - Register at https://developer.apple.com
   - Enroll in Apple Developer Program

2. **Build & Submit:**
   ```bash
   cd apps/mobile
   eas build --platform ios --profile production
   eas submit --platform ios
   ```

3. **App Store Connect:**
   - Add app metadata, screenshots, descriptions
   - Submit for review

### Android (Play Store)

1. **Google Play Developer Account** ($25 one-time)
   - Register at https://play.google.com/console

2. **Build & Submit:**
   ```bash
   cd apps/mobile
   eas build --platform android --profile production
   eas submit --platform android
   ```

3. **Play Console:**
   - Complete store listing
   - Upload screenshots and descriptions
   - Submit for review

---

## Project Structure

```
alumni-connect-hub/
├── apps/
│   └── mobile/           # React Native Expo app
│       ├── app/          # Expo Router pages
│       ├── src/
│       │   ├── components/
│       │   ├── contexts/
│       │   ├── hooks/
│       │   ├── services/
│       │   └── theme/
│       └── app.json      # Expo configuration
├── server/               # Backend API
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── .env.example
├── src/                  # Web frontend
│   ├── components/
│   ├── pages/
│   └── services/
├── docker-compose.yml
└── package.json
```

---

## Key Features

### Implemented

- [x] User registration and authentication
- [x] Profile management with photo upload
- [x] Alumni directory with search
- [x] Year group browsing
- [x] Reunion registration
- [x] Push notification infrastructure (mobile)
- [x] Password change
- [x] Dark mode toggle

### Mobile-Specific Features

- [x] Expo Router navigation
- [x] Secure token storage
- [x] Image picker for profile photos
- [x] Push notification support
- [x] Pull-to-refresh

---

## Known Limitations

1. **Push Notifications**: Work only on physical devices, not simulators
2. **Image Upload**: Large images may take time to upload
3. **Offline Mode**: Not implemented - requires internet connection

---

## Testing

### Backend Tests

```bash
cd server
npm test
```

### Web Frontend Tests

```bash
npm test
```

### Mobile Testing

Use Expo Go app on physical device for best results:
```bash
cd apps/mobile
npx expo start
# Scan QR code with Expo Go
```

---

## Security Notes

1. **Never commit `.env` files** - They contain sensitive credentials
2. **JWT Secret**: Must be at least 64 characters for security
3. **CORS**: In production, only allow your actual domains
4. **Database**: Use strong passwords and limit network access

---

## Support & Maintenance

For issues or feature requests:
1. Check existing documentation in this file
2. Review code comments for implementation details
3. Contact the development team

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | Feb 2026 | Added deployment guides, app store guides, production checklist |
| 1.0.0 | Feb 2026 | Initial release |

---

## Next Steps for New Team

1. **Development Setup**
   - Follow the Quick Start section above
   - Verify all three apps run locally

2. **Production Deployment**
   - Review [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)
   - Configure production environment
   - Deploy using Docker or manual process

3. **App Store Releases**
   - iOS: Follow [APP_STORE_GUIDE.md](./docs/APP_STORE_GUIDE.md)
   - Android: Follow [PLAY_STORE_GUIDE.md](./docs/PLAY_STORE_GUIDE.md)

4. **Pre-Launch**
   - Complete [PRODUCTION_CHECKLIST.md](./docs/PRODUCTION_CHECKLIST.md)

---

*This documentation was prepared for project handover. Please ensure all environment variables are properly configured before deployment.*
