# API Documentation — Prescribe Pro

A RESTful JSON API for a prescription management application.

- **Base URL (Dev):** `http://localhost:5000/api`
- **Base URL (Prod):** `https://your-domain.com/api`
- **Content-Type:** `application/json`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Standard Formats](#2-standard-formats)
3. [Health](#3-health)
4. [Auth](#4-auth)
5. [Doctors](#5-doctors)
6. [Patients](#6-patients)
7. [Prescriptions](#7-prescriptions)
8. [Appointments](#8-appointments)
9. [Plans](#9-plans)
10. [Medical Representatives (MR)](#10-medical-representatives-mr)
11. [Receptionist](#11-receptionist)
12. [Admin](#12-admin)
13. [Notifications](#13-notifications)
14. [Stats / Subscriptions](#14-stats--subscriptions)

---

## 1. Authentication

### Headers

```
Authorization: Bearer <accessToken>
```

### Token Expiry

| Token | Env Variable | Default |
|-------|-------------|---------|
| Access Token | `JWT_EXPIRES_IN` | 15m |
| Refresh Token | `JWT_REFRESH_EXPIRES_IN` | 7d |

### Roles

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | System administrator |
| `DOCTOR` | Doctor (primary user) |
| `RECEPTIONIST` | Receptionist (managed by a doctor) |
| `MEDICAL_REPRESENTATIVE` | Medical representative (MR) |

### Rate Limiting

- **Global:** 100 requests per 15 minutes
- **Auth routes:** 10 requests per 15 minutes

---

## 2. Standard Formats

### Success Response (Single)

```json
{
  "success": true,
  "data": { ... }
}
```

### Success Response (Paginated)

```json
{
  "data": [ ... ],
  "page": 1,
  "limit": 20,
  "total": 50,
  "totalPages": 3
}
```

**Query Parameters for Pagination:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `search` | string | "" | Search keyword |

Some endpoints also support additional filters: `status`, `planId`, `dateFrom`, `dateTo`.

### Error Response (Validation)

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### Error Response (General)

```json
{
  "success": false,
  "message": "Resource not found"
}
```

| HTTP Status | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (no token / invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## 3. Health

### GET /api/health

No auth required.

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2026-06-25T10:00:00.000Z"
}
```

**cURL:**

```bash
curl http://localhost:5000/api/health
```

---

## 4. Auth

All auth routes are rate-limited to 10 requests per 15 minutes.

### POST /api/auth/register

Register a new user.

**Auth:** None

**Request Body:**

```json
{
  "email": "doctor@example.com",
  "password": "123456",
  "fullName": "Dr. John Doe",
  "role": "DOCTOR"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email |
| `password` | string | Yes | Min 6 characters |
| `fullName` | string | Yes | Min 2 characters |
| `role` | enum | No | `DOCTOR` (default), `RECEPTIONIST`, or `MEDICAL_REPRESENTATIVE` |

On registration with role `DOCTOR`, a free subscription is automatically created.

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "doctor@example.com",
      "role": "DOCTOR",
      "doctorId": "uuid"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    }
  }
}
```

**cURL:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"123456","fullName":"Dr. John Doe","role":"DOCTOR"}'
```

### POST /api/auth/login

Login with email and password.

**Auth:** None

**Request Body:**

```json
{
  "email": "doctor@example.com",
  "password": "123456"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "doctor@example.com",
      "role": "DOCTOR",
      "doctor": { "id": "uuid", "fullName": "Dr. John Doe", ... },
      "mr": null,
      "receptionist": null
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    }
  }
}
```

**Error (401):**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**cURL:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"123456"}'
```

### POST /api/auth/refresh-token

Get new access and refresh tokens.

**Auth:** None

**Request Body:**

```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### POST /api/auth/logout

Clear the refresh token.

**Auth:** JWT

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### POST /api/auth/change-password

Change the current user's password.

**Auth:** JWT

**Request Body:**

```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

### GET /api/auth/me

Get the current authenticated user's profile.

**Auth:** JWT

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "doctor@example.com",
    "role": "DOCTOR",
    "isActive": true,
    "isVerified": false,
    "createdAt": "2026-06-25T10:00:00.000Z",
    "updatedAt": "2026-06-25T10:00:00.000Z",
    "doctor": { ... },
    "mr": null,
    "receptionist": null
  }
}
```

The `password` and `refreshToken` fields are excluded from the response.

**cURL:**

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbG..."
```

---

## 5. Doctors

All routes require JWT authentication (applied globally via middleware).

### GET /api/doctors/profile

Get the authenticated doctor's profile.

**Roles:** DOCTOR (via JWT)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "Dr. John Doe",
    "degree": ["MBBS", "FCPS"],
    "specialization": ["Cardiology"],
    "bmdcRegNo": "A-12345",
    "clinicName": "City Clinic",
    "clinicAddress": "123 Main Street",
    "phone": "01712345678",
    "signatureImg": "signature-abc.png",
    "clinicLogo": "logo-xyz.png",
    "chamberSchedule": null,
    "isProfileComplete": true,
    "createdAt": "2026-06-25T10:00:00.000Z",
    "updatedAt": "2026-06-25T10:00:00.000Z"
  }
}
```

**cURL:**

```bash
curl http://localhost:5000/api/doctors/profile \
  -H "Authorization: Bearer eyJhbG..."
```

### PUT /api/doctors/profile

Update the doctor's profile. Supports multipart file uploads for signature and logo.

**Roles:** DOCTOR (via JWT)

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `fullName` | string | Min 2 chars |
| `degree` | string[] | Array of degrees |
| `specialization` | string[] | Array of specializations |
| `bmdcRegNo` | string | Min 2 chars |
| `clinicName` | string | Min 2 chars |
| `clinicAddress` | string | Min 2 chars |
| `phone` | string | Min 5 chars |
| `chamberSchedule` | JSON | JSON object for chamber schedule |
| `signature` | file | Signature image upload |
| `logo` | file | Clinic logo image upload |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "Dr. John Doe",
    "degree": ["MBBS", "FCPS"],
    "specialization": ["Cardiology"],
    "bmdcRegNo": "A-12345",
    "clinicName": "City Clinic",
    "clinicAddress": "123 Main Street",
    "phone": "01712345678",
    "signatureImg": "signature-abc.png",
    "clinicLogo": "logo-xyz.png",
    "chamberSchedule": null,
    "isProfileComplete": true,
    ...
  }
}
```

### POST /api/doctors/upload-signature

Upload signature image only.

**Roles:** DOCTOR (via JWT)

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `signature` | file | Signature image (single) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "signatureImg": "signature-abc.png"
  }
}
```

### POST /api/doctors/upload-logo

Upload clinic logo image only.

**Roles:** DOCTOR (via JWT)

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `logo` | file | Logo image (single) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "clinicLogo": "logo-xyz.png"
  }
}
```

### DELETE /api/doctors/remove-signature

Remove the doctor's signature image.

**Roles:** DOCTOR (via JWT)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "signatureImg": null
  }
}
```

### DELETE /api/doctors/remove-logo

Remove the doctor's clinic logo.

**Roles:** DOCTOR (via JWT)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "clinicLogo": null
  }
}
```

### GET /api/doctors/subscription

Get the authenticated doctor's subscription details.

**Roles:** DOCTOR (via JWT)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "doctorId": "uuid",
    "planId": "uuid",
    "status": "ACTIVE",
    "patientLimit": 50,
    "prescriptionLimit": 100,
    "startDate": "2026-06-25T10:00:00.000Z",
    "endDate": null,
    "plan": {
      "id": "uuid",
      "name": "Free Plan",
      "description": "Free plan for new doctors",
      "price": 0,
      "patientLimit": 50,
      "prescriptionLimit": 100,
      "duration": 30,
      "isActive": true
    }
  }
}
```

### POST /api/doctors/subscription/activate

Activate a subscription plan.

**Roles:** DOCTOR (via JWT)

**Request Body:**

```json
{
  "planId": "uuid",
  "transactionId": "TXN12345",
  "notes": "Payment via bKash"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `planId` | string (uuid) | Yes | Plan ID |
| `transactionId` | string | No | Payment transaction ID |
| `notes` | string | No | Additional notes |

If the plan price is 0, the subscription is activated immediately (`ACTIVE`). If the price > 0, the status is set to `PENDING` awaiting admin confirmation.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "doctorId": "uuid",
    "planId": "uuid",
    "status": "PENDING",
    "patientLimit": 200,
    "prescriptionLimit": 500,
    "startDate": "2026-06-25T10:00:00.000Z",
    "endDate": "2026-07-25T10:00:00.000Z",
    "plan": { ... }
  }
}
```

### GET /api/doctors/subscription/pending

List pending subscription requests.

**Roles:** SUPER_ADMIN

**Query Parameters:** `?page=1&limit=20&search=`

**Response (200):** Paginated

```json
{
  "data": [ ... ],
  "page": 1,
  "limit": 20,
  "total": 5,
  "totalPages": 1
}
```

### POST /api/doctors/subscription/:id/confirm

Confirm a pending subscription.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "ACTIVE",
    ...
  }
}
```

### POST /api/doctors/subscription/:id/reject

Reject a pending subscription.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

### POST /api/doctors/subscription/:id/cancel

Cancel an active subscription.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

---

## 6. Patients

All routes require JWT + DOCTOR role.

### POST /api/patients

Create a new patient.

**Roles:** DOCTOR

**Request Body:**

```json
{
  "fullName": "Jane Smith",
  "age": 35,
  "gender": "FEMALE",
  "bloodGroup": "A_POSITIVE",
  "weight": 65.5,
  "height": 165,
  "phone": "01798765432",
  "address": "456 Another Street",
  "medicalHistory": "Diabetes",
  "allergies": "Penicillin",
  "previousDiseases": "None",
  "emergencyContact": "01711111111"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | Yes | Min 2 characters |
| `age` | number | Yes | Positive integer |
| `gender` | enum | Yes | `MALE`, `FEMALE`, `OTHER` |
| `bloodGroup` | enum | No | `A_POSITIVE`, `A_NEGATIVE`, `B_POSITIVE`, `B_NEGATIVE`, `AB_POSITIVE`, `AB_NEGATIVE`, `O_POSITIVE`, `O_NEGATIVE` |
| `weight` | number | No | Positive number |
| `height` | number | No | Positive number |
| `phone` | string | No | Min 5 chars (unique per doctor) |
| `address` | string | No | |
| `medicalHistory` | string | No | |
| `allergies` | string | No | |
| `previousDiseases` | string | No | |
| `emergencyContact` | string | No | |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientId": "P-000001",
    "doctorId": "uuid",
    "fullName": "Jane Smith",
    "age": 35,
    "gender": "FEMALE",
    "bloodGroup": "A_POSITIVE",
    "weight": 65.5,
    "height": 165,
    "phone": "01798765432",
    "address": "456 Another Street",
    "medicalHistory": "Diabetes",
    "allergies": "Penicillin",
    "previousDiseases": "None",
    "emergencyContact": "01711111111",
    "createdAt": "2026-06-25T10:00:00.000Z",
    "updatedAt": "2026-06-25T10:00:00.000Z"
  }
}
```

**cURL:**

```bash
curl -X POST http://localhost:5000/api/patients \
  -H "Authorization: Bearer eyJhbG..." \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Jane Smith","age":35,"gender":"FEMALE","bloodGroup":"A_POSITIVE","phone":"01798765432"}'
```

### GET /api/patients

List patients (paginated).

**Roles:** DOCTOR

**Query Parameters:** `?page=1&limit=20&search=jane`

**Response (200):** Paginated

```json
{
  "data": [
    {
      "id": "uuid",
      "patientId": "P-000001",
      "doctorId": "uuid",
      "fullName": "Jane Smith",
      "age": 35,
      "gender": "FEMALE",
      "bloodGroup": "A_POSITIVE",
      "weight": 65.5,
      "height": 165,
      "phone": "01798765432",
      "address": "456 Another Street",
      "medicalHistory": "Diabetes",
      "allergies": "Penicillin",
      "createdAt": "2026-06-25T10:00:00.000Z",
      "updatedAt": "2026-06-25T10:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1,
  "totalPages": 1
}
```

### GET /api/patients/:id

Get a single patient by ID.

**Roles:** DOCTOR

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientId": "P-000001",
    "doctorId": "uuid",
    "fullName": "Jane Smith",
    ...
  }
}
```

### PUT /api/patients/:id

Update a patient.

**Roles:** DOCTOR

**Request Body:** (partial update — all fields optional)

```json
{
  "fullName": "Jane Smith Updated",
  "phone": "01799999999"
}
```

Plus all fields from [create patient schema](#post-__apipatients).

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

### DELETE /api/patients/:id

Delete a patient.

**Roles:** DOCTOR

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Patient deleted successfully"
  }
}
```

---

## 7. Prescriptions

All routes require JWT + DOCTOR role.

### POST /api/prescriptions

Create a new prescription.

**Roles:** DOCTOR

**Request Body:**

```json
{
  "patientId": "uuid",
  "symptoms": "Fever and cough",
  "chiefComplaint": "High fever since 3 days",
  "diagnosis": "Viral fever",
  "diagnosisNotes": "Patient shows signs of viral infection",
  "bloodPressure": "120/80",
  "pulseRate": "72 bpm",
  "temperature": "101.5°F",
  "oxygenSaturation": "98%",
  "medicines": [
    {
      "name": "Paracetamol",
      "strength": "500mg",
      "form": "Tablet",
      "dosage": "1+1+1",
      "frequency": "Three times daily",
      "duration": "5 days",
      "instructions": "After meals"
    }
  ],
  "investigations": [
    {
      "name": "CBC",
      "notes": "Fasting"
    }
  ],
  "advice": "Take rest and drink plenty of fluids",
  "foodAdvice": "Light diet",
  "followUpDate": "2026-07-02",
  "notes": "Patient should return if fever persists"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | string (uuid) | Yes | Patient ID |
| `symptoms` | string | No | |
| `chiefComplaint` | string | No | |
| `diagnosis` | string | No | |
| `diagnosisNotes` | string | No | |
| `bloodPressure` | string | No | |
| `pulseRate` | string | No | |
| `temperature` | string | No | |
| `oxygenSaturation` | string | No | |
| `medicines` | array | Yes | At least 1 medicine |
| `medicines[].name` | string | Yes | |
| `medicines[].strength` | string | No | |
| `medicines[].form` | string | No | |
| `medicines[].dosage` | string | Yes | |
| `medicines[].frequency` | string | Yes | |
| `medicines[].duration` | string | Yes | |
| `medicines[].instructions` | string | No | |
| `investigations` | array | No | |
| `investigations[].name` | string | Yes | |
| `investigations[].notes` | string | No | |
| `advice` | string | No | |
| `foodAdvice` | string | No | |
| `followUpDate` | string (date) | No | |
| `notes` | string | No | |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "prescriptionNo": "RX-000001",
    "doctorId": "uuid",
    "patientId": "uuid",
    "symptoms": "Fever and cough",
    "chiefComplaint": "High fever since 3 days",
    "diagnosis": "Viral fever",
    "diagnosisNotes": "Patient shows signs of viral infection",
    "bloodPressure": "120/80",
    "pulseRate": "72 bpm",
    "temperature": "101.5°F",
    "oxygenSaturation": "98%",
    "advice": "Take rest and drink plenty of fluids",
    "foodAdvice": "Light diet",
    "followUpDate": "2026-07-02T00:00:00.000Z",
    "notes": "Patient should return if fever persists",
    "medicines": [
      {
        "id": "uuid",
        "prescriptionId": "uuid",
        "name": "Paracetamol",
        "strength": "500mg",
        "form": "Tablet",
        "dosage": "1+1+1",
        "frequency": "Three times daily",
        "duration": "5 days",
        "instructions": "After meals"
      }
    ],
    "investigations": [
      {
        "id": "uuid",
        "prescriptionId": "uuid",
        "name": "CBC",
        "notes": "Fasting"
      }
    ],
    "createdAt": "2026-06-25T10:00:00.000Z",
    "updatedAt": "2026-06-25T10:00:00.000Z"
  }
}
```

**cURL:**

```bash
curl -X POST http://localhost:5000/api/prescriptions \
  -H "Authorization: Bearer eyJhbG..." \
  -H "Content-Type: application/json" \
  -d '{"patientId":"uuid","symptoms":"Fever","medicines":[{"name":"Paracetamol","strength":"500mg","dosage":"1+1+1","frequency":"TDS","duration":"5 days"}]}'
```

### GET /api/prescriptions

List prescriptions (paginated).

**Roles:** DOCTOR

**Query Parameters:** `?page=1&limit=20&search=`

**Response (200):** Paginated (same shape as create response per item)

### GET /api/prescriptions/:id

Get a single prescription by ID.

**Roles:** DOCTOR

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

### PUT /api/prescriptions/:id

Update a prescription. All fields optional.

**Roles:** DOCTOR

**Request Body:** Same shape as create, all fields optional.

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

### DELETE /api/prescriptions/:id

Delete a prescription.

**Roles:** DOCTOR

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Prescription deleted"
  }
}
```

### GET /api/prescriptions/:id/pdf

Download prescription as PDF (attachment).

**Roles:** DOCTOR

**Response:** Binary PDF file with header `Content-Disposition: attachment; filename=prescription-{RX_NO}.pdf`

### GET /api/prescriptions/:id/print

View prescription PDF in browser (inline).

**Roles:** DOCTOR

**Response:** Binary PDF file with header `Content-Disposition: inline; filename=prescription.pdf`

---

## 8. Appointments

All routes require JWT + DOCTOR role.

### POST /api/appointments

Create a new appointment.

**Roles:** DOCTOR

**Request Body:**

```json
{
  "patientId": "uuid",
  "date": "2026-07-01",
  "time": "10:30",
  "notes": "Follow-up visit"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | string (uuid) | Yes | Patient ID |
| `date` | string | Yes | ISO date string |
| `time` | string | Yes | Format: `HH:mm` |
| `notes` | string | No | |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "doctorId": "uuid",
    "patientId": "uuid",
    "date": "2026-07-01T00:00:00.000Z",
    "time": "10:30",
    "status": "SCHEDULED",
    "fee": null,
    "paymentStatus": "UNPAID",
    "paymentMethod": null,
    "notes": "Follow-up visit",
    "createdAt": "2026-06-25T10:00:00.000Z",
    "updatedAt": "2026-06-25T10:00:00.000Z"
  }
}
```

### GET /api/appointments

List appointments (paginated).

**Roles:** DOCTOR

**Query Parameters:** `?page=1&limit=20&search=&status=SCHEDULED&dateFrom=2026-06-01&dateTo=2026-07-01`

**Response (200):** Paginated

### GET /api/appointments/today

Get today's appointments.

**Roles:** DOCTOR

**Response (200):**

```json
{
  "success": true,
  "data": [ ... ]
}
```

### PATCH /api/appointments/:id

Update an appointment.

**Roles:** DOCTOR

**Request Body:**

```json
{
  "status": "COMPLETED",
  "notes": "Patient treated"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum | No | `SCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| `notes` | string | No | |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "notes": "Patient treated",
    ...
  }
}
```

---

## 9. Plans

All routes require JWT authentication. Write operations additionally require SUPER_ADMIN role.

### GET /api/plans

List all active plans.

**Roles:** Any authenticated user

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Free Plan",
      "description": "Free plan for new doctors",
      "price": 0,
      "patientLimit": 50,
      "prescriptionLimit": 100,
      "duration": 30,
      "isActive": true,
      "createdAt": "2026-06-25T10:00:00.000Z",
      "updatedAt": "2026-06-25T10:00:00.000Z"
    },
    {
      "id": "uuid",
      "name": "Pro Plan",
      "description": "Unlimited patients and prescriptions",
      "price": 999,
      "patientLimit": 1000,
      "prescriptionLimit": 5000,
      "duration": 365,
      "isActive": true,
      ...
    }
  ]
}
```

