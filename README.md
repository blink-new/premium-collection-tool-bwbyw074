# Premium Collection Tool

A comprehensive debit order management system that integrates with Investec Bank and multiple PAS systems (Grail, Root, Genesys Skyy, Owl) to automate premium collections with support for both recurring and ad-hoc payments, file generation, and real-time reconciliation.

## Features

### Core Functionality
- **Debit Order Management**: Investec-compliant EFT/ACH file generation
- **Recurring Collections**: Automated monthly/quarterly collections
- **Ad-hoc Collections**: Manual one-off collections with approval workflow
- **PAS Integration**: Multi-system sync with Grail, Root, Genesys Skyy, and Owl
- **Real-time Reconciliation**: Automatic matching of bank responses
- **API Key Management**: Secure API access for cell captives
- **Webhook Support**: Real-time collection status updates

### Technical Features
- **PostgreSQL Database**: Comprehensive data model with audit trails
- **WebSocket Support**: Real-time status updates
- **RESTful APIs**: Full CRUD operations for all entities
- **Authentication**: JWT-based user authentication
- **API Key Authentication**: Secure cell captive API access
- **Audit Trail**: Complete logging of all system changes

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **Vite** for development and building

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **WebSocket** for real-time updates
- **JWT** authentication
- **bcryptjs** for password hashing

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd premium-collection-tool
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE premium_collection;
CREATE USER premium_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE premium_collection TO premium_user;
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=premium_collection
DB_USER=premium_user
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. Start the Application

For development (runs both frontend and backend):

```bash
npm run dev
```

Or run them separately:

```bash
# Backend only
npm run dev:server

# Frontend only  
npm run dev:client
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **WebSocket**: ws://localhost:5000/ws

### 6. Default Login

The system creates a default admin user:
- **Email**: admin@premiumcollection.com
- **Password**: admin123

## API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@premiumcollection.com",
  "password": "admin123"
}
```

#### Register User
```http
POST /api/auth/register
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user"
}
```

### API Key Management

#### Generate API Key
```http
POST /api/keys/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "cell_captive_id": "uuid",
  "key_name": "Production API Key",
  "permissions": ["collections:read", "collections:write"],
  "expires_in_days": 365
}
```

#### List API Keys
```http
GET /api/keys?page=1&limit=20
Authorization: Bearer <jwt_token>
```

### Collections API

#### Get Collections
```http
GET /api/collections?page=1&limit=20&status=pending
Authorization: Bearer <jwt_token>
# OR
Authorization: Bearer <api_key>
```

#### Create Collection
```http
POST /api/collections
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "policy_id": "uuid",
  "collection_type": "recurring",
  "amount": 2500.00,
  "collection_date": "2024-02-01",
  "cell_captive_id": "uuid"
}
```

### Webhook Endpoints

#### Update Collection Status
```http
POST /api/webhooks/collections/update
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "collection_reference": "COL-123456",
  "status": "successful",
  "amount": 2500.00,
  "investec_reference": "INV-789012",
  "collection_date": "2024-01-15"
}
```

#### Bulk Update Collections
```http
POST /api/webhooks/collections/bulk-update
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "collections": [
    {
      "collection_reference": "COL-123456",
      "status": "successful",
      "investec_reference": "INV-789012"
    },
    {
      "policy_number": "POL-654321",
      "status": "failed",
      "failure_reason": "Insufficient funds"
    }
  ]
}
```

## WebSocket Integration

### Connection
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your-jwt-token'
}));

// Subscribe to updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'collections'
}));
```

### Real-time Events
- `collection_created`: New collection added
- `collection_status_updated`: Collection status changed
- `collections_bulk_updated`: Bulk collection updates
- `collection_updated`: General collection updates

## Database Schema

### Key Tables
- **users**: System users and authentication
- **cell_captives**: Insurance cell captive entities
- **api_keys**: API access keys for cell captives
- **policies**: Insurance policies
- **collections**: Collection records
- **debit_order_files**: Generated debit order files
- **reconciliation_records**: Bank reconciliation data
- **audit_trail**: Complete audit logging
- **webhook_logs**: API call logging

## Security Features

- **JWT Authentication**: Secure user sessions
- **API Key Authentication**: Cell captive API access
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Request validation and sanitization
- **Audit Trail**: Complete change logging
- **Rate Limiting**: API rate limiting (configurable)
- **CORS Protection**: Cross-origin request security

## Development

### Project Structure
```
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── pages/             # Page components
│   └── lib/               # Utilities
├── server/                # Backend Node.js application
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── database/          # Database setup and migrations
│   ├── websocket/         # WebSocket server
│   └── utils/             # Backend utilities
└── public/                # Static assets
```

### Available Scripts
- `npm run dev`: Start both frontend and backend
- `npm run dev:client`: Start frontend only
- `npm run dev:server`: Start backend only
- `npm run build`: Build for production
- `npm run lint`: Run linting
- `npm run server`: Start production server

## Production Deployment

### Environment Variables
Ensure all production environment variables are set:
- Database credentials
- JWT secret (use a strong, random key)
- CORS origins
- API endpoints

### Database Migration
The application automatically creates the database schema on startup.

### Process Management
Use PM2 or similar for production process management:

```bash
npm install -g pm2
pm2 start server/index.js --name premium-collection
```

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## License

This project is proprietary software. All rights reserved.