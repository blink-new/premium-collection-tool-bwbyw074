# Cell Captive API Documentation

This document describes the API endpoints available for cell captives to interact with the Premium Collection Tool system. All endpoints require API key authentication.

## Authentication

All API requests must include an API key in the Authorization header:

```
Authorization: Bearer pct_your_api_key_here
```

API keys are generated by system administrators and are specific to each cell captive.

## Base URL

```
https://your-domain.com/api
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

Common error codes:
- `MISSING_API_KEY`: No API key provided
- `INVALID_API_KEY`: Invalid or expired API key
- `INSUFFICIENT_PERMISSIONS`: API key lacks required permissions
- `CAPTIVE_INACTIVE`: Cell captive account is inactive

## Endpoints

### 1. Get Cell Captive Information

Get information about your cell captive account.

**Endpoint:** `GET /api/captive/info`

**Permissions Required:** None (basic access)

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Alpha Insurance Cell",
    "code": "ALPHA001",
    "contact_email": "admin@alpha-insurance.com",
    "contact_phone": "+27123456789",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "policy_count": 150,
    "active_policies": 140,
    "total_collections": 1200,
    "successful_collections": 1100,
    "failed_collections": 80,
    "pending_collections": 20,
    "total_collected": 2500000.00,
    "avg_collection_amount": 2272.73
  }
}
```

### 2. Get Policies

Retrieve policies associated with your cell captive.

**Endpoint:** `GET /api/captive/policies`

**Permissions Required:** `policies:read`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by policy status (`active`, `lapsed`, `cancelled`)
- `search` (optional): Search in policy number, client name, or email

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "policy_number": "POL001",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "client_phone": "+27123456789",
      "premium_amount": 1500.00,
      "frequency": "monthly",
      "status": "active",
      "mandate_reference": "MAN001",
      "bank_account_number": "1234567890",
      "bank_branch_code": "123456",
      "bank_account_type": "current",
      "next_collection_date": "2024-02-01",
      "grace_period_days": 7,
      "collection_count": 12,
      "successful_collections": 11,
      "total_collected": 16500.00,
      "last_collection_date": "2024-01-01",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### 3. Get Collections

Retrieve collections for your cell captive.

**Endpoint:** `GET /api/captive/collections`

**Permissions Required:** `collections:read`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (`pending`, `submitted`, `successful`, `failed`, `cancelled`)
- `collection_type` (optional): Filter by type (`recurring`, `adhoc`)
- `date_from` (optional): Filter from date (YYYY-MM-DD)
- `date_to` (optional): Filter to date (YYYY-MM-DD)
- `policy_number` (optional): Filter by policy number

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "collection_reference": "COL_1234567890_abc123",
      "policy_id": "uuid",
      "policy_number": "POL001",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "collection_type": "recurring",
      "amount": 1500.00,
      "collection_date": "2024-01-01",
      "status": "successful",
      "failure_reason": null,
      "retry_count": 0,
      "max_retries": 2,
      "investec_reference": "INV123456",
      "bank_reference": "BANK789",
      "bank_transaction_date": "2024-01-01",
      "reconciliation_status": "matched",
      "processed_at": "2024-01-01T10:30:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1200,
    "pages": 60
  }
}
```

### 4. Create Collection (Ad-hoc)

Create a new ad-hoc collection for a policy.

**Endpoint:** `POST /api/captive/collections`

**Permissions Required:** `collections:write`

**Request Body:**
```json
{
  "policy_number": "POL001",
  "amount": 1500.00,
  "collection_date": "2024-02-01",
  "collection_type": "adhoc"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "collection_reference": "COL_1234567890_abc123",
    "policy_id": "uuid",
    "policy_number": "POL001",
    "client_name": "John Doe",
    "collection_type": "adhoc",
    "amount": 1500.00,
    "collection_date": "2024-02-01",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Collection created successfully"
}
```

### 5. Update Collection

Update an existing collection.

**Endpoint:** `PATCH /api/captive/collections/{collection_reference}`

**Permissions Required:** `collections:write`

**Request Body:**
```json
{
  "status": "successful",
  "amount": 1500.00,
  "failure_reason": null,
  "investec_reference": "INV123456"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "collection_reference": "COL_1234567890_abc123",
    "policy_number": "POL001",
    "client_name": "John Doe",
    "collection_type": "adhoc",
    "amount": 1500.00,
    "collection_date": "2024-02-01",
    "status": "successful",
    "investec_reference": "INV123456",
    "processed_at": "2024-01-01T10:30:00.000Z",
    "updated_at": "2024-01-01T10:30:00.000Z"
  },
  "message": "Collection updated successfully"
}
```

### 6. Get Statistics

Get collection and policy statistics for your cell captive.

**Endpoint:** `GET /api/captive/statistics`

**Permissions Required:** None (basic access)

**Query Parameters:**
- `date_from` (optional): Filter from date (YYYY-MM-DD)
- `date_to` (optional): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "data": {
    "collections": {
      "total_collections": 1200,
      "successful_collections": 1100,
      "failed_collections": 80,
      "pending_collections": 20,
      "success_rate": 91.67,
      "total_amount": 1800000.00,
      "successful_amount": 1650000.00,
      "avg_successful_amount": 1500.00,
      "recurring_collections": 1000,
      "adhoc_collections": 200
    },
    "policies": {
      "total_policies": 150,
      "active_policies": 140,
      "lapsed_policies": 8,
      "cancelled_policies": 2,
      "avg_premium_amount": 1500.00
    },
    "monthly_trends": [
      {
        "month": "2024-01-01T00:00:00.000Z",
        "collections": 100,
        "amount": 150000.00,
        "successful": 92,
        "failed": 8
      }
    ]
  }
}
```