**cURL:**

```bash
curl http://localhost:5000/api/plans \
  -H "Authorization: Bearer eyJhbG..."
```

### GET /api/plans/:id

Get a single plan by ID.

**Roles:** Any authenticated user

**Response (200):** Single plan object

### POST /api/plans

Create a new plan.

**Roles:** SUPER_ADMIN

**Request Body:**

```json
{
  "name": "Gold Plan",
  "description": "Best for busy clinics",
  "price": 1999,
  "patientLimit": 500,
  "prescriptionLimit": 2000,
  "duration": 365
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Max 100 chars |
| `description` | string | No | Max 500 chars |
| `price` | number | Yes | >= 0 |
| `patientLimit` | number | Yes | Integer >= 0 |
| `prescriptionLimit` | number | Yes | Integer >= 0 |
| `duration` | number | Yes | Integer >= 1 (days) |

**Response (201):** Created plan object

### PUT /api/plans/:id

Update a plan.

**Roles:** SUPER_ADMIN

**Request Body:** Partial update (all fields optional, plus `isActive`)

```json
{
  "name": "Gold Plan Plus",
  "price": 2499,
  "isActive": true
}
```

**Response (200):** Updated plan object

### DELETE /api/plans/:id

Soft-delete a plan (sets `isActive` to false).

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Plan deleted"
  }
}
```

