# Remote Safety API Documentation

## Overview

The Remote Safety API is a comprehensive safety management system built with Node.js, Express, and Prisma. It provides endpoints for managing users, sites, inspections, incidents, toolbox talks, notifications, reports, attachments, and data synchronization.

### Base URL
```
/api/v1
```

### Authentication
The API supports multiple authentication methods:
- **Bearer Token**: JWT token in Authorization header
- **API Key**: Custom API key authentication
- **Cookie Auth**: HTTP-only cookies

### Rate Limiting
- General endpoints: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP

### CORS
- Origins: Configurable via environment variables
- Methods: GET, POST, PUT, DELETE
- Credentials: Supported

### WebSocket Support
Real-time notifications via Socket.IO (optional)

---

## Authentication Routes

### POST `/api/v1/auth/login`
Authenticate user and get tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOi...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "SUPERVISOR"
  }
}
```

**Error Responses:**
- 400: Validation error
- 401: Invalid credentials

### POST `/api/v1/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOi...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "SUPERVISOR"
  }
}
```

**Error Responses:**
- 400: Validation error
- 409: User already exists

### POST `/api/v1/auth/refresh`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJ0eXAiOiJKV1QiLC..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "SUPERVISOR"
  }
}
```

### POST `/api/v1/auth/logout`
Logout user and clear tokens.

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### GET `/api/v1/auth/me`
Get current user information.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "SUPERVISOR",
    "apiKey": "api_key_string",
    "keyEnabled": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### POST `/api/v1/auth/generate-api-key`
Generate or regenerate API key for authenticated user.

**Response (200):**
```json
{
  "apiKey": "new_api_key_string",
  "message": "API key generated successfully. Keep this key secure!"
}
```

---

## User Management Routes

### GET `/api/v1/users`
Get all users (admin only).

**Query Parameters:**
- `limit`: Number of users to return (default: 50)

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "SUPERVISOR",
      "status": "ACTIVE",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "_count": {
        "inspections": 5,
        "incidents": 2,
        "toolboxTalks": 3
      }
    }
  ]
}
```

### POST `/api/v1/users`
Create a new user (admin only).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "SUPERVISOR"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "SUPERVISOR",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

### GET `/api/v1/users/{id}`
Get a specific user by ID.

**Path Parameters:**
- `id`: User ID (UUID)

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "SUPERVISOR",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "_count": {
      "inspections": 5,
      "incidents": 2,
      "toolboxTalks": 3,
      "notifications": 1
    }
  }
}
```

### PUT `/api/v1/users/{id}`
Update a user.

**Path Parameters:**
- `id`: User ID (UUID)

**Request Body:**
```json
{
  "name": "Jane Doe",
  "role": "SAFETY_MANAGER",
  "status": "ACTIVE"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "SAFETY_MANAGER",
    "status": "ACTIVE"
  },
  "message": "User updated successfully"
}
```

### DELETE `/api/v1/users/{id}`
Soft delete a user (admin only).

**Path Parameters:**
- `id`: User ID (UUID)

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

### POST `/api/v1/users/{id}/generate-api-key`
Generate or regenerate API key for a user (admin only).

**Path Parameters:**
- `id`: User ID (UUID)

**Response (200):**
```json
{
  "apiKey": "new_api_key_string",
  "message": "API key generated successfully. Keep this key secure!"
}
```

### POST `/api/v1/users/{id}/disable-api-key`
Disable API key for a user (admin only).

**Path Parameters:**
- `id`: User ID (UUID)

**Response (200):**
```json
{
  "message": "API key disabled successfully"
}
```

---

## Site Management Routes

### GET `/api/v1/sites`
Get all sites.

**Response (200):**
```json
{
  "sites": [
    {
      "id": "uuid",
      "name": "Construction Site A",
      "lat": 40.7128,
      "lng": -74.0060,
      "address": "123 Main St, New York, NY",
      "meta": {
        "type": "construction",
        "area": "5000 sq ft"
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/v1/sites`
Create a new site (admin/safety manager only).

**Request Body:**
```json
{
  "name": "Construction Site A",
  "lat": 40.7128,
  "lng": -74.0060,
  "address": "123 Main St, New York, NY",
  "meta": {
    "type": "construction",
    "area": "5000 sq ft"
  }
}
```

**Response (201):**
```json
{
  "site": {
    "id": "uuid",
    "name": "Construction Site A",
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "123 Main St, New York, NY",
    "meta": {
      "type": "construction",
      "area": "5000 sq ft"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Site created successfully"
}
```

### GET `/api/v1/sites/{id}`
Get a specific site by ID.

