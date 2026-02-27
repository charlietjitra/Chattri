# Chattri Tutoring Platform

A full-stack tutoring platform that connects students with tutors for online learning sessions.

## Overview

Chattri is a modern web application built for educational tutoring services. It provides a comprehensive platform for students to find and book tutors, manage learning sessions, and provide feedback through reviews.

## Features

- **User Management**: Support for three user types - students, tutors, and administrators
- **Tutor Discovery**: Browse and search for tutors based on expertise and availability
- **Booking System**: Schedule tutoring sessions with automated confirmation workflow
- **Session Management**: Real-time session tracking with messaging capabilities
- **Review System**: Students can rate and review their tutoring experiences
- **Availability Management**: Tutors can set their available hours and mark unavailable dates
- **Multi-timezone Support**: Handle users across different time zones
- **Secure Authentication**: JWT-based authentication with password encryption

## Tech Stack

### Backend (API)

- **Runtime**: Node.js with TypeScript
- **Framework**: Hono.js for fast API development
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs for password hashing
- **Validation**: Zod for request/response validation
- **ID Generation**: NanoID for user-friendly 6-digit IDs

### Frontend (Client)

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI component library
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios for API communication
- **Development**: Biome for linting and formatting

## Project Structure

```
├── api.chattri/          # Backend API server
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── middleware/   # Authentication and validation middleware
│   │   ├── lib/          # Database and utility functions
│   │   └── schemas/      # Validation schemas
│   └── prisma/           # Database schema and migrations
└── client/               # Frontend Next.js application
    ├── src/
    │   ├── app/          # App router pages and layouts
    │   ├── components/   # Reusable UI components
    │   ├── lib/          # API client and utilities
    │   └── types/        # TypeScript type definitions
    └── public/           # Static assets
```

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- npm or yarn package manager

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Chattri
   ```

2. **Setup Backend**

   ```bash
   cd api.chattri
   npm install
   ```

   Create a `.env` file with your database configuration:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/chattri_db"
   JWT_SECRET="your-jwt-secret"
   ```

   Run database migrations:

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

3. **Setup Frontend**

   ```bash
   cd ../client
   npm install
   ```

   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   ```

### Development

1. **Start the API server**

   ```bash
   cd api.chattri
   npm run dev
   ```

   The API will be available at `http://localhost:3001`

2. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```
   The client will be available at `http://localhost:3000`

### Production Build

1. **Build the API**

   ```bash
   cd api.chattri
   npm run build
   npm start
   ```

2. **Build the client**
   ```bash
   cd client
   npm run build
   npm start
   ```

## API Endpoints

The API provides RESTful endpoints for:

- `/auth` - User authentication and registration
- `/users` - User management
- `/students` - Student-specific operations
- `/tutors` - Tutor management and discovery
- `/bookings` - Session booking management
- `/sessions` - Active session handling
- `/reviews` - Review and rating system
- `/admin` - Administrative functions

## Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Core user accounts with role-based access
- **Students/Tutors/Admins**: Role-specific profile data
- **Bookings**: Scheduled tutoring sessions
- **Sessions**: Active session tracking with messaging
- **Reviews**: Tutor feedback and ratings
- **Availability**: Tutor schedule management

All entities use 6-digit IDs for user-friendly URLs and references.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.