---

## 10. Medical Representatives (MR)

All routes require JWT authentication. Routes are split between MR self-service endpoints and SUPER_ADMIN management endpoints.

### MR Self-Service Endpoints (Role: MEDICAL_REPRESENTATIVE)

#### GET /api/mr/dashboard

Get MR dashboard statistics.

**Roles:** MEDICAL_REPRESENTATIVE

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalDoctors": 5,
    "totalPatients": 150,
    "totalPrescriptions": 300,
    "totalSubscriptions": 3
  }
}
```

#### GET /api/mr/doctors

List doctors assigned to the MR (paginated).

**Roles:** MEDICAL_REPRESENTATIVE

**Query Parameters:** `?page=1&limit=20`

**Response (200):** Paginated

#### GET /api/mr/doctors/:doctorId/patients

View patients of an assigned doctor.

**Roles:** MEDICAL_REPRESENTATIVE

**Response (200):**

```json
{
  "success": true,
  "data": [ ... ]
}
```

#### GET /api/mr/doctors/:doctorId/prescriptions

View prescriptions of an assigned doctor (paginated).

**Roles:** MEDICAL_REPRESENTATIVE

**Query Parameters:** `?page=1&limit=20`

**Response (200):** Paginated

#### GET /api/mr/doctors/:doctorId/prescriptions/:id

View a specific prescription.

**Roles:** MEDICAL_REPRESENTATIVE

**Response (200):** Prescription object

#### GET /api/mr/doctors/:doctorId/prescriptions/:id/pdf

Download a doctor's prescription as PDF.

**Roles:** MEDICAL_REPRESENTATIVE

**Response:** Binary PDF

#### GET /api/mr/subscriptions

Get subscriptions managed by the MR (paginated).

**Roles:** MEDICAL_REPRESENTATIVE

**Response (200):**

```json
{
  "data": [ ... ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "mr": { "id": "uuid", "fullName": "MR Name", "company": "Pharma Ltd" },
  "platform": "Prescribe Pro"
}
```

#### POST /api/mr/doctors/:doctorId/subscribe

Subscribe a doctor to a plan on behalf of the MR.

**Roles:** MEDICAL_REPRESENTATIVE

**Request Body:**

```json
{
  "planId": "uuid",
  "transactionId": "TXN12345",
  "notes": "Payment collected by MR"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `planId` | string (uuid) | Yes | Plan ID |
| `transactionId` | string | No | Payment transaction ID |
| `notes` | string | No | |

**Response (201):** Subscription object

#### GET /api/mr/my-profile

Get the MR's own profile.

**Roles:** MEDICAL_REPRESENTATIVE

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "John MR",
    "phone": "01712345678",
    "company": "Pharma Ltd",
    "department": "Sales",
    "designation": "Senior Representative",
    "createdAt": "2026-06-25T10:00:00.000Z",
    "updatedAt": "2026-06-25T10:00:00.000Z"
  }
}
```

#### PUT /api/mr/my-profile

Update the MR's own profile.

**Roles:** MEDICAL_REPRESENTATIVE

**Request Body:**

```json
{
  "fullName": "John MR Updated",
  "phone": "01799999999",
  "company": "Pharma Ltd",
  "department": "Marketing",
  "designation": "Regional Manager"
}
```

**Response (200):** Updated profile object

### SUPER_ADMIN MR Management Endpoints

#### GET /api/mr/available-doctors

List doctors available for MR assignment.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": [ ... ]
}
```

