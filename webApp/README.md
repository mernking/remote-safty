# Remote Safety Management System

A comprehensive safety management web application designed for remote jobsite oversight and compliance tracking.

## Features

### User Management
- **Role-based access control** with Admin, Safety Manager, Supervisor, and Worker roles
- **User creation and editing** with secure password management
- **API key management** for external integrations
- **User activity tracking** and statistics

### Site Management
- **Jobsite registration** with GPS coordinates and location details
- **Site-specific safety oversight** and compliance tracking
- **Geolocation integration** for precise incident mapping
- **Site statistics** and activity monitoring

### Safety Inspections
- **Structured safety checklists** for systematic inspections
- **Photo and document attachments** for evidence collection
- **Offline-first architecture** with synchronization
- **Site-specific inspection creation** from site pages

### Incident Reporting
- **Comprehensive incident tracking** with severity levels
- **GPS location capture** for incident mapping
- **Multi-format evidence collection** (photos, documents)
- **Direct incident reporting** from site buttons
- **Automated notifications** for high-severity incidents

### API Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user info

#### Users
- `GET /api/v1/users` - Get all users (admin only)
- `POST /api/v1/users` - Create new user (admin only)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user (admin only)
- `POST /api/v1/users/:id/generate-api-key` - Generate API key (admin only)
- `POST /api/v1/users/:id/disable-api-key` - Disable API key (admin only)

#### Sites
- `GET /api/v1/sites` - Get all sites
- `POST /api/v1/sites` - Create new site (admin/safety manager)
- `GET /api/v1/sites/:id` - Get site by ID
- `PUT /api/v1/sites/:id` - Update site (admin/safety manager)
- `DELETE /api/v1/sites/:id` - Delete site (admin only)

#### Inspections
- `GET /api/v1/inspections` - Get all inspections
- `POST /api/v1/inspections` - Create new inspection
- `GET /api/v1/inspections/:id` - Get inspection by ID
- `PUT /api/v1/inspections/:id` - Update inspection
- `DELETE /api/v1/inspections/:id` - Delete inspection

#### Incidents
- `GET /api/v1/incidents` - Get all incidents
- `POST /api/v1/incidents` - Create new incident
- `GET /api/v1/incidents/:id` - Get incident by ID
- `PUT /api/v1/incidents/:id` - Update incident
- `DELETE /api/v1/incidents/:id` - Delete incident

#### Toolbox Talks
- `GET /api/v1/toolbox-talks` - Get all toolbox talks
- `POST /api/v1/toolbox-talks` - Create new toolbox talk
- `GET /api/v1/toolbox-talks/:id` - Get toolbox talk by ID
- `PUT /api/v1/toolbox-talks/:id` - Update toolbox talk
- `DELETE /api/v1/toolbox-talks/:id` - Delete toolbox talk

#### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `POST /api/v1/notifications/:id/read` - Mark notification as read
- `POST /api/v1/notifications/mark-all-read` - Mark all notifications as read

#### Attachments
- `POST /api/v1/attachments` - Upload attachment
- `GET /api/v1/attachments/:id` - Get attachment
- `DELETE /api/v1/attachments/:id` - Delete attachment

#### Reports
- `GET /api/v1/reports/inspections` - Generate inspections report
- `GET /api/v1/reports/incidents` - Generate incidents report
- `GET /api/v1/reports/toolbox-talks` - Generate toolbox talks report
- `GET /api/v1/reports/combined` - Generate combined report

#### Sync
- `POST /api/v1/sync/upload` - Upload offline changes
- `GET /api/v1/sync/download/:lastSync` - Download server changes
- `GET /api/v1/sync/status` - Get sync status

## Technology Stack

### Frontend
- **React 18** with modern hooks and functional components
- **React Router** for client-side routing
- **DaisyUI + Tailwind CSS** for responsive UI
- **IndexedDB** for offline data storage
- **PWA capabilities** with service worker support

### Backend
- **Node.js/Express** RESTful API
- **Prisma ORM** with SQLite database
- **JWT authentication** with refresh tokens
- **bcryptjs** for password hashing
- **multer** for file uploads

### Key Features
- **Offline-first architecture** with data synchronization
- **Progressive Web App** with installable capabilities
- **GPS integration** for location-based features
- **Photo capture** and document attachment support
- **Real-time notifications** and audit logging
- **Role-based permissions** and security controls

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd remote-safety-management
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd server
   npm install

   # Frontend dependencies
   cd ../webApp
   npm install
   ```

3. **Database setup**
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd server
   npm run dev

   # Terminal 2: Frontend
   cd webApp
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Development

### Project Structure
```
├── server/                 # Backend API
│   ├── routes/            # API route handlers
│   ├── middleware/        # Authentication & authorization
│   ├── prisma/           # Database schema & migrations
│   └── uploads/          # File storage
├── webApp/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context providers
│   │   ├── db.js         # IndexedDB configuration
│   │   └── main.jsx      # Application entry point
│   └── public/           # Static assets
└── README.md
```

### API Documentation

Full API documentation is available via Swagger UI at `/api-docs` when the server is running.

### Contributing

1. Create feature branches from `main`
2. Write tests for new functionality
3. Ensure all tests pass
4. Submit pull requests with detailed descriptions

## Security

- **JWT-based authentication** with secure token handling
- **Role-based access control** with granular permissions
- **Input validation** and sanitization
- **SQL injection prevention** via Prisma ORM
- **CORS configuration** for secure API access
- **Password hashing** with bcrypt
- **API key management** for external integrations

## License

This project is licensed under the MIT License.
