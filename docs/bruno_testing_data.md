# Bruno Collection Import Data Guide

This document contains all details, environments, variables, headers, and request payloads required to construct your Bruno API testing collection manually.

---

## 1. Environment & Collection Variables

Configure these variables in your Bruno environment (e.g., `eventos_bruno_environment.bru`) or collection-level variables:

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `gateway_url` | `http://localhost:8080` | URL of the API Gateway |
| `auth_url` | `http://localhost:8081` | Direct URL of the Auth Service (for direct calls) |
| `accessToken` | *[dynamically set]* | Bearer access token received from login |
| `tenantId` | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` | Active tenant ID of the workspace |
| `leadId` | `d4e5f6a7-b8c9-0123-defa-234567890123` | ID of a sample lead |
| `quoteId` | `e5f6a7b8-c9d0-1234-efab-345678901234` | ID of a sample quote |
| `bookingId` | `a7b8c9d0-e1f2-3456-abcd-567890123456` | ID of a sample booking |
| `albumId` | `d0e1f2a3-b4c5-6789-defa-890123456789` | ID of a sample gallery album |

---

## 2. API Endpoints Reference

### Category A: Authentication & Workspace Service

#### 1. Login via Gateway
* **Method:** `POST`
* **URL:** `{{gateway_url}}/api/v1/auth/login`
* **Headers:**
  * `Content-Type: application/json`
* **Request Body (JSON):**
```json
{
  "email": "lokesh@myevents.com",
  "password": "Secret@123"
}
```
* **Post-Request Script (Optional):** Save the returned `accessToken` and `tenantId` to variables automatically.

---

#### 2. Login Direct (Bypass Gateway)
* **Method:** `POST`
* **URL:** `{{auth_url}}/api/v1/auth/login`
* **Headers:**
  * `Content-Type: application/json`
* **Request Body (JSON):**
```json
{
  "email": "lokesh@myevents.com",
  "password": "Secret@123"
}
```

---

#### 3. Register Workspace via Gateway
* **Method:** `POST`
* **URL:** `{{gateway_url}}/api/v1/auth/register`
* **Headers:**
  * `Content-Type: application/json`
* **Request Body (JSON):**
```json
{
  "firstName": "Lokesh",
  "lastName": "Nagrikar",
  "email": "newowner@myevents.com",
  "phone": "9309965483",
  "companyName": "Eventos Digital Studio",
  "password": "Secret@123"
}
```

---

#### 4. Refresh Token via Gateway
* **Method:** `POST`
* **URL:** `{{gateway_url}}/api/v1/auth/refresh`
* **Headers:**
  * `Content-Type: application/json`
* **Request Body (JSON):**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

---

#### 5. Get Active Sessions
* **Method:** `GET`
* **URL:** `{{gateway_url}}/api/v1/auth/sessions`
* **Headers:**
  * `Authorization: Bearer {{accessToken}}`
  * `X-Tenant-ID: {{tenantId}}`

---

#### 6. Invite Team Member
* **Method:** `POST`
* **URL:** `{{gateway_url}}/api/v1/auth/invitations`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{accessToken}}`
  * `X-Tenant-ID: {{tenantId}}`
* **Request Body (JSON):**
```json
{
  "email": "manager.demo@myevents.com",
  "firstName": "Raj",
  "lastName": "Verma",
  "role": "MANAGER",
  "phone": "9876543212"
}
```

---

#### 7. Get Captcha (Fallback after 3 failed login attempts)
* **Method:** `GET`
* **URL:** `{{gateway_url}}/api/v1/auth/captcha`

---

### Category B: CRM Service

#### 1. List Leads
* **Method:** `GET`
* **URL:** `{{gateway_url}}/api/v1/crm/leads?page=0&size=50`
* **Headers:**
  * `Authorization: Bearer {{accessToken}}`

---

#### 2. Get Lead By ID
* **Method:** `GET`
* **URL:** `{{gateway_url}}/api/v1/crm/leads/{{leadId}}`
* **Headers:**
  * `Authorization: Bearer {{accessToken}}`

---

#### 3. Create Lead
* **Method:** `POST`
* **URL:** `{{gateway_url}}/api/v1/crm/leads`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{accessToken}}`
* **Request Body (JSON):**
```json
{
  "name": "Priya & Arjun Sharma",
  "email": "priya.sharma@gmail.com",
  "phone": "9876543210",
  "eventType": "WEDDING",
  "eventDate": "2026-12-20",
  "budget": 550000.00,
  "leadSource": "REFERRAL",
  "notes": "Client wants full-service wedding: photography, decoration, catering management. Very particular about floral arrangements. Leela Palace preferred."
}
```

---

#### 4. Log Activity on Lead
* **Method:** `POST`
* **URL:** `{{gateway_url}}/api/v1/crm/leads/{{leadId}}/activities`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{accessToken}}`
* **Request Body (JSON):**
```json
{
  "type": "CALL",
  "description": "Initial discovery call. Confirmed budget and venue preference. Client wants Leela Palace exclusively. Sending proposal by EOD."
}
```

---