## Webhook Endpoints

These endpoints are designed for external systems to push updates to the Premium Collection Tool.

### 1. Update Collection Status

Update the status of collections via webhook.

**Endpoint:** `POST /api/webhooks/collections/update`

**Permissions Required:** `collections:write`

**Request Body:**
```json
{
  "collection_reference": "COL_1234567890_abc123",
  "status": "successful",
  "amount": 1500.00,
  "failure_reason": null,
  "investec_reference": "INV123456",
  "bank_reference": "BANK789",
  "transaction_date": "2024-01-01"
}
```

**Alternative (using policy number):**
```json
{
  "policy_number": "POL001",
  "status": "successful",
  "amount": 1500.00,
  "collection_date": "2024-01-01",
  "investec_reference": "INV123456",
  "bank_reference": "BANK789",
  "transaction_date": "2024-01-01"
}
```

### 2. Bulk Update Collections

Update multiple collections in a single request.

**Endpoint:** `POST /api/webhooks/collections/bulk-update`

**Permissions Required:** `collections:write`

**Request Body:**
```json
{
  "collections": [
    {
      "collection_reference": "COL_1234567890_abc123",
      "status": "successful",
      "investec_reference": "INV123456"
    },
    {
      "collection_reference": "COL_1234567890_def456",
      "status": "failed",
      "failure_reason": "Insufficient funds"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "processed": 2,
    "errors": 0,
    "results": [
      {
        "index": 0,
        "collection": { /* collection object */ },
        "status": "updated"
      }
    ],
    "errors": []
  },
  "message": "Processed 2 collections, 0 errors"
}
```

### 3. Update Policy Information

Update policy information via webhook.

**Endpoint:** `POST /api/webhooks/policies/update`

**Permissions Required:** `policies:write`

**Request Body:**
```json
{
  "policy_number": "POL001",
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "+27123456789",
  "premium_amount": 1600.00,
  "frequency": "monthly",
  "status": "active",
  "mandate_reference": "MAN001",
  "bank_account_number": "1234567890",
  "bank_branch_code": "123456",
  "next_collection_date": "2024-02-01"
}
```

### 4. Get Webhook Logs

Retrieve webhook activity logs for your cell captive.

**Endpoint:** `GET /api/webhooks/logs`

**Permissions Required:** None (basic access)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `status_code` (optional): Filter by HTTP status code

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "endpoint": "/api/webhooks/collections/update",
      "method": "POST",
      "response_status": 200,
      "processing_time_ms": 150,
      "created_at": "2024-01-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

## API Key Permissions

API keys can have the following permissions:

- `policies:read` - Read policy information
- `policies:write` - Create and update policies
- `collections:read` - Read collection information
- `collections:write` - Create and update collections
- `*` - All permissions (admin access)

## Rate Limits

- Standard endpoints: 100 requests per minute
- Webhook endpoints: 1000 requests per minute
- Bulk operations: 10 requests per minute

## WebSocket Updates

The system broadcasts real-time updates via WebSocket for:
- Collection status changes
- Policy updates
- New collections created

Connect to: `wss://your-domain.com/ws` with your API key in the Authorization header.

## Support

For API support, contact: support@premiumcollection.com

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- Basic CRUD operations for collections and policies
- Webhook endpoints for external integrations
- Real-time WebSocket updates