#### GET /api/mr

List all MRs (paginated).

**Roles:** SUPER_ADMIN

**Query Parameters:** `?page=1&limit=20&search=`

**Response (200):** Paginated

#### GET /api/mr/:id

Get an MR by ID.

**Roles:** SUPER_ADMIN

**Response (200):** MR object

#### POST /api/mr

Create a new MR user.

**Roles:** SUPER_ADMIN

**Request Body:**

```json
{
  "email": "mr@example.com",
  "password": "123456",
  "fullName": "New MR",
  "phone": "01712345678",
  "company": "Pharma Ltd",
  "department": "Sales",
  "designation": "Representative"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email |
| `password` | string | Yes | Min 6 characters |
| `fullName` | string | Yes | Min 2 characters |
| `phone` | string | Yes | Min 5 characters |
| `company` | string | Yes | Min 1 character |
| `department` | string | No | |
| `designation` | string | No | |

**Response (201):** Created MR object

#### PUT /api/mr/:id

Update an MR.

**Roles:** SUPER_ADMIN

**Request Body:** Partial update

```json
{
  "fullName": "Updated MR Name",
  "phone": "01799999999"
}
```

**Response (200):** Updated MR object

#### DELETE /api/mr/:id

Delete an MR.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

#### POST /api/mr/:id/assign

Assign doctors to an MR.

**Roles:** SUPER_ADMIN

**Request Body:**

```json
{
  "doctorIds": ["uuid1", "uuid2", "uuid3"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `doctorIds` | string[] | Yes | Array of doctor UUIDs |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Doctors assigned successfully",
    "count": 3
  }
}
```

---

## 11. Receptionist

All routes require JWT authentication. Routes are split by role (SUPER_ADMIN, DOCTOR, RECEPTIONIST).

### SUPER_ADMIN Endpoints

#### GET /api/receptionist

List all receptionists (paginated).

**Roles:** SUPER_ADMIN

**Response (200):** Paginated

#### POST /api/receptionist

Create a receptionist.

**Roles:** SUPER_ADMIN

**Request Body:**

```json
{
  "email": "receptionist@example.com",
  "password": "123456",
  "fullName": "Receptionist Name",
  "phone": "01712345678"
}
```

**Response (201):** Created receptionist object

#### DELETE /api/receptionist/:id

Delete a receptionist.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

### DOCTOR Endpoints (Manage Own Receptionists)

#### GET /api/receptionist/my

List the doctor's own receptionists (paginated).

**Roles:** DOCTOR

**Response (200):** Paginated

#### POST /api/receptionist/my

Create a receptionist under the doctor's account.

**Roles:** DOCTOR

**Request Body:**

```json
{
  "email": "receptionist@clinic.com",
  "password": "123456",
  "fullName": "Receptionist Name",
  "phone": "01712345678"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email |
| `password` | string | Yes | Min 6 characters |
| `fullName` | string | Yes | Min 2 characters |
| `phone` | string | Yes | Min 5 characters |

**Response (201):** Created receptionist user object

#### PUT /api/receptionist/my/:id

Update a receptionist.

**Roles:** DOCTOR

**Request Body:** Partial update

**Response (200):** Updated receptionist object

#### PATCH /api/receptionist/my/:id/toggle-status

Toggle a receptionist's active status.

**Roles:** DOCTOR

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isActive": false,
    ...
  }
}
```

#### POST /api/receptionist/my/:id/reset-password

Reset a receptionist's password.

**Roles:** DOCTOR

**Request Body:**

```json
{
  "newPassword": "newpass123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

#### DELETE /api/receptionist/my/:id

Delete a receptionist.

**Roles:** DOCTOR

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

### RECEPTIONIST Endpoints (Self-Service)

#### GET /api/receptionist/dashboard

Get receptionist dashboard statistics.

**Roles:** RECEPTIONIST

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

#### GET /api/receptionist/patients

List patients (paginated).

**Roles:** RECEPTIONIST

**Query Parameters:** `?page=1&limit=20&search=`

**Response (200):** Paginated (same shape as doctor's patient list)

#### POST /api/receptionist/patients

Create a patient. Same schema as [doctor's create patient](#post-__apipatients).

**Roles:** RECEPTIONIST

**Response (201):** Patient object

#### GET /api/receptionist/patients/:id

Get a patient by ID.

**Roles:** RECEPTIONIST

**Response (200):** Patient object

#### PUT /api/receptionist/patients/:id

Update a patient.

**Roles:** RECEPTIONIST

**Response (200):** Updated patient object

#### GET /api/receptionist/appointments

List appointments (paginated).

**Roles:** RECEPTIONIST

**Response (200):** Paginated

#### GET /api/receptionist/appointments/today

Get today's appointments.

**Roles:** RECEPTIONIST

**Response (200):**

```json
{
  "success": true,
  "data": [ ... ]
}
```

#### GET /api/receptionist/appointments/:id

Get an appointment by ID.

**Roles:** RECEPTIONIST

**Response (200):** Appointment object

#### POST /api/receptionist/appointments

Create an appointment (includes payment fields).

**Roles:** RECEPTIONIST

**Request Body:**

```json
{
  "patientId": "uuid",
  "date": "2026-07-01",
  "time": "10:30",
  "fee": 500,
  "paymentStatus": "PAID",
  "paymentMethod": "CASH",
  "notes": "Walk-in patient"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | string (uuid) | Yes | Patient ID |
| `date` | string | Yes | ISO date string |
| `time` | string | Yes | Format: `HH:mm` |
| `fee` | number | No | Positive fee amount |
| `paymentStatus` | enum | No | `PAID`, `UNPAID` |
| `paymentMethod` | enum | No | `CASH`, `CARD`, `BKASH`, `NAGAD`, `ROCKET`, `OTHER` |
| `notes` | string | No | |

**Response (201):** Appointment object

#### PATCH /api/receptionist/appointments/:id

Update an appointment.

**Roles:** RECEPTIONIST

**Request Body:** Partial update (supports all appointment fields)

**Response (200):** Updated appointment object

#### GET /api/receptionist/prescriptions

List prescriptions (paginated).

**Roles:** RECEPTIONIST

**Response (200):** Paginated

#### GET /api/receptionist/prescriptions/:id

Get a prescription by ID.

**Roles:** RECEPTIONIST

**Response (200):** Prescription object

#### GET /api/receptionist/prescriptions/:id/pdf

Download a prescription as PDF.

**Roles:** RECEPTIONIST

**Response:** Binary PDF

---

## 12. Admin

All routes require JWT + SUPER_ADMIN role.

### GET /api/admin/dashboard

Get admin dashboard statistics.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalDoctors": 100,
    "totalPatients": 5000,
    "totalPrescriptions": 15000,
    "totalRevenue": 250000,
    "activeSubscriptions": 80,
    "pendingSubscriptions": 5
  }
}
```

### GET /api/admin/doctors

List all doctors (paginated).

**Roles:** SUPER_ADMIN

**Query Parameters:** `?page=1&limit=20&search=&status=ACTIVE&dateFrom=2026-01-01&dateTo=2026-06-25`

**Response (200):** Paginated

### PATCH /api/admin/doctors/:userId/approve

Approve a doctor.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Doctor approved successfully"
  }
}
```

### PATCH /api/admin/doctors/:userId/verify

Toggle a doctor's verification status.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Doctor verified successfully"
  }
}
```

### PATCH /api/admin/doctors/:userId/status

Toggle a doctor's active status.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Doctor status updated"
  }
}
```

### GET /api/admin/users/:userId

Get user details by ID.

**Roles:** SUPER_ADMIN

**Response (200):** User object (with doctor/mr/receptionist relations)

### PATCH /api/admin/users/:userId/status

Toggle a user's active status.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "User activated successfully"
  }
}
```

