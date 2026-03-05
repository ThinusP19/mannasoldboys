# Potch Gim Alumni Connect

A comprehensive alumni platform for Potch Gim (Potchefstroom Gimnasium), enabling alumni to connect, view profiles, participate in reunions, and stay updated with school activities.

## Platform Overview

This monorepo contains three interconnected applications:

| App | Description | Tech Stack |
|-----|-------------|------------|
| **Web Frontend** | Alumni portal website | React, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Mobile App** | iOS & Android app | React Native, Expo, Expo Router |
| **Backend API** | REST API server | Node.js, Express, SQL Server |

## Quick Start

### Prerequisites

- Node.js 18+ ([install with nvm](https://github.com/nvm-sh/nvm))
- SQL Server database (local or remote)
- For mobile: [Expo Go](https://expo.dev/client) app on your phone

### 1. Backend API

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

Backend runs at `http://localhost:3001`

### 2. Web Frontend

```bash
# From project root
npm install
npm run dev
```

Web app runs at `http://localhost:3000`

### 3. Mobile App

```bash
cd apps/mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

## Project Structure

```
alumni-connect-hub/
├── apps/
│   └── mobile/                 # React Native Expo app
│       ├── app/                # Expo Router screens
│       │   ├── (auth)/         # Auth screens (login, register)
│       │   └── (tabs)/         # Main app tabs
│       ├── src/
│       │   ├── components/     # Reusable UI components
│       │   ├── contexts/       # React contexts (Auth, Theme)
│       │   ├── hooks/          # Custom hooks
│       │   ├── services/       # API service layer
│       │   └── theme/          # Colors, typography
│       ├── assets/             # Images, fonts, icons
│       ├── app.json            # Expo configuration
│       └── eas.json            # EAS Build configuration
│
├── server/                     # Backend API
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── models/             # Data models
│   │   ├── routes/             # API route definitions
│   │   └── services/           # Business logic
│   ├── .env.example            # Environment template
│   └── Dockerfile              # Container build
│
├── src/                        # Web frontend
│   ├── components/             # React components
│   │   └── ui/                 # shadcn/ui components
│   ├── pages/                  # Page components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities
│   └── services/               # API service layer
│
├── docs/                       # Documentation
│   ├── DEPLOYMENT_GUIDE.md     # Production deployment
│   ├── APP_STORE_GUIDE.md      # iOS submission
│   ├── PLAY_STORE_GUIDE.md     # Android submission
│   └── PRODUCTION_CHECKLIST.md # Pre-launch checklist
│
├── docker-compose.yml          # Development containers
├── docker-compose.prod.yml     # Production containers
└── HANDOVER.md                 # Detailed handover docs
```

## Features

### Core Features
- User registration and authentication (JWT-based)
- Alumni profile management with photo upload
- Alumni directory with search and filtering
- Year group browsing
- Reunion event registration
- Dark mode support

### Mobile-Specific
- Push notifications
- Secure token storage
- Camera/gallery integration for photos
- Pull-to-refresh

## Environment Variables

### Backend (`server/.env`)

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=1433
DB_NAME=potch_gim_alumni_db
DB_USER=your_username
DB_PASS=your_password
JWT_SECRET=generate-64-char-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

Generate a secure JWT secret:
```bash
openssl rand -base64 64
```

### Web Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3001/api
```

### Mobile (`apps/mobile/app.json`)

The API URL is configured in `expo.extra.apiUrl`. Update this for production.

## Documentation

| Document | Description |
|----------|-------------|
| [HANDOVER.md](./HANDOVER.md) | Complete handover documentation |
| [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | Production deployment guide |
| [docs/APP_STORE_GUIDE.md](./docs/APP_STORE_GUIDE.md) | iOS App Store submission |
| [docs/PLAY_STORE_GUIDE.md](./docs/PLAY_STORE_GUIDE.md) | Google Play Store submission |
| [docs/PRODUCTION_CHECKLIST.md](./docs/PRODUCTION_CHECKLIST.md) | Pre-launch verification |

## Development

### Running Tests

```bash
# Backend tests
cd server && npm test

# Web frontend tests
npm test

# E2E tests
npm run test:e2e
```

### Code Style

- ESLint for linting
- Prettier for formatting
- TypeScript strict mode

### Building for Production

```bash
# Web frontend
npm run build

# Mobile (requires EAS CLI)
cd apps/mobile
eas build --platform ios
eas build --platform android
```

## Deployment

### Docker (Recommended)

```bash
# Development
docker-compose up --build

# Production
docker-compose -f docker-compose.prod.yml up --build -d
```

### Manual Deployment

See [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

## Security Notes

- Never commit `.env` files
- JWT secret must be 64+ characters
- Configure CORS for your production domains only
- Use HTTPS in production
- Keep dependencies updated

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Private - Potch Gim Alumni Association

---

*For detailed setup and deployment instructions, see [HANDOVER.md](./HANDOVER.md)*
