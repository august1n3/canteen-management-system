# Canteen Management System

A comprehensive digital solution for managing canteen operations, including real-time order processing, queue management, payment integration, and analytics.

## 🏗️ Architecture Overview

This system implements a **multi-tier architecture** with **event-driven design** patterns to support real-time operations across multiple interfaces (web, mobile app, kiosks, and public displays).

### Key Features

- **Real-time Order Management**: Live order tracking with WebSocket updates
- **Multi-interface Support**: Web app, mobile app, kiosk terminals, and public queue displays
- **Payment Integration**: Support for mobile money, cards, cash, and student cards
- **Queue Management**: Real-time queue updates with estimated preparation times
- **Analytics & Reporting**: Comprehensive sales, order, and performance analytics
- **Staff Dashboard**: Order processing, menu management, and inventory control
- **Student Portal**: Menu browsing, ordering, payment, and order tracking

## 📁 Project Structure

```
canteen-management-system/
├── frontend/                 # Next.js React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── features/         # Feature-based modules
│   │   │   ├── auth/         # Authentication
│   │   │   ├── dashboard/    # Real-time dashboard
│   │   │   ├── orders/       # Order management
│   │   │   ├── menu/         # Menu browsing & management
│   │   │   ├── payments/     # Payment processing
│   │   │   ├── queue/        # Queue display
│   │   │   └── reports/      # Analytics & reporting
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API services
│   │   └── utils/            # Utility functions
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── controllers/      # API route handlers
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Express middleware
│   │   ├── services/         # Business logic
│   │   │   ├── websocket/    # Real-time updates
│   │   │   ├── payments/     # Payment processing
│   │   │   └── notifications/ # Push notifications
│   │   └── config/           # Configuration files
├── shared/                   # Shared types and utilities
│   └── src/
│       ├── types/            # TypeScript interfaces
│       ├── constants/        # App constants
│       └── utils/            # Shared utilities
└── database/                 # Database schemas and migrations
    ├── schema.prisma         # Prisma database schema
    ├── migrations/           # Database migrations
    └── seeds/                # Sample data
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 13+
- Redis 6+ (for caching and WebSocket sessions)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd canteen-management-system
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd ../frontend && npm install

# Install shared package dependencies
cd ../shared && npm install
```

3. **Set up environment variables**
```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database and API keys

# Frontend environment  
cp frontend/.env.example frontend/.env.local
# Edit with your API endpoints
```

4. **Set up the database**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run db:seed
```

5. **Start development servers**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Shared (watch mode)
cd shared && npm run dev
```

## 🔧 Development

### Tech Stack

**Frontend:**
- **Next.js 14**: React framework with app router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **React Query**: Server state management
- **Socket.io Client**: Real-time updates
- **React Hook Form**: Form management
- **Framer Motion**: Animations

**Backend:**
- **Node.js + Express**: API server
- **TypeScript**: Type safety  
- **Prisma**: Database ORM
- **Socket.io**: WebSocket server
- **JWT**: Authentication
- **Redis**: Caching and sessions
- **Winston**: Logging

**Database:**
- **PostgreSQL**: Primary database
- **Redis**: Cache and session store

### Available Scripts

**Backend:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

**Frontend:**  
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## 📊 System Workflows

The system implements several key workflows based on the analyzed sequence diagrams:

1. **Student Order Flow**: Menu browsing → Order creation → Payment → Real-time status tracking
2. **Staff Operations**: Order dashboard → Status management → Queue control → Reporting
3. **Payment Processing**: Multiple payment methods with mobile money integration
4. **Real-time Updates**: WebSocket-based live updates across all interfaces
5. **Queue Management**: Dynamic queue with estimated times and public displays

## 🔐 User Roles & Permissions

- **Students**: Browse menu, place orders, track status, make payments
- **Canteen Staff**: Manage orders, update menu, control queue displays, view reports
- **Admins**: Full system access, user management, system configuration

## 📱 Multi-Interface Support

- **Web Application**: Full-featured interface for students and staff
- **Mobile App**: Optimized mobile experience  
- **Kiosk Terminals**: Self-service ordering stations
- **Public Queue Displays**: Real-time queue status for waiting areas

## 🔌 API Documentation

API documentation will be available at `/api/docs` when running the backend server.

## 🧪 Testing

```bash
# Run backend tests
cd backend && npm test

# Run frontend tests  
cd frontend && npm test

# Run with coverage
npm run test:coverage
```

## 📈 Monitoring & Analytics

The system includes comprehensive analytics for:
- Sales performance and trends
- Order patterns and peak times  
- Payment method preferences
- Menu item popularity
- Queue efficiency metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.