### DELETE /api/admin/doctors/:userId

Delete a doctor (by user ID).

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Doctor deleted successfully"
  }
}
```

### POST /api/admin/doctors/:userId/reset-password

Reset a doctor's password.

**Roles:** SUPER_ADMIN

**Request Body:**

```json
{
  "newPassword": "newpass123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

### POST /api/admin/users/:userId/reset-password

Reset any user's password.

**Roles:** SUPER_ADMIN

**Request Body:**

```json
{
  "newPassword": "newpass123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

### GET /api/admin/subscriptions

List all subscriptions (paginated).

**Roles:** SUPER_ADMIN

**Query Parameters:** `?page=1&limit=20`

**Response (200):** Paginated

### PATCH /api/admin/subscriptions/:id

Update a subscription.

**Roles:** SUPER_ADMIN

**Request Body:**

```json
{
  "planId": "uuid",
  "status": "ACTIVE",
  "patientLimit": 500,
  "prescriptionLimit": 2000
}
```

**Response (200):** Updated subscription object

### POST /api/admin/doctors/:doctorId/clear-mr

Clear all MR assignments for a doctor.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

### GET /api/admin/plans

List all plans (including inactive).

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": [ ... ]
}
```

### GET /api/admin/plans/:id

Get a plan by ID.

**Roles:** SUPER_ADMIN

**Response (200):** Plan object

### POST /api/admin/plans

Create a plan. Same schema as [plans POST](#post-__apiplans).

**Roles:** SUPER_ADMIN

**Response (201):** Created plan object

### PUT /api/admin/plans/:id

Update a plan.

**Roles:** SUPER_ADMIN

**Response (200):** Updated plan object

### DELETE /api/admin/plans/:id

Delete a plan.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Plan deleted successfully"
  }
}
```

---

## 13. Notifications

All routes require JWT authentication.

### GET /api/notifications

List all notifications for the authenticated user.

**Roles:** Any authenticated user

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "New Update",
      "message": "Your subscription will expire soon",
      "type": "SUBSCRIPTION",
      "isRead": false,
      "createdAt": "2026-06-25T10:00:00.000Z"
    }
  ]
}
```

