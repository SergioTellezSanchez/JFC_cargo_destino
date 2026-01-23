# TECH STACK - JFC CARGO DESTINO

## ÍNDICE

1. [Frontend Technologies](#frontend-technologies)
2. [Backend Technologies](#backend-technologies)
3. [Database & Storage](#database--storage)
4. [Third-Party Integrations](#third-party-integrations)
5. [DevOps & Infrastructure](#devops--infrastructure)
6. [Development Tools](#development-tools)

---

## FRONTEND TECHNOLOGIES

### 1. Mobile App (Conductor)

**Platform**: Progressive Web App (PWA) o React Native

#### Option A: PWA (Recomendado para MVP)

**Ventajas:**
- Un solo codebase para iOS y Android
- Deployment más rápido
- Menor costo de desarrollo
- Acceso a APIs web modernas

**Tech Stack:**
```json
{
  "framework": "Next.js 16 (App Router)",
  "runtime": "React 19",
  "language": "TypeScript 5.3+",
  "styling": "Tailwind CSS 4",
  "state": {
    "server": "React Query (TanStack Query)",
    "client": "Context API + useReducer"
  },
  "maps": "react-google-maps",
  "camera": "Web Camera API",
  "geolocation": "Geolocation API",
  "offline": "Workbox (Service Workers)",
  "push": "Firebase Cloud Messaging (FCM)",
  "barcode": "html5-qrcode",
  "signature": "@react-native-community/signature-pad (web version)"
}
```

**Key Features:**
- Offline-first architecture
- Background geolocation
- Push notifications
- Camera access
- Signature capture
- Barcode/QR scanning

#### Option B: React Native (Para producción escalada)

**Tech Stack:**
```json
{
  "framework": "React Native 0.73+",
  "language": "TypeScript",
  "navigation": "React Navigation 6",
  "state": "React Query + Zustand",
  "maps": "react-native-maps",
  "camera": "react-native-camera",
  "geolocation": "react-native-geolocation-service",
  "offline": "WatermelonDB",
  "push": "React Native Firebase",
  "barcode": "react-native-vision-camera + ML Kit"
}
```

---

### 2. Customer Portal (Cliente)

**Platform**: Web Application

**Tech Stack:**
```json
{
  "framework": "Next.js 16 (App Router)",
  "runtime": "React 19",
  "language": "TypeScript 5.3+",
  "styling": "Tailwind CSS 4",
  "components": "shadcn/ui",
  "forms": "React Hook Form + Zod",
  "state": {
    "server": "React Query",
    "client": "Context API"
  },
  "maps": "react-google-maps",
  "charts": "Recharts",
  "payments": {
    "stripe": "@stripe/stripe-js",
    "paypal": "@paypal/react-paypal-js"
  },
  "realtime": "Socket.io-client",
  "animations": "Framer Motion"
}
```

**Pages:**
- `/` - Landing page
- `/login` - Authentication
- `/dashboard` - Client dashboard
- `/orders/new` - Create order
- `/orders/[id]` - Order details + tracking
- `/orders/[id]/track` - Live tracking map
- `/invoices` - Billing history
- `/support` - Support chat
- `/profile` - User settings

---

### 3. Carrier Portal (Transportista)

**Platform**: Web Application

**Tech Stack:**
```json
{
  "framework": "Next.js 16 (App Router)",
  "runtime": "React 19",
  "language": "TypeScript 5.3+",
  "styling": "Tailwind CSS 4",
  "components": "shadcn/ui",
  "state": "React Query + Context API",
  "maps": "react-google-maps",
  "charts": "Recharts + Tremor",
  "tables": "TanStack Table",
  "realtime": "Socket.io-client"
}
```

**Pages:**
- `/dashboard` - Fleet overview
- `/auctions` - Auction marketplace
- `/drivers` - Driver management
- `/vehicles` - Fleet management
- `/analytics` - Profitability dashboard
- `/orders` - Order history
- `/settings` - Company settings

---

### 4. Super Admin Zone

**Platform**: Web Application

**Tech Stack:**
```json
{
  "framework": "Next.js 16 (App Router)",
  "runtime": "React 19",
  "language": "TypeScript 5.3+",
  "styling": "Tailwind CSS 4",
  "components": "shadcn/ui + Tremor",
  "state": "React Query + Context API",
  "maps": "react-google-maps",
  "charts": "Recharts + D3.js",
  "tables": "TanStack Table",
  "realtime": "Socket.io-client"
}
```

**Pages:**
- `/admin/dashboard` - Executive dashboard
- `/admin/orders` - Order management
- `/admin/auctions` - Auction management
- `/admin/users` - User management
- `/admin/risk-zones` - Risk zone editor
- `/admin/analytics` - Advanced analytics
- `/admin/support` - Support tickets
- `/admin/settings` - System settings
- `/admin/audit` - Audit logs

---

### 5. Warehouse Portal

**Platform**: Web Application (Tablet-optimized)

**Tech Stack:**
```json
{
  "framework": "Next.js 16",
  "runtime": "React 19",
  "language": "TypeScript",
  "styling": "Tailwind CSS 4",
  "components": "shadcn/ui",
  "barcode": "html5-qrcode",
  "camera": "Web Camera API",
  "state": "React Query"
}
```

---

### 6. Customs Portal

**Platform**: Web Application

**Tech Stack:**
```json
{
  "framework": "Next.js 16",
  "runtime": "React 19",
  "language": "TypeScript",
  "styling": "Tailwind CSS 4",
  "components": "shadcn/ui",
  "documents": "react-pdf",
  "state": "React Query"
}
```

---

## BACKEND TECHNOLOGIES

### Core System

**Runtime**: Node.js 20 LTS

**Framework Options:**

#### Option A: Express.js (Recomendado para MVP)
```json
{
  "framework": "Express.js 4.18+",
  "language": "TypeScript",
  "validation": "Zod",
  "auth": "Firebase Admin SDK",
  "cors": "cors",
  "security": "helmet",
  "rateLimit": "express-rate-limit",
  "logging": "winston + morgan"
}
```

#### Option B: Fastify (Para alta performance)
```json
{
  "framework": "Fastify 4.x",
  "language": "TypeScript",
  "validation": "Zod + Fastify Schema",
  "auth": "Firebase Admin SDK",
  "plugins": [
    "@fastify/cors",
    "@fastify/helmet",
    "@fastify/rate-limit",
    "@fastify/websocket"
  ]
}
```

### State Management

**Library**: XState 5

```typescript
// Example: Order State Machine
import { createMachine } from 'xstate';

const orderMachine = createMachine({
  id: 'order',
  initial: 'draft',
  states: {
    draft: {
      on: { QUOTE: 'quoted' }
    },
    quoted: {
      on: { 
        ACCEPT: 'pending_assignment',
        REJECT: 'rejected'
      }
    },
    pending_assignment: {
      on: { ASSIGN: 'assigned' }
    },
    assigned: {
      on: { 
        CONFIRM: 'assigned_confirmed',
        REJECT: 'rejected'
      }
    },
    assigned_confirmed: {
      on: { START_TRIP: 'in_transit' }
    },
    in_transit: {
      on: { 
        DELIVER: 'delivered',
        PAUSE: 'paused_security'
      }
    },
    delivered: {
      on: { COMPLETE: 'completed' }
    },
    completed: { type: 'final' }
  }
});
```

### Queue System

**Library**: Bull 4 + Redis

```typescript
import Queue from 'bull';

// Notification queue
const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST,
    port: 6379
  }
});

// Process notifications
notificationQueue.process(async (job) => {
  const { userId, type, message } = job.data;
  
  switch (type) {
    case 'sms':
      await sendSMS(userId, message);
      break;
    case 'email':
      await sendEmail(userId, message);
      break;
    case 'push':
      await sendPushNotification(userId, message);
      break;
  }
});
```

### WebSocket Server

**Library**: Socket.io 4

```typescript
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS,
    credentials: true
  }
});

io.use(async (socket, next) => {
  // Auth middleware
  const token = socket.handshake.auth.token;
  const user = await verifyToken(token);
  socket.userId = user.uid;
  next();
});
```

### Event Bus

**Options:**

#### Option A: EventEmitter (Simple, para MVP)
```typescript
import { EventEmitter } from 'events';

class OrderEventBus extends EventEmitter {}
const orderEvents = new OrderEventBus();

// Emit event
orderEvents.emit('order:created', orderData);

// Listen to event
orderEvents.on('order:created', async (order) => {
  await sendNotification(order.clientId, 'Order created');
});
```

#### Option B: RabbitMQ (Escalable, para producción)
```json
{
  "library": "amqplib",
  "exchanges": ["orders", "tracking", "incidents"],
  "queues": ["notifications", "analytics", "webhooks"]
}
```

#### Option C: AWS EventBridge (Cloud-native)
```json
{
  "service": "AWS EventBridge",
  "sdk": "@aws-sdk/client-eventbridge"
}
```

---

## DATABASE & STORAGE

### Primary Database

**Service**: Firebase Firestore

**Configuration:**
```typescript
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = getFirestore(app);

// Enable offline persistence (client-side)
import { enableIndexedDbPersistence } from 'firebase/firestore';
await enableIndexedDbPersistence(db);
```

**Indexes Required:**
```javascript
// Composite indexes
[
  {
    collection: 'orders',
    fields: [
      { field: 'carrierId', order: 'ASCENDING' },
      { field: 'status', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'tracking',
    fields: [
      { field: 'orderId', order: 'ASCENDING' },
      { field: 'timestamp', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'auctions',
    fields: [
      { field: 'status', order: 'ASCENDING' },
      { field: 'expiresAt', order: 'ASCENDING' }
    ]
  }
]
```

### Cache Layer

**Service**: Redis 7

**Use Cases:**
- Session storage
- Queue backend (Bull)
- Hot data caching (tracking, ETA)
- Rate limiting

**Configuration:**
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Cache tracking data
await redis.setex(
  `tracking:${orderId}`,
  10, // 10 seconds TTL
  JSON.stringify(trackingData)
);
```

### Analytics Database

**Service**: Google BigQuery

**Schema:**
```sql
CREATE TABLE jfc_analytics.profitability (
  order_id STRING,
  carrier_id STRING,
  driver_id STRING,
  revenue FLOAT64,
  costs STRUCT<
    fuel FLOAT64,
    salary FLOAT64,
    tolls FLOAT64,
    depreciation FLOAT64,
    total FLOAT64
  >,
  margin FLOAT64,
  roi FLOAT64,
  distance FLOAT64,
  duration FLOAT64,
  type STRING,
  timestamp TIMESTAMP
);
```

### File Storage

**Service**: AWS S3 / Google Cloud Storage

**Buckets:**
- `jfc-documents` - PODs, invoices, contracts
- `jfc-photos` - Delivery photos, signatures
- `jfc-backups` - Database backups

**Configuration:**
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

// Upload file
await s3.send(new PutObjectCommand({
  Bucket: 'jfc-documents',
  Key: `pods/${orderId}.pdf`,
  Body: pdfBuffer,
  ContentType: 'application/pdf'
}));
```

---

## THIRD-PARTY INTEGRATIONS

### Payments

#### Stripe
```json
{
  "library": "stripe",
  "version": "14.x",
  "features": [
    "Payment Intents",
    "Webhooks",
    "Refunds",
    "Payment Methods"
  ]
}
```

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: order.pricing.total * 100, // cents
  currency: 'mxn',
  metadata: { orderId: order.id }
});
```

#### PayPal
```json
{
  "library": "@paypal/checkout-server-sdk",
  "version": "1.x"
}
```

### Communications

#### Twilio (SMS)
```json
{
  "library": "twilio",
  "version": "4.x",
  "features": ["SMS", "WhatsApp (future)"]
}
```

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

await client.messages.create({
  to: '+52' + phone,
  from: process.env.TWILIO_PHONE_NUMBER,
  body: message
});
```

#### SendGrid (Email)
```json
{
  "library": "@sendgrid/mail",
  "version": "7.x"
}
```

### Maps & Geolocation

#### Google Maps Platform
```json
{
  "library": "@googlemaps/google-maps-services-js",
  "version": "3.x",
  "APIs": [
    "Directions API",
    "Geocoding API",
    "Distance Matrix API",
    "Geofencing (Maps JavaScript API)",
    "Places API"
  ]
}
```

```typescript
import { Client } from '@googlemaps/google-maps-services-js';

const mapsClient = new Client({});

// Calculate route
const directions = await mapsClient.directions({
  params: {
    origin: originAddress,
    destination: destAddress,
    mode: 'driving',
    departure_time: 'now',
    key: process.env.GOOGLE_MAPS_API_KEY
  }
});
```

### GPS Tracking

#### Samsara
```json
{
  "API": "Samsara Fleet API",
  "version": "2023-12-01",
  "features": [
    "Vehicle Location",
    "Driver Status",
    "Fuel Consumption",
    "Engine Diagnostics"
  ]
}
```

### AI & Analytics

#### Claude API (Anthropic)
```json
{
  "library": "@anthropic-ai/sdk",
  "version": "0.9.x",
  "model": "claude-3-sonnet-20240229"
}
```

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: userMessage
  }]
});
```

#### Google Analytics
```json
{
  "library": "react-ga4",
  "version": "2.x"
}
```

### Document Processing

#### OCR - Google Vision API
```json
{
  "library": "@google-cloud/vision",
  "version": "4.x"
}
```

#### PDF Generation
```json
{
  "library": "pdfkit",
  "version": "0.14.x"
}
```

---

## DEVOPS & INFRASTRUCTURE

### Cloud Provider

**Primary**: AWS / Google Cloud Platform

#### AWS Services
```json
{
  "compute": "ECS Fargate / Lambda",
  "storage": "S3",
  "database": "Firestore (Firebase)",
  "cache": "ElastiCache (Redis)",
  "cdn": "CloudFront",
  "monitoring": "CloudWatch",
  "secrets": "Secrets Manager"
}
```

#### GCP Services
```json
{
  "compute": "Cloud Run / Cloud Functions",
  "storage": "Cloud Storage",
  "database": "Firestore",
  "cache": "Memorystore (Redis)",
  "cdn": "Cloud CDN",
  "monitoring": "Cloud Monitoring",
  "secrets": "Secret Manager"
}
```

### CI/CD

**Platform**: GitHub Actions

**Workflows:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - uses: docker/build-push-action@v4
        with:
          push: true
          tags: jfc-cargo:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS ECS
        run: |
          aws ecs update-service \
            --cluster jfc-cluster \
            --service jfc-api \
            --force-new-deployment
```

