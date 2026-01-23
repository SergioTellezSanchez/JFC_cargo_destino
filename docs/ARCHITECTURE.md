# ARQUITECTURA JFC CARGO DESTINO
## Sistema de Gestión Logística con Marketplace de Subastas

---

## VISIÓN GENERAL

JFC Cargo Destino es una plataforma integral de gestión logística que conecta clientes, transportistas, conductores, almacenes y agentes aduanales en un ecosistema digital completo. El diferenciador clave es el **sistema de subastas** que permite a los conductores tomar cargas de regreso, maximizando la utilización de la flota y la rentabilidad.

---

## ARQUITECTURA DE 4 CAPAS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CAPA 1: INTERFACES DE USUARIO                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ MOBILE APP   │  │  CUSTOMER    │  │   CARRIER    │  │ SUPER ADMIN  │   │
│  │ (Conductor)  │  │   PORTAL     │  │   PORTAL     │  │     ZONE     │   │
│  │              │  │  (Cliente)   │  │(Transportista│  │   (Admin)    │   │
│  │ - Tracking   │  │              │  │              │  │              │   │
│  │ - Entregas   │  │ - Crear orden│  │ - Gestión    │  │ - User Mgmt  │   │
│  │ - Subastas   │  │ - Tracking   │  │   flota      │  │ - Analytics  │   │
│  │ - Reportes   │  │ - Documentos │  │ - Dashboard  │  │ - Security   │   │
│  │ - Offline    │  │ - Pagos      │  │   Subastas   │  │ - Verification│  │
│  │              │  │ - Cotizar    │  │ - Rentabilidad│ │ - Risk Zones │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐                                        │
│  │  WAREHOUSE   │  │   CUSTOMS    │                                        │
│  │   PORTAL     │  │   PORTAL     │                                        │
│  │  (Almacén)   │  │ (Aduanas)    │                                        │
│  │              │  │              │                                        │
│  │ - Management │  │ - Admin      │                                        │
│  │ - Capacity   │  │ - Tracking   │                                        │
│  │ - Inventory  │  │ - Docs       │                                        │
│  └──────────────┘  └──────────────┘                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ Bidireccional
                                    │ REST API / WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CAPA 2: JFC CORE SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │ BUSINESS LOGIC   │  │ STATE MACHINES   │  │  DATA HANDLERS   │         │
│  │                  │  │                  │  │                  │         │
│  │ - Pricing Engine │  │ - Order Flow     │  │ - CRUD Ops       │         │
│  │ - Route Optimizer│  │ - Delivery Flow  │  │ - Sync Engine    │         │
│  │ - Risk Validator │  │ - Auction Flow   │  │ - Queue Manager  │         │
│  │ - Auth & RBAC    │  │ - Payment Flow   │  │ - Webhook Handler│         │
│  │ - Notifications  │  │ - Incident Flow  │  │ - Realtime Sync  │         │
│  │ - User Privileges│  │                  │  │                  │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    EVENT BUS / MESSAGE BROKER                    │       │
│  │                                                                  │       │
│  │  Events: OrderCreated, DriverAssigned, DeliveryStarted,         │       │
│  │          RiskDetected, AuctionClaimed, PaymentCompleted, etc.   │       │
│  │                                                                  │       │
│  │  Tech: EventEmitter / RabbitMQ / AWS EventBridge                │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│  Tech Stack: Node.js, Express/Fastify, TypeScript, XState,                 │
│              Firebase SDK, React Query Server, Bull Queue, WebSockets       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ Bidireccional
                                    │ REST API / Webhooks / Message Queue
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CAPA 3: INTEGRACIONES EXTERNAS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   PAYMENTS   │  │COMMUNICATION │  │     MAPS     │  │   BARCODE    │   │
│  │              │  │              │  │              │  │              │   │
│  │ - Stripe     │  │ - Twilio SMS │  │ - Google Maps│  │ - Generator  │   │
│  │ - PayPal     │  │ - SendGrid   │  │ - Geocoding  │  │ - QR Scanner │   │
│  │              │  │ - AWS SES    │  │ - Directions │  │              │   │
│  │              │  │              │  │ - Geofencing │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  ANALYTICS   │  │      AI      │  │ GPS TRACKING │  │   DOCUMENT   │   │
│  │              │  │              │  │              │  │  MANAGEMENT  │   │
│  │ - Google     │  │ - Claude API │  │ - Samsara    │  │              │   │
│  │   Analytics  │  │ - OpenAI     │  │ - Geotab     │  │ - AWS S3     │   │
│  │ - BigQuery   │  │              │  │              │  │ - GCS        │   │
│  │              │  │              │  │              │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                              │
│  ┌──────────────┐                                                           │
│  │     OCR      │                                                           │
│  │              │                                                           │
│  │ - Google     │                                                           │
│  │   Vision API │                                                           │
│  │ - Tesseract  │                                                           │
│  │              │                                                           │
│  └──────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ Bidireccional
                                    │ HTTP / Webhooks / SDK
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              CAPA 4: PERSISTENCIA Y SISTEMAS EXTERNOS                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │                  FIRESTORE (Base de Datos Principal)           │        │
│  │                                                                │        │
│  │  Ver sección "FIRESTORE SCHEMA" para detalles completos       │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │         ENTERPRISE RESOURCE PLANNING (ERP) - Externos          │        │
│  │                                                                │        │
│  │  - ERP Systems (SAP, Oracle, NetSuite)                        │        │
│  │  - Warehouse Management Systems (WMS)                         │        │
│  │  - Content Management Systems (CMS)                           │        │
│  │  - GPS Tracking Systems (dedicated)                           │        │
│  │  - Freight Marketplace Platforms                              │        │
│  │  - Data Analytics Platforms                                   │        │
│  │  - Regulatory Databases (compliance)                          │        │
│  │                                                                │        │
│  │  Protocolo: REST API / EDI / Webhooks                         │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FIRESTORE SCHEMA

### Colecciones Principales

```
firestore/
├── clients/                    # Usuarios clientes
│   ├── {clientId}/
│   │   ├── email: string
│   │   ├── name: string
│   │   ├── phone: string
│   │   ├── company: string
│   │   ├── address: object
│   │   ├── creditLimit: number
│   │   ├── paymentTerms: string
│   │   ├── status: 'active' | 'suspended'
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── carriers/                   # Empresas transportistas
│   ├── {carrierId}/
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── phone: string
│   │   ├── rfc: string
│   │   ├── address: object
│   │   ├── fleetSize: number
│   │   ├── rating: number
│   │   ├── status: 'active' | 'suspended'
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── drivers/                    # Conductores individuales
│   ├── {driverId}/
│   │   ├── carrierId: string (ref)
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── phone: string
│   │   ├── license: string
│   │   ├── licenseExpiry: timestamp
│   │   ├── currentVehicleId: string (ref)
│   │   ├── status: 'available' | 'on_trip' | 'offline'
│   │   ├── rating: number
│   │   ├── totalTrips: number
│   │   ├── earnings: number
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── vehicles/                   # Vehículos de la flota
│   ├── {vehicleId}/
│   │   ├── carrierId: string (ref)
│   │   ├── type: 'pickup' | 'van' | 'truck' | 'trailer'
│   │   ├── plates: string
│   │   ├── capacity: object { weight, volume, pallets }
│   │   ├── year: number
│   │   ├── make: string
│   │   ├── model: string
│   │   ├── status: 'active' | 'maintenance' | 'inactive'
│   │   ├── currentDriverId: string (ref)
│   │   ├── gpsDeviceId: string
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── warehouses/                 # [NUEVO] Almacenes
│   ├── {warehouseId}/
│   │   ├── name: string
│   │   ├── location: geopoint
│   │   ├── address: object
│   │   ├── capacity: object
│   │   ├── operatingHours: object
│   │   ├── manager: string
│   │   ├── status: 'active' | 'inactive'
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── quotes/                     # [NUEVO - Separado de orders] Cotizaciones
│   ├── {quoteId}/
│   │   ├── clientId: string (ref)
│   │   ├── origin: object { address, coords }
│   │   ├── destination: object { address, coords }
│   │   ├── cargo: object { weight, volume, type }
│   │   ├── pickupDate: timestamp
│   │   ├── deliveryDate: timestamp
│   │   ├── vehicleType: string
│   │   ├── pricing: object
│   │   │   ├── basePrice: number
│   │   │   ├── fuelSurcharge: number
│   │   │   ├── insurance: number
│   │   │   ├── total: number
│   │   ├── validUntil: timestamp
│   │   ├── status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── orders/                     # Órdenes confirmadas
│   ├── {orderId}/
│   │   ├── quoteId: string (ref) [opcional]
│   │   ├── clientId: string (ref)
│   │   ├── carrierId: string (ref)
│   │   ├── driverId: string (ref)
│   │   ├── vehicleId: string (ref)
│   │   ├── origin: object
│   │   ├── destination: object
│   │   ├── cargo: object
│   │   ├── pickupDate: timestamp
│   │   ├── deliveryDate: timestamp
│   │   ├── pricing: object
│   │   ├── status: 'pending_assignment' | 'assigned' | 'assigned_confirmed' |
│   │   │         'in_transit' | 'delivered' | 'completed' | 'cancelled' |
│   │   │         'paused_security'
│   │   ├── type: 'regular' | 'auction'
│   │   ├── auctionId: string (ref) [si type=auction]
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── auctions/                   # Subastas de carga de regreso
│   ├── {auctionId}/
│   │   ├── carrierId: string (ref)
│   │   ├── origin: object
│   │   ├── destination: object
│   │   ├── cargo: object
│   │   ├── pickupDate: timestamp
│   │   ├── suggestedPrice: number
│   │   ├── commission: number (%)
│   │   ├── netProfit: number
│   │   ├── vehicleRequirements: object
│   │   ├── status: 'open' | 'bidding' | 'assigned' | 'closed'
│   │   ├── claimedBy: string (driverId) [opcional]
│   │   ├── claimedAt: timestamp [opcional]
│   │   ├── expiresAt: timestamp
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── bids/                       # [NUEVO - Separado de auctions] Pujas en subastas
│   ├── {bidId}/
│   │   ├── auctionId: string (ref)
│   │   ├── driverId: string (ref)
│   │   ├── carrierId: string (ref)
│   │   ├── bidAmount: number
│   │   ├── status: 'pending' | 'accepted' | 'rejected'
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── shipments/                  # Envíos activos
│   ├── {shipmentId}/
│   │   ├── orderId: string (ref)
│   │   ├── driverId: string (ref)
│   │   ├── vehicleId: string (ref)
│   │   ├── barcode: string
│   │   ├── qrCode: string
│   │   ├── pickupPhotos: array[string] (URLs)
│   │   ├── deliveryPhotos: array[string] (URLs)
│   │   ├── signature: string (URL)
│   │   ├── signedBy: string
│   │   ├── pickupTime: timestamp
│   │   ├── deliveryTime: timestamp
│   │   ├── podUrl: string (Proof of Delivery PDF)
│   │   ├── status: 'preparing' | 'picked_up' | 'in_transit' | 'delivered'
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── tracking/                   # Eventos de tracking GPS
│   ├── {trackingId}/
│   │   ├── orderId: string (ref)
│   │   ├── driverId: string (ref)
│   │   ├── vehicleId: string (ref)
│   │   ├── location: geopoint
│   │   ├── speed: number
│   │   ├── heading: number
│   │   ├── accuracy: number
│   │   ├── timestamp: timestamp
│   │   ├── eventType: 'gps_update' | 'checkpoint' | 'geofence_enter' | 
│   │   │             'geofence_exit' | 'stop_detected'
│   │   └── metadata: object
│
├── incidents/                  # Incidentes de seguridad/operacionales
│   ├── {incidentId}/
│   │   ├── orderId: string (ref)
│   │   ├── driverId: string (ref)
│   │   ├── type: 'security' | 'accident' | 'breakdown' | 'delay' | 'other'
│   │   ├── severity: 'low' | 'medium' | 'high' | 'critical'
│   │   ├── description: string
│   │   ├── location: geopoint
│   │   ├── photos: array[string] (URLs)
│   │   ├── status: 'reported' | 'investigating' | 'resolved' | 'closed'
│   │   ├── reportedAt: timestamp
│   │   ├── resolvedAt: timestamp
│   │   ├── resolution: string
│   │   └── createdAt: timestamp
│
├── payments/                   # Transacciones de pago
│   ├── {paymentId}/
│   │   ├── orderId: string (ref)
│   │   ├── clientId: string (ref)
│   │   ├── amount: number
│   │   ├── currency: string
│   │   ├── method: 'stripe' | 'paypal' | 'transfer' | 'cash'
│   │   ├── status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
│   │   ├── stripePaymentIntentId: string [opcional]
│   │   ├── paypalOrderId: string [opcional]
│   │   ├── transactionId: string
│   │   ├── refundAmount: number [opcional]
│   │   ├── refundReason: string [opcional]
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── invoices/                   # [NUEVO] Facturas
│   ├── {invoiceId}/
│   │   ├── orderId: string (ref)
│   │   ├── clientId: string (ref)
│   │   ├── invoiceNumber: string
│   │   ├── items: array[object]
│   │   ├── subtotal: number
│   │   ├── tax: number
│   │   ├── total: number
│   │   ├── dueDate: timestamp
│   │   ├── paidDate: timestamp [opcional]
│   │   ├── status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
│   │   ├── pdfUrl: string
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── documents/                  # [NUEVO] Documentos (PODs, customs, etc.)
│   ├── {documentId}/
│   │   ├── orderId: string (ref)
│   │   ├── type: 'pod' | 'customs' | 'invoice' | 'contract' | 'permit' | 'other'
│   │   ├── name: string
│   │   ├── url: string
│   │   ├── mimeType: string
│   │   ├── size: number
│   │   ├── uploadedBy: string (userId)
│   │   ├── metadata: object
│   │   ├── ocrText: string [opcional - si se procesó con OCR]
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── notifications/              # [NUEVO] Cola de notificaciones
│   ├── {notificationId}/
│   │   ├── userId: string (ref)
│   │   ├── type: 'push' | 'sms' | 'email'
│   │   ├── channel: 'fcm' | 'twilio' | 'sendgrid'
│   │   ├── title: string
│   │   ├── body: string
│   │   ├── data: object
│   │   ├── status: 'pending' | 'sent' | 'failed' | 'read'
│   │   ├── sentAt: timestamp [opcional]
│   │   ├── readAt: timestamp [opcional]
│   │   ├── error: string [opcional]
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── analytics/                  # Métricas agregadas
│   ├── {analyticsId}/
│   │   ├── orderId: string (ref)
│   │   ├── carrierId: string (ref)
│   │   ├── driverId: string (ref)
│   │   ├── revenue: number
│   │   ├── costs: object
│   │   │   ├── fuel: number
│   │   │   ├── salary: number
│   │   │   ├── tolls: number
│   │   │   ├── depreciation: number
│   │   │   ├── other: number
│   │   │   └── total: number
│   │   ├── margin: number
│   │   ├── roi: number
│   │   ├── distance: number
│   │   ├── duration: number
│   │   ├── type: 'regular' | 'auction'
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── support_tickets/            # Tickets de soporte
│   ├── {ticketId}/
│   │   ├── userId: string (ref)
│   │   ├── orderId: string (ref) [opcional]
│   │   ├── subject: string
│   │   ├── description: string
│   │   ├── category: 'technical' | 'billing' | 'delivery' | 'other'
│   │   ├── priority: 'low' | 'medium' | 'high' | 'urgent'
│   │   ├── status: 'open' | 'in_progress' | 'resolved' | 'closed'
│   │   ├── assignedTo: string (adminId) [opcional]
│   │   ├── messages: array[object]
│   │   ├── createdAt: timestamp
│   │   ├── resolvedAt: timestamp [opcional]
│   │   └── updatedAt: timestamp
│
└── audit_logs/                 # [NUEVO] Logs de auditoría (compliance)
    ├── {logId}/
    │   ├── userId: string (ref)
    │   ├── action: string
    │   ├── resource: string
    │   ├── resourceId: string
    │   ├── changes: object
    │   ├── ipAddress: string
    │   ├── userAgent: string
    │   ├── timestamp: timestamp
    │   └── metadata: object
```

---

## MATRIZ DE CONECTIVIDAD

| Componente | Conecta Con | Tipo | Protocolo |
|-----------|-----------|------|-----------|
| Mobile App | Core System | Bidireccional | REST API + WebSocket |
| Mobile App | 3rd Party (Maps, GPS) | Unidireccional | REST API |
| Customer Portal | Core System | Bidireccional | REST API + WebSocket |
| Customer Portal | 3rd Party (Payments) | Unidireccional | REST API |
| Carrier Portal | Core System | Bidireccional | REST API + WebSocket |
| Carrier Portal | 3rd Party (Analytics) | Bidireccional | REST API |
| Super Admin Zone | Core System | Bidireccional | REST API + WebSocket |
| Super Admin Zone | Todas 3rd Party | Monitoreo | REST API |
| Warehouse Portal | Core System | Bidireccional | REST API |
| Customs Portal | Core System | Bidireccional | REST API |
| Core System | Firestore | Bidireccional | SDK / Realtime |
| Core System | ERP / External | Bidireccional | REST API / EDI |
| Core System | 3rd Party | Bidireccional | REST API / Webhooks |
| Event Bus | Todos los módulos | Pub/Sub | Message Queue |

---

## ROLES Y PERMISOS (RBAC)

### Roles Definidos

```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',
  WAREHOUSE_MANAGER = 'warehouse_manager',
  CARRIER_ADMIN = 'carrier_admin',
  DRIVER = 'driver',
  CUSTOMER = 'customer',
  CUSTOMS_AGENT = 'customs_agent'
}
```

### Matriz de Permisos

| Recurso | Super Admin | Warehouse | Carrier Admin | Driver | Customer | Customs |
|---------|------------|-----------|---------------|--------|----------|---------|
| **Orders** | CRUD | Read | Read (own) | Read (assigned) | CRUD (own) | Read (related) |
| **Quotes** | CRUD | - | Read (own) | - | CRUD (own) | - |
| **Auctions** | CRUD | - | CRUD (own) | Read + Claim | - | - |
| **Drivers** | CRUD | - | CRUD (own) | Read (self) | - | - |
| **Vehicles** | CRUD | - | CRUD (own) | Read (assigned) | - | - |
| **Tracking** | Read All | Read | Read (own) | Write (self) | Read (own) | Read (related) |
| **Incidents** | CRUD | Read | Read (own) | Create | Read (own) | - |
| **Payments** | CRUD | - | Read (own) | Read (own) | CRUD (own) | - |
| **Analytics** | Read All | Read (own) | Read (own) | Read (self) | Read (own) | - |
| **Risk Zones** | CRUD | - | Read | Read | - | - |
| **Warehouses** | CRUD | CRUD (own) | Read | Read | Read | - |
| **Documents** | CRUD | CRUD | Read (own) | Read (assigned) | Read (own) | CRUD (related) |
| **Audit Logs** | Read All | - | - | - | - | - |

---

## STATE MACHINES

### Order State Machine

```
DRAFT → QUOTED → PENDING_ASSIGNMENT → ASSIGNED → ASSIGNED_CONFIRMED → 
IN_TRANSIT → DELIVERED → COMPLETED

Branches:
- CANCELLED (desde cualquier estado antes de IN_TRANSIT)
- PAUSED_SECURITY (desde IN_TRANSIT)
- REJECTED (desde ASSIGNED)
```

### Auction State Machine

```
OPEN → BIDDING → ASSIGNED → CLOSED

Branches:
- EXPIRED (si no se toma antes de expiresAt)
```

### Payment State Machine

```
PENDING → PROCESSING → COMPLETED

Branches:
- FAILED (desde PROCESSING)
- REFUNDED (desde COMPLETED)
```

### Incident State Machine

```
REPORTED → INVESTIGATING → RESOLVED → CLOSED
```

---

## SEGURIDAD Y COMPLIANCE

### Autenticación
- **Firebase Authentication** (email, phone, OAuth)
- **JWT Tokens** para API authentication
- **Multi-factor Authentication (MFA)** para Super Admin

### Autorización
- **Role-Based Access Control (RBAC)** - Ver matriz de permisos
- **Row-Level Security** en Firestore Rules
- **API Key Management** para integraciones externas

### Encriptación
- **TLS 1.3** para todas las comunicaciones
- **Data at Rest Encryption** (Firestore automático)
- **Sensitive Data Hashing** (passwords, tokens)

### Privacidad de Datos
- **GDPR-ready** (si aplica)
- **Compliance con regulaciones MX** (LFPDPPP)
- **Data Retention Policies**
- **Right to be Forgotten** implementation

### Auditoría
- **audit_logs** collection para todas las acciones críticas
- **Activity Tracking** por usuario
- **Compliance Reports** generados automáticamente

### Gestión de Riesgos
- **Geofencing** para zonas de riesgo
- **Incident Tracking** en tiempo real
- **Automatic Alerts** para eventos críticos
- **Zone Risk Management** por Super Admin

---

## ESCALABILIDAD

### Estrategia de Escalamiento

```
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                            │
│                  (AWS ALB / GCP LB)                         │
└─────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ API     │     │ API     │     │ API     │
    │ Server 1│     │ Server 2│     │ Server N│
    └─────────┘     └─────────┘     └─────────┘
          │               │               │
          └───────────────┼───────────────┘
                          ▼
                  ┌───────────────┐
                  │  REDIS CACHE  │
                  │  (Hot Data)   │
                  └───────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │Firestore│     │ BigQuery│     │   S3    │
    │(Primary)│     │(Analytics)│   │(Documents)│
    └─────────┘     └─────────┘     └─────────┘
```

### Componentes Escalables

1. **API Servers**: Auto-scaling horizontal (AWS ECS, GCP Cloud Run)
2. **Firestore**: Auto-escala automáticamente
3. **Cloud Functions**: Serverless, escala según demanda
4. **Redis Cache**: Para datos hot (tracking, sessions)
5. **CDN**: Cloudflare para assets estáticos
6. **Message Queue**: Bull Queue + Redis para procesamiento asíncrono

### Optimizaciones

- **Database Indexing**: Índices compuestos en Firestore para queries frecuentes
- **Caching Strategy**: 
  - Tracking data: 10 segundos
  - User profiles: 5 minutos
  - Analytics: 1 hora
- **Lazy Loading**: Paginación en todas las listas
- **Image Optimization**: WebP format, lazy loading, CDN
- **Code Splitting**: Por ruta en aplicaciones web

---

## MONITOREO Y OBSERVABILIDAD

### Métricas Clave (KPIs)

**Operacionales:**
- Órdenes activas
- Conductores disponibles
- Utilización de flota (%)
- Tiempo promedio de entrega
- Incidentes por día

**Negocio:**
- Revenue diario/mensual
- Margen promedio por orden
- ROI por ruta
- Efectividad de subastas (% tomadas)
- Customer satisfaction (rating)

**Técnicos:**
- API response time (p95, p99)
- Error rate (%)
- Uptime (%)
- Database query performance
- Cache hit rate

### Herramientas

- **Application Monitoring**: Sentry, LogRocket
- **Infrastructure Monitoring**: AWS CloudWatch, GCP Monitoring
- **Log Aggregation**: Winston + CloudWatch Logs
- **Real User Monitoring (RUM)**: Google Analytics, Mixpanel
- **Alerting**: PagerDuty para incidentes críticos

---

## DISASTER RECOVERY

### Backup Strategy

- **Firestore**: Backups automáticos diarios
- **Documents (S3)**: Versionado habilitado + replicación cross-region
- **Code**: Git repository con múltiples remotes
- **Secrets**: AWS Secrets Manager / GCP Secret Manager

### Recovery Time Objectives (RTO)

- **Critical Services** (API, Tracking): < 1 hora
- **Non-Critical Services** (Analytics, Reports): < 4 horas
- **Data Recovery**: < 24 horas (último backup)

### High Availability

- **Multi-Region Deployment** (opcional para producción)
- **Database Replication** (Firestore multi-region)
- **Failover Strategy** automático con Load Balancer

---

## TECH STACK SUMMARY

### Frontend
- **Framework**: Next.js 16, React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (server state), Context API (client state)
- **Maps**: react-google-maps
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js / Fastify
- **Language**: TypeScript
- **State Machines**: XState
- **Queue**: Bull + Redis
- **WebSockets**: Socket.io

### Database
- **Primary**: Firestore (NoSQL)
- **Cache**: Redis
- **Analytics**: BigQuery

### Infrastructure
- **Cloud**: AWS / Google Cloud
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, CloudWatch
- **CDN**: Cloudflare

---

## REFERENCIAS

- [PROCESS_FLOWS.md](./PROCESS_FLOWS.md) - Flujos de proceso detallados
- [TECH_STACK.md](./TECH_STACK.md) - Especificaciones técnicas completas
- [ROADMAP.md](./ROADMAP.md) - Timeline de implementación

---

**Última actualización**: 2026-01-20  
**Versión**: 2.0  
**Autor**: Equipo JFC Cargo Destino