### GET /api/notifications/unread

Get count of unread notifications.

**Roles:** Any authenticated user

**Response (200):**

```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

### PATCH /api/notifications/:id/read

Mark a notification as read.

**Roles:** Any authenticated user

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Marked as read"
  }
}
```

---

## 14. Stats / Subscriptions

All routes require JWT authentication. **Note:** These routes are mounted at `/api/stats` but handle subscription and statistics functionality.

### GET /api/stats/doctor

Get doctor dashboard statistics.

**Roles:** DOCTOR

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalPatients": 150,
    "totalPrescriptions": 300,
    "totalAppointments": 50,
    "todayAppointments": 5,
    "subscription": { ... }
  }
}
```

### GET /api/stats/admin

Get admin dashboard statistics.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalDoctors": 100,
    "totalPatients": 5000,
    "totalPrescriptions": 15000,
    "totalRevenue": 250000,
    "activeSubscriptions": 80,
    "pendingSubscriptions": 5
  }
}
```

### GET /api/stats/admin/doctors

List all doctors (admin view, paginated).

**Roles:** SUPER_ADMIN

**Query Parameters:** `?page=1&limit=20`

**Response (200):** Paginated

### GET /api/stats/admin/users

List all users (paginated).

**Roles:** SUPER_ADMIN

