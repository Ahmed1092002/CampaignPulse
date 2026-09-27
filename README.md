# CampaignPulse

A multi-tenant campaign analytics and lead-management platform for marketing teams. CampaignPulse enables marketers to create campaigns, publish public landing pages, collect leads, track visitor activity, and analyze campaign performance in real time.

## 🚀 Features

### Core Features
- **Multi-tenancy** - Complete workspace isolation with role-based access control (Admin, Marketer, Viewer)
- **Campaign Management** - Full lifecycle: Draft → Published → Paused → Archived
- **Landing Page Builder** - Drag-and-drop sections: Hero, Features, Testimonials, CTA, Lead Form
- **Public Landing Pages** - SEO-optimized with SSR/ISR, custom domains, QR codes, UTM tracking
- **Lead Management** - Dynamic forms, duplicate detection, status tracking (New → Won/Lost)
- **Real-time Analytics** - Visits, conversions, funnel, trends, source attribution
- **Real-time Updates** - Socket.IO for live lead notifications and dashboard updates
- **Background Jobs** - BullMQ workers for analytics, notifications, CRM webhooks
- **Audit Logging** - Track all important actions across workspaces
- **Internationalization** - English & Arabic with RTL/LTR support
- **Dark Mode** - Full dark mode support across the application

### Technical Features
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Prisma ORM
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query, Zustand
- **Real-time**: Socket.IO with JWT authentication
- **Background Jobs**: BullMQ with Redis for analytics, notifications, CRM webhooks
- **Authentication**: JWT access/refresh tokens with secure HTTP-only cookies
- **Rate Limiting**: Per-endpoint rate limiting for auth, forms, and tracking
- **API Documentation**: Swagger/OpenAPI auto-generated
- **Testing**: Vitest, React Testing Library, Supertest
- **CI/CD**: GitHub Actions with linting, type-checking, testing, and Docker builds

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache/Queue**: Redis 7+ with BullMQ
- **Real-time**: Socket.IO
- **Auth**: JWT (access/refresh tokens)
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI
- **Testing**: Vitest + Supertest

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (server), Zustand (client)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **i18n**: next-intl (EN/AR with RTL)
- **Testing**: Vitest + React Testing Library

## 🛠️ Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommended)

### Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd CampaignPulse

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services
docker-compose up -d

# Run database migrations and seed
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend npm run prisma:seed
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api-docs

### Manual Setup

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

## 🔐 Demo Accounts

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@campaignpulse.com | password123 |
| Marketer | marketer@campaignpulse.com | password123 |
| Viewer | viewer@campaignpulse.com | password123 |

## 📁 Project Structure

```
CampaignPulse/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration (env, prisma, redis, logger)
│   │   ├── middleware/       # Express middleware (auth, validation, error handling)
│   │   ├── utils/            # Utilities (helpers, errors, jwt, validators)
│   │   ├── types/            # TypeScript types
│   │   └── modules/          # Feature modules
│   │       ├── auth/         # Authentication
│   │       ├── users/        # User management
│   │       ├── workspaces/   # Workspace management
│   │       ├── workspace-members/ # Team management
│   │       ├── campaigns/    # Campaign CRUD
│   │       ├── landing-pages/ # Landing page builder
│   │       ├── leads/        # Lead management
│   │       ├── tracking/     # Event tracking
│   │       ├── analytics/    # Analytics & reporting
│   │       ├── notifications/ # Notifications
│   │       ├── audit-logs/   # Audit logging
│   │       ├── email/        # Email service + templates
│   │       └── jobs/         # Background jobs (BullMQ)
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Database seeding
│   └── tests/                # Backend tests
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── (auth)/       # Auth pages (login, register)
│   │   │   ├── (dashboard)/  # Protected dashboard pages
│   │   │   └── (public)/     # Public landing pages
│   │   ├── components/
│   │   │   ├── ui/           # Reusable UI components
│   │   │   ├── layout/       # Layout components (Sidebar, Header)
│   │   │   ├── dashboard/    # Dashboard widgets
│   │   │   ├── campaigns/    # Campaign components
│   │   │   └── landing-page/ # Landing page components
│   │   ├── lib/              # Utilities (api, i18n, utils)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand stores
│   │   ├── types/            # TypeScript types
│   │   ├── styles/           # Global styles
│   │   └── messages/         # i18n translations (en.json, ar.json)
│   └── public/               # Static assets
├── docker-compose.yml
└── README.md
```

## 🔑 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/campaignpulse
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=CampaignPulse
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test          # Run tests
npm run test:watch    # Watch mode

# Frontend tests
cd frontend
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:ui       # Visual test UI
```

## 📦 Building for Production

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build

# Or build with Docker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
```

## 🚀 Deployment

### Using Docker Compose (Production)
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Manual Deployment
1. Build both applications
2. Set production environment variables
3. Run database migrations: `npx prisma migrate deploy`
4. Start backend: `npm start`
5. Start frontend: `npm start` (Next.js standalone output)

## 📚 API Documentation

API documentation is available at `/api-docs` when running the backend (Swagger UI).

### Key Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh` |
| Workspaces | `GET/POST /api/workspaces`, `GET/PATCH/DELETE /api/workspaces/:id` |
| Members | `GET/POST /api/workspaces/:id/members`, `PATCH/DELETE /api/workspaces/:id/members/:memberId` |
| Campaigns | `GET/POST /api/workspaces/:id/campaigns`, `GET/PATCH/DELETE /api/workspaces/:id/campaigns/:id` |
| Landing Pages | `GET/PATCH /api/workspaces/:id/landing-pages/:campaignId` |
| Leads | `GET/POST /api/workspaces/:id/leads`, `GET/PATCH/DELETE /api/workspaces/:id/leads/:id` |
| Tracking | `POST /api/workspaces/:id/tracking` (public) |
| Analytics | `GET /api/workspaces/:id/analytics/dashboard` |
| Notifications | `GET /api/workspaces/:id/notifications` |
| Audit Logs | `GET /api/workspaces/:id/audit-logs` |

## 🌍 Internationalization

CampaignPulse supports English and Arabic with full RTL/LTR switching:

- Translation files: `frontend/src/messages/en.json`, `frontend/src/messages/ar.json`
- Language switching in header dropdown
- Automatic RTL/LTR based on locale
- Date/number formatting per locale

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Express](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TanStack Query](https://tanstack.com/query)
- [Socket.IO](https://socket.io/)
- [BullMQ](https://bullmq.io/)
- [Recharts](https://recharts.org/)