**Path Parameters:**
- `id`: Site ID (UUID)

**Response (200):**
```json
{
  "site": {
    "id": "uuid",
    "name": "Construction Site A",
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "123 Main St, New York, NY",
    "meta": {
      "type": "construction",
      "area": "5000 sq ft"
    },
    "inspections": [
      {
        "id": "uuid",
        "status": "completed",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "incidents": [],
    "toolboxTalks": [],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### PUT `/api/v1/sites/{id}`
Update a site (admin/safety manager only).

**Path Parameters:**
- `id`: Site ID (UUID)

**Request Body:**
```json
{
  "name": "Updated Site Name",
  "address": "456 Oak St, Boston, MA"
}
```

**Response (200):**
```json
{
  "site": {
    "id": "uuid",
    "name": "Updated Site Name",
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "456 Oak St, Boston, MA",
    "meta": {
      "type": "construction",
      "area": "5000 sq ft"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  },
  "message": "Site updated successfully"
}
```

### DELETE `/api/v1/sites/{id}`
Delete a site (admin only).

**Path Parameters:**
- `id`: Site ID (UUID)

**Response (200):**
```json
{
  "message": "Site deleted successfully"
}
```

---

## Inspection Routes

### GET `/api/v1/inspections`
Get all inspections.

**Query Parameters:**
- `siteId`: Filter by site ID
- `status`: Filter by status (draft, in_progress, completed)
- `limit`: Number of inspections to return (default: 50)

**Response (200):**
```json
{
  "inspections": [
    {
      "id": "uuid",
      "siteId": "uuid",
      "site": {
        "id": "uuid",
        "name": "Construction Site A"
      },
      "createdBy": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "checklist": {
        "ppe": true,
        "equipment": false,
        "hazards": "None identified"
      },
      "status": "completed",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/v1/inspections`
Create a new inspection.

**Request Body:**
```json
{
  "siteId": "uuid",
  "checklist": {
    "ppe": true,
    "equipment": false,
    "hazards": "None identified"
  },
  "status": "draft"
}
```

**Response (201):**
```json
{
  "inspection": {
    "id": "uuid",
    "siteId": "uuid",
    "site": {
      "id": "uuid",
      "name": "Construction Site A"
    },
    "createdBy": {
      "id": "uuid",
      "name": "John Doe"
    },
    "checklist": {
      "ppe": true,
      "equipment": false,
      "hazards": "None identified"
    },
    "status": "draft",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Inspection created successfully"
}
```

### GET `/api/v1/inspections/{id}`
Get a specific inspection by ID.

**Path Parameters:**
- `id`: Inspection ID (UUID)

**Response (200):**
```json
{
  "inspection": {
    "id": "uuid",
    "siteId": "uuid",
    "site": {
      "id": "uuid",
      "name": "Construction Site A"
    },
    "createdBy": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "checklist": {
      "ppe": true,
      "equipment": false,
      "hazards": "None identified"
    },
    "status": "completed",
    "attachments": [],
    "auditLogs": [
      {
        "id": "uuid",
        "action": "CREATE",
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### PUT `/api/v1/inspections/{id}`
Update an inspection.

**Path Parameters:**
- `id`: Inspection ID (UUID)

**Request Body:**
```json
{
  "checklist": {
    "ppe": true,
    "equipment": true,
    "hazards": "Minor hazard identified"
  },
  "status": "completed"
}
```

**Response (200):**
```json
{
  "inspection": {
    "id": "uuid",
    "checklist": {
      "ppe": true,
      "equipment": true,
      "hazards": "Minor hazard identified"
    },
    "status": "completed",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  },
  "message": "Inspection updated successfully"
}
```

### DELETE `/api/v1/inspections/{id}`
Delete an inspection (admin only).

**Path Parameters:**
- `id`: Inspection ID (UUID)

**Response (200):**
```json
{
  "message": "Inspection deleted successfully"
}
```

---

## Incident Routes

### GET `/api/v1/incidents`
Get all incidents.

**Query Parameters:**
- `siteId`: Filter by site ID
- `severity`: Filter by severity (1-5)
- `limit`: Number of incidents to return (default: 50)

**Response (200):**
```json
{
  "incidents": [
    {
      "id": "uuid",
      "siteId": "uuid",
      "site": {
        "id": "uuid",
        "name": "Construction Site A"
      },
      "reportedBy": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "type": "Slip and Fall",
      "severity": 3,
      "description": "Worker slipped on wet floor",
      "location": {
        "lat": 40.7128,
        "lng": -74.0060,
        "description": "Main entrance"
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/v1/incidents`
Report a new incident.

**Request Body:**
```json
{
  "siteId": "uuid",
  "type": "Slip and Fall",
  "severity": 3,
  "description": "Worker slipped on wet floor",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "description": "Main entrance"
  }
}
```

**Response (201):**
```json
{
  "incident": {
    "id": "uuid",
    "siteId": "uuid",
    "site": {
      "id": "uuid",
      "name": "Construction Site A"
    },
    "reportedBy": {
      "id": "uuid",
      "name": "John Doe"
    },
    "type": "Slip and Fall",
    "severity": 3,
    "description": "Worker slipped on wet floor",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "description": "Main entrance"
    },
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Incident reported successfully"
}
```

### GET `/api/v1/incidents/{id}`
Get a specific incident by ID.

**Path Parameters:**
- `id`: Incident ID (UUID)

**Response (200):**
```json
{
  "incident": {
    "id": "uuid",
    "siteId": "uuid",
    "site": {
      "id": "uuid",
      "name": "Construction Site A"
    },
    "reportedBy": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "type": "Slip and Fall",
    "severity": 3,
    "description": "Worker slipped on wet floor",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "description": "Main entrance"
    },
    "attachments": [],
    "auditLogs": [],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### PUT `/api/v1/incidents/{id}`
Update an incident (admin/safety manager only).

**Path Parameters:**
- `id`: Incident ID (UUID)

**Request Body:**
```json
{
  "severity": 4,
  "description": "Updated description with more details"
}
```

**Response (200):**
```json
{
  "incident": {
    "id": "uuid",
    "severity": 4,
    "description": "Updated description with more details",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  },
  "message": "Incident updated successfully"
}
```

### DELETE `/api/v1/incidents/{id}`
Delete an incident (admin only).

**Path Parameters:**
- `id`: Incident ID (UUID)

**Response (200):**
```json
{
  "message": "Incident deleted successfully"
}
```

---

## Toolbox Talk Routes

### GET `/api/v1/toolbox-talks`
Get all toolbox talks.

**Query Parameters:**
- `siteId`: Filter by site ID
- `status`: Filter by status (scheduled, completed, cancelled)
- `limit`: Number of toolbox talks to return (default: 50)

**Response (200):**
```json
{
  "toolboxTalks": [
    {
      "id": "uuid",
      "siteId": "uuid",
      "site": {
        "id": "uuid",
        "name": "Construction Site A"
      },
      "createdBy": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "title": "PPE Safety Training",
      "agenda": "Discussion on proper PPE usage",
      "attendees": ["John Doe", "Jane Smith"],
      "scheduledAt": "2023-01-15T10:00:00.000Z",
      "status": "scheduled",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/v1/toolbox-talks`
Create a new toolbox talk.

**Request Body:**
```json
{
  "siteId": "uuid",
  "title": "PPE Safety Training",
  "agenda": "Discussion on proper PPE usage",
  "attendees": ["John Doe", "Jane Smith"],
  "scheduledAt": "2023-01-15T10:00:00.000Z"
}
```

**Response (201):**
```json
{
  "toolboxTalk": {
    "id": "uuid",
    "siteId": "uuid",
    "site": {
      "id": "uuid",
      "name": "Construction Site A"
    },
    "createdBy": {
      "id": "uuid",
      "name": "John Doe"
    },
    "title": "PPE Safety Training",
    "agenda": "Discussion on proper PPE usage",
    "attendees": ["John Doe", "Jane Smith"],
    "scheduledAt": "2023-01-15T10:00:00.000Z",
    "status": "scheduled",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Toolbox talk created successfully"
}
```

### GET `/api/v1/toolbox-talks/{id}`
Get a specific toolbox talk by ID.

**Path Parameters:**
- `id`: Toolbox talk ID (UUID)

**Response (200):**
```json
{
  "toolboxTalk": {
    "id": "uuid",
    "siteId": "uuid",
    "site": {
      "id": "uuid",
      "name": "Construction Site A"
    },
    "createdBy": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "title": "PPE Safety Training",
    "agenda": "Discussion on proper PPE usage",
    "attendees": ["John Doe", "Jane Smith"],
    "scheduledAt": "2023-01-15T10:00:00.000Z",
    "status": "scheduled",
    "attachments": [],
    "auditLogs": [],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### PUT `/api/v1/toolbox-talks/{id}`
Update a toolbox talk.

**Path Parameters:**
- `id`: Toolbox talk ID (UUID)

**Request Body:**
```json
{
  "status": "completed",
  "completedAt": "2023-01-15T11:30:00.000Z",
  "attendees": ["John Doe", "Jane Smith", "Bob Johnson"]
}
```

**Response (200):**
```json
{
  "toolboxTalk": {
    "id": "uuid",
    "status": "completed",
    "completedAt": "2023-01-15T11:30:00.000Z",
    "attendees": ["John Doe", "Jane Smith", "Bob Johnson"],
    "updatedAt": "2023-01-15T11:30:00.000Z"
  },
  "message": "Toolbox talk updated successfully"
}
```

### DELETE `/api/v1/toolbox-talks/{id}`
Delete a toolbox talk (admin only).

**Path Parameters:**
- `id`: Toolbox talk ID (UUID)

**Response (200):**
```json
{
  "message": "Toolbox talk deleted successfully"
}
```

---

## Notification Routes

### GET `/api/v1/notifications`
Get user notifications.

**Query Parameters:**
- `unreadOnly`: Boolean, return only unread notifications (default: false)
- `limit`: Number of notifications to return (default: 50)

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "safety_alert",
      "title": "High Severity Incident Reported",
      "message": "Incident of severity 4 reported at Construction Site A",
      "data": {
        "incidentId": "uuid",
        "siteId": "uuid",
        "severity": 4
      },
      "read": false,
      "priority": "high",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/v1/notifications/{id}/read`
Mark notification as read.

**Path Parameters:**
- `id`: Notification ID (UUID)

**Response (200):**
```json
{
  "message": "Notification marked as read"
}
```

### POST `/api/v1/notifications/read-all`
Mark all user notifications as read.

**Response (200):**
```json
{
  "message": "5 notifications marked as read"
}
```

### GET `/api/v1/notifications/reminders`
Get pending reminders for the user.

**Response (200):**
```json
{
  "reminders": [
    {
      "id": "uuid",
      "type": "toolbox_talk",
      "entityId": "uuid",
      "entityType": "ToolboxTalk",
      "scheduledAt": "2023-01-15T10:00:00.000Z",
      "status": "pending"
    }
  ]
}
```

### GET `/api/v1/notifications/stats`
Get notification statistics for the user.

**Response (200):**
```json
{
  "stats": {
    "total": 25,
    "unread": 5,
    "today": 3,
    "read": 20
  }
}
```

### POST `/api/v1/notifications/send-test`
Send a test notification (for testing purposes).

**Request Body:**
```json
{
  "type": "test",
  "title": "Test Notification",
  "message": "This is a test notification",
  "priority": "normal"
}
```

**Response (201):**
```json
{
  "notification": {
    "id": "uuid",
    "type": "test",
    "title": "Test Notification",
    "message": "This is a test notification",
    "priority": "normal",
    "read": false,
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Test notification sent"
}
```

### DELETE `/api/v1/notifications/{id}`
Delete a notification.

**Path Parameters:**
- `id`: Notification ID (UUID)

**Response (200):**
```json
{
  "message": "Notification deleted successfully"
}
```

---

## Report Routes

### GET `/api/v1/reports/export`
Export reports in CSV or PDF format.

**Query Parameters:**
- `type`: Export format (csv, pdf) - default: csv
- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)
- `siteId`: Site ID to filter by
- `reportType`: Type of report (inspections, incidents, toolbox-talks, combined) - default: combined

**Response (200):**
CSV file download or PDF (if supported)

### GET `/api/v1/reports/dashboard`
Get dashboard statistics and metrics.

**Response (200):**
```json
{
  "summary": {
    "totalInspections": 25,
    "totalIncidents": 8,
    "totalToolboxTalks": 12,
    "highSeverityIncidents": 2,
    "pendingActions": 3
  },
  "recentActivity": {
    "draftInspections": 5,
    "highSeverityIncidents": 2
  },
  "sites": [
    {
      "id": "uuid",
      "name": "Construction Site A",
      "inspections": 10,
      "incidents": 3,
      "toolboxTalks": 5,
      "lastActivity": "2023-01-01T00:00:00.000Z"
    }
  ],
  "period": "last-30-days"
}
```

---

## Attachment Routes

### POST `/api/v1/attachments/upload-direct`
Upload file directly to Cloudinary without multer.

**Request Body:**
```json
{
  "filename": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 1024000,
  "base64Data": "iVBORw0KGgoAAAANSUhEUgAA...",
  "linkedEntity": "Inspection",
  "linkedId": "uuid"
}
```

**Response (201):**
```json
{
  "attachment": {
    "id": "uuid",
    "filename": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "storagePath": "https://cloudinary.com/...",
    "uploaded": true,
    "createdById": "uuid"
  },
  "message": "File uploaded to Cloudinary successfully"
}
```

### POST `/api/v1/attachments/upload/{id}`
Upload file for an initialized attachment.

**Path Parameters:**
- `id`: Attachment ID (UUID)

**Request Body:**
Multipart form data with 'file' field

**Response (200):**
```json
{
  "attachment": {
    "id": "uuid",
    "storagePath": "https://cloudinary.com/...",
    "uploaded": true
  },
  "message": "File uploaded successfully"
}
```

### POST `/api/v1/attachments/complete/{id}`
Mark attachment upload as complete and finalize.

**Path Parameters:**
- `id`: Attachment ID (UUID)

**Request Body:**
```json
{
  "checksum": "optional_checksum_string"
}
```

**Response (200):**
```json
{
  "attachment": {
    "id": "uuid",
    "uploaded": true
  },
  "message": "Attachment finalized successfully"
}
```

### GET `/api/v1/attachments/{id}`
Download/Serve attachment file.

**Path Parameters:**
- `id`: Attachment ID (UUID)

**Response (200):**
File binary data

### DELETE `/api/v1/attachments/{id}`
Delete an attachment.

**Path Parameters:**
- `id`: Attachment ID (UUID)

**Response (200):**
```json
{
  "message": "Attachment deleted successfully"
}
```

---

## Sync Routes

### POST `/api/v1/sync/push`
Push client operations to server for sync.

**Request Body:**
```json
{
  "clientId": "device-123",
  "ops": [
    {
      "opId": "op-1",
      "opType": "create",
      "entity": "Inspection",
      "payload": {
        "siteId": "uuid",
        "checklist": { "ppe": true }
      },
      "localId": "local-1",
      "timestamp": "2023-01-01T00:00:00.000Z",
      "attachmentsMeta": [
        {
          "localAttachmentId": "att-1",
          "filename": "photo.jpg",
          "mimeType": "image/jpeg",
          "size": 1024000
        }
      ]
    }
  ]
}
```

**Response (200):**
```json
{
  "results": [
    {
      "opId": "op-1",
      "status": "accepted",
      "serverId": "uuid",
      "version": 1,
      "serverTimestamp": "2023-01-01T00:00:00.000Z",
      "attachments": [
        {
          "localAttachmentId": "att-1",
          "attachmentId": "uuid",
          "uploadUrl": "/api/v1/attachments/upload/uuid"
        }
      ]
    }
  ]
}
```

### GET `/api/v1/sync/pull`
Pull changes since last sync.

**Query Parameters:**
- `since`: ISO date-time string for last sync timestamp

**Response (200):**
```json
{
  "inspections": [...],
  "incidents": [...],
  "toolboxTalks": [...],
  "sites": [...],
  "timestamp": "2023-01-01T12:00:00.000Z"
}
```

### POST `/api/v1/sync/ack`
Acknowledge server IDs for client operations.

**Request Body:**
```json
{
  "acknowledgments": [
    {
      "opId": "op-1",
      "serverId": "uuid"
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Acknowledgments received",
  "count": 1
}
```

### GET `/api/v1/sync/status`
Get sync status and health information.

**Response (200):**
```json
{
  "serverTime": "2023-01-01T12:00:00.000Z",
  "queueStats": [
    { "status": "pending", "_count": 5 },
    { "status": "completed", "_count": 100 }
  ],
  "health": "healthy"
}
```

---

## Error Codes

- `400`: Bad Request - Invalid input or validation error
- `401`: Unauthorized - Authentication required or failed
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource does not exist
- `409`: Conflict - Resource already exists or constraint violation
- `500`: Internal Server Error - Unexpected server error
- `501`: Not Implemented - Feature not available

## Data Types

### User Roles
- `ADMIN`: Full system access
- `SAFETY_MANAGER`: Safety operations management
- `SUPERVISOR`: Site supervision
- `WORKER`: Basic operations

### Status Values
- `ACTIVE`: Account is active
- `BANNED`: Account is banned
- `DELETED`: Account is soft deleted

### Inspection Status
- `draft`: Not yet completed
- `in_progress`: Currently being worked on
- `completed`: Finished and submitted

### Toolbox Talk Status
- `scheduled`: Planned for future
- `completed`: Session completed
- `cancelled`: Session cancelled

### Notification Types
- `safety_alert`: High-priority safety alerts
- `incident_created`: New incident reported
- `incident_updated`: Incident modified
- `inspection_created`: New inspection created
- `inspection_updated`: Inspection modified
- `toolbox_talk_created`: New toolbox talk scheduled
- `toolbox_talk_updated`: Toolbox talk modified

This documentation covers all current API endpoints and their specifications.