**Response (200):** Paginated

### GET /api/stats/admin/subscriptions

List all subscriptions (paginated).

**Roles:** SUPER_ADMIN

**Response (200):** Paginated

### GET /api/stats/admin/patients

List all patients (paginated).

**Roles:** SUPER_ADMIN

**Response (200):** Paginated

### GET /api/stats/my

Get the authenticated doctor's subscription details.

**Roles:** DOCTOR

**Response (200):** Subscription object (same as `GET /api/doctors/subscription`)

### GET /api/stats/logs

Get activity/audit logs (paginated).

**Roles:** SUPER_ADMIN

**Query Parameters:** `?page=1&limit=20`

**Response (200):** Paginated

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "action": "LOGIN",
      "entity": "User",
      "entityId": "uuid",
      "details": null,
      "ipAddress": "::1",
      "createdAt": "2026-06-25T10:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 500,
  "totalPages": 25
}
```

### DELETE /api/stats/logs/bulk

Bulk delete audit logs by IDs.

**Roles:** SUPER_ADMIN

**Request Body:**

```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "deleted": 3
  }
}
```

### DELETE /api/stats/logs/:id

Delete a single audit log.

**Roles:** SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Log deleted"
  }
}
```

### DELETE /api/stats/logs

Delete all audit logs (optionally filtered by date range).

**Roles:** SUPER_ADMIN

**Query Parameters:** `?startDate=2026-01-01&endDate=2026-06-01`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "deleted": 100
  }
}
```

### POST /api/stats/activate

Activate a subscription plan.

**Roles:** DOCTOR

**Request Body:**

```json
{
  "planId": "uuid"
}
```

**Response (200):** Subscription object

---

## Static Files

Served at `/uploads/` for uploaded images (signatures, logos).

```
http://localhost:5000/uploads/signature-abc.png
http://localhost:5000/uploads/logo-xyz.png
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Access token signing secret | - |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | - |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `FRONTEND_URL` | CORS allowed origins | - |
| `NODE_ENV` | Environment (development/production/test) | `development` |
