# EventOS — REST API Reference Guide

This document lists the REST API endpoints exposed by the EventOS microservices. All client calls should route through the **API Gateway** (`http://localhost:8080`).

---

## 1. Authentication Headers

All protected endpoints require the following headers:

* `Authorization`: `Bearer <Access_Token>` (JWT containing roles and membership scopes)
* `X-Tenant-ID`: `<Tenant_UUID>` (Active workspace ID context)

---

## 2. Auth Service Endpoints (`/api/v1/auth`)

Manages client onboarding, registration, security settings, and team rosters.

### 2.1 Workspace Register
* **Method**: `POST`
* **Path**: `/api/v1/auth/register`
* **Request Body**:
  ```json
  {
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@events.com",
    "phone": "9998887776",
    "companyName": "Jane Events Ltd",
    "password": "Password@123"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "tenantId": "c490f1ee-8c54-4a01-80e6-d701748f0852",
    "companyName": "Jane Events Ltd",
    "status": "SUCCESS"
  }
  ```

### 2.2 User Login
* **Method**: `POST`
* **Path**: `/api/v1/auth/login`
* **Request Body**:
  ```json
  {
    "email": "jane@events.com",
    "password": "Password@123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJSUzI1NiIsIn...",
    "user": {
      "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "email": "jane@events.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "OWNER",
      "permissions": ["ALL_PERMISSIONS"]
    },
    "activeTenantId": "c490f1ee-8c54-4a01-80e6-d701748f0852",
    "memberships": [
      {
        "tenantId": "c490f1ee-8c54-4a01-80e6-d701748f0852",
        "companyId": "b110f1ee-7c54-4b01-90e6-d701748f0853",
        "companyName": "Jane Events Ltd",
        "role": "OWNER",
        "status": "ACTIVE"
      }
    ]
  }
  ```

---

## 3. CRM & Quotes Endpoints (`/api/v1/crm`)

Manages client pipeline leads and itemized quotation templates.

### 3.1 Fetch Leads
* **Method**: `GET`
* **Path**: `/api/v1/crm/leads`
* **Response (200 OK)**:
  ```json
  [
    {
      "id": "e390f1ee-6c54-4b01-90e6-d701748f0854",
      "contact": {
        "email": "customer@gmail.com",
        "phone": "9876543210"
      },
      "clientName": "John Smith",
      "eventType": "WEDDING",
      "budget": 25000.00,
      "status": "QUALIFIED",
      "createdAt": "2026-07-01T12:00:00Z"
    }
  ]
  ```

### 3.2 Create Lead
* **Method**: `POST`
* **Path**: `/api/v1/crm/leads`
* **Request Body**:
  ```json
  {
    "clientName": "Bob Vance",
    "eventType": "CORPORATE",
    "budget": 50000.00,
    "contact": {
      "email": "bob@vancerefrigeration.com",
      "phone": "5551234567"
    }
  }
  ```
* **Response (210 Created)**: Returns the saved lead representation.

---

## 4. Scheduling & Billing Endpoints (`/api/v1/events`)

Tracks events calendar metrics, client billing invoices, and estimates.

### 4.1 Fetch Events List
* **Method**: `GET`
* **Path**: `/api/v1/events`
* **Response (200 OK)**:
  ```json
  [
    {
      "id": "a190f1ee-6c54-4b01-90e6-d701748f0855",
      "title": "Vance Corp Gala",
      "venue": "Scranton Convention Hall",
      "startDate": "2026-08-15T18:00:00Z",
      "endDate": "2026-08-16T00:00:00Z",
      "status": "PLANNING"
    }
  ]
  ```

### 4.2 Log Client Payment
* **Method**: `POST`
* **Path**: `/api/v1/events/payments`
* **Request Body**:
  ```json
  {
    "invoiceId": "f790f1ee-6c54-4b01-90e6-d701748f0856",
    "amount": 5000.00,
    "method": "CREDIT_CARD"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "transactionId": "tx_8830174f",
    "invoiceId": "f790f1ee-6c54-4b01-90e6-d701748f0856",
    "status": "COMPLETED",
    "timestamp": "2026-07-07T12:30:00Z"
  }
  ```

---

## 5. Gallery Endpoints (`/api/v1/gallery`)

Manages visual assets, album client sharing, and asset purging.

### 5.1 Create Album
* **Method**: `POST`
* **Path**: `/api/v1/gallery/albums`
* **Request Body**:
  ```json
  {
    "name": "Vance Gala Highlights",
    "eventId": "a190f1ee-6c54-4b01-90e6-d701748f0855",
    "slug": "vance-gala-2026"
  }
  ```
* **Response (201 Created)**: Returns the provisioned album metadata block.