### Monitoring & Logging

#### Application Monitoring
```json
{
  "errors": "Sentry",
  "rum": "LogRocket",
  "apm": "New Relic / Datadog"
}
```

#### Infrastructure Monitoring
```json
{
  "metrics": "CloudWatch / Prometheus",
  "logs": "CloudWatch Logs / ELK Stack",
  "alerts": "PagerDuty"
}
```

### CDN

**Service**: Cloudflare

**Features:**
- Static asset caching
- DDoS protection
- SSL/TLS
- Web Application Firewall (WAF)

---

## DEVELOPMENT TOOLS

### Code Quality

```json
{
  "linter": "ESLint 8",
  "formatter": "Prettier",
  "typeChecker": "TypeScript",
  "testing": {
    "unit": "Vitest",
    "integration": "Playwright",
    "e2e": "Cypress"
  },
  "preCommit": "Husky + lint-staged"
}
```

### Package Manager

**Recommended**: pnpm 8

**Advantages:**
- Faster installs
- Disk space efficient
- Strict dependency resolution

### Monorepo (Optional)

**Tool**: Turborepo

**Structure:**
```
jfc-cargo/
├── apps/
│   ├── customer-portal/
│   ├── carrier-portal/
│   ├── admin-zone/
│   ├── mobile-app/
│   └── api/
├── packages/
│   ├── ui/ (shared components)
│   ├── utils/ (shared utilities)
│   ├── types/ (shared types)
│   └── config/ (shared configs)
└── turbo.json
```

---

## ENVIRONMENT VARIABLES

```bash
# Firebase
FIREBASE_PROJECT_ID=jfc-cargo-prod
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Database
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=...

# APIs
GOOGLE_MAPS_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
SENDGRID_API_KEY=...
ANTHROPIC_API_KEY=...
SAMSARA_API_TOKEN=...

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_DOCUMENTS=jfc-documents
S3_BUCKET_PHOTOS=jfc-photos

# App
NODE_ENV=production
PORT=3000
API_URL=https://api.jfccargo.com
FRONTEND_URL=https://app.jfccargo.com
```

---

**Última actualización**: 2026-01-20  
**Versión**: 1.0  
**Autor**: Equipo JFC Cargo Destino