#### 5. Update Lead Status
* **Method:** `PATCH`
* **URL:** `{{gateway_url}}/api/v1/crm/leads/{{leadId}}/status`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{accessToken}}`
* **Request Body (JSON):**
```json
{
  "status": "PROPOSAL_SENT"
}
```

---

#### 6. Create Proposal Quote
* **Method:** `POST`
* **URL:** `{{gateway_url}}/api/v1/crm/quotes`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{accessToken}}`
* **Request Body (JSON):**
```json
{
  "leadId": "{{leadId}}",
  "discount": 20000.00,
  "taxRate": 18.00,
  "clientNotes": "50% advance required to confirm booking. Balance due 30 days before event.",
  "termsConditions": "All bookings subject to availability. Standard cancellation policy applies.",
  "items": [
    {
      "itemName": "Full Event Management & Coordination",
      "description": "Comprehensive planning, staging, vendor liaison, and event day execution.",
      "unitPrice": 180000.00,
      "quantity": 1
    },
    {
      "itemName": "Photography & Videography",
      "description": "2 main photographers, 1 cinematographer. Pre-wedding and event coverage.",
      "unitPrice": 75000.00,
      "quantity": 1
    },
    {
      "itemName": "Floral Decoration & Mandap Setup",
      "description": "Floral arrangements for entrance, mandap, and reception tables.",
      "unitPrice": 120000.00,
      "quantity": 1
    },
    {
      "itemName": "DJ & Sound System",
      "description": "Pro DJ equipment, sound check, and evening dance floor set.",
      "unitPrice": 35000.00,
      "quantity": 1
    },
    {
      "itemName": "Catering - Vegetarian (Leela Palace)",
      "description": "High-end multi-cuisine vegetarian buffet.",
      "unitPrice": 850.00,
      "quantity": 400
    },
    {
      "itemName": "Invitation Cards (Printed + Digital)",
      "description": "Premium cards design, digital RSVP portal.",
      "unitPrice": 8000.00,
      "quantity": 1
    }
  ]
}
```

---

#### 7. Get Quote By ID
* **Method:** `GET`
* **URL:** `{{gateway_url}}/api/v1/crm/quotes/{{quoteId}}`
* **Headers:**
  * `Authorization: Bearer {{accessToken}}`

---

#### 8. Approve Quote (Promotes status to accepted)
* **Method:** `POST`
* **URL:** `{{gateway_url}}/api/v1/crm/quotes/{{quoteId}}/approve`
* **Headers:**
  * `Authorization: Bearer {{accessToken}}`

---

### Category C: Event & Booking Service

#### 1. List Bookings
* **Method:** `GET`
* **URL:** `{{gateway_url}}/api/v1/bookings`
* **Headers:**
  * `Authorization: Bearer {{accessToken}}`
* *Note: Gateway routes this request to `/api/v1/events/bookings` downstream.*

---

#### 2. Get Booking By ID
* **Method:** `GET`
* **URL:** `{{gateway_url}}/api/v1/bookings/{{bookingId}}`
* **Headers:**
  * `Authorization: Bearer {{accessToken}}`

---

#### 3. Create Booking from Approved Quote
* **Method:** `POST`
* **URL:** `{{gateway_url}}/api/v1/bookings/from-quote/{{quoteId}}`
* **Headers:**
  * `Authorization: Bearer {{accessToken}}`

---

#### 4. List Events
* **Method:** `GET`
* **URL:** `{{gateway_url}}/api/v1/events/events`
* **Headers:**
  * `Authorization: Bearer {{accessToken}}`

---

#### 5. Get Booking Budget Metrics
* **Method:** `GET`
* **URL:** `{{gateway_url}}/api/v1/events/bookings/{{bookingId}}/budget`
* **Headers:**
  * `Authorization: Bearer {{accessToken}}`

---

#### 6. List Invoices
* **Method:** `GET`
* **URL:** `{{gateway_url}}/api/v1/events/invoices`
* **Headers:**
  * `Authorization: Bearer {{accessToken}}`

---

#### 7. Record Payment
* **Method:** `POST`
* **URL:** `{{gateway_url}}/api/v1/events/payments`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{accessToken}}`
* **Request Body (JSON):**
```json
{
  "bookingId": "{{bookingId}}",
  "amount": 200000.00,
  "paymentMethod": "BANK_TRANSFER",
  "transactionId": "NEFT20261706SHARMA001",
  "notes": "Advance payment received via NEFT."
}
```

---

### Category D: Gallery Service

#### 1. Create Album
* **Method:** `POST`
* **URL:** `{{gateway_url}}/api/v1/gallery/albums`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{accessToken}}`
* **Request Body (JSON):**
```json
{
  "bookingId": "{{bookingId}}",
  "name": "Sharma-Kapoor Wedding Gallery",
  "description": "Complete photo & video collection – Sharma-Kapoor Wedding at The Leela Palace, Delhi. December 20, 2026.",
  "isClientVisible": true
}
```

---

#### 2. Get Albums
* **Method:** `GET`
* **URL:** `{{gateway_url}}/api/v1/gallery/albums`
* **Headers:**
  * `Authorization: Bearer {{accessToken}}`

---

#### 3. Get Share Link for Album
* **Method:** `POST`
* **URL:** `{{gateway_url}}/api/v1/gallery/share`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{accessToken}}`
* **Request Body (JSON):**
```json
{
  "albumId": "{{albumId}}",
  "expiresInDays": 90
}
```
