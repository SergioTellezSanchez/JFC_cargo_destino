# Firestore Setup - JFC Cargo Destino

## Overview

This directory contains the complete Firestore schema, TypeScript types, and helper functions for the JFC Cargo Destino project.

## Structure

```
src/lib/firebase/
├── index.ts          # Main export file
├── collections.ts    # Collection name constants
├── schema.ts         # TypeScript types for all collections
└── helpers.ts        # CRUD operations and query helpers
```

## Collections (18 total)

### Core Entities
- `clients` - Customer information
- `carriers` - Transportation companies
- `drivers` - Individual drivers
- `vehicles` - Fleet vehicles
- `warehouses` - Warehouse locations

### Orders & Quotes
- `quotes` - Price quotations
- `orders` - Confirmed orders

### Auctions
- `auctions` - Auction listings
- `bids` - Bids on auctions

### Delivery
- `shipments` - Shipment details
- `tracking` - GPS tracking events

### Payments
- `payments` - Payment transactions
- `invoices` - Billing invoices

### Documents & Support
- `documents` - PODs, customs docs, etc.
- `incidents` - Security/operational incidents
- `support_tickets` - Customer support tickets
- `notifications` - Push/SMS/Email notifications

### Analytics
- `analytics` - Profitability calculations
- `audit_logs` - Compliance audit trail

## Usage

### Import

```typescript
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  type Client,
  type Order,
  type Driver,
} from '@/lib/firebase';
```

### Create a Document

```typescript
// Create a new client
const clientId = await createDocument<Client>(COLLECTIONS.CLIENTS, {
  email: 'cliente@example.com',
  name: 'Cliente Demo',
  phone: '+525512345678',
  company: 'Empresa Demo',
  address: {
    street: 'Av. Reforma 123',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '06600',
    country: 'México',
  },
  creditLimit: 100000,
  paymentTerms: '30 días',
  status: 'active',
});
```

### Get a Document

```typescript
// Get a client by ID
const client = await getDocument<Client>(COLLECTIONS.CLIENTS, clientId);

if (client) {
  console.log(client.name); // TypeScript knows the structure
}
```

### Update a Document

```typescript
// Update client status
await updateDocument<Client>(COLLECTIONS.CLIENTS, clientId, {
  status: 'suspended',
});
```

### Query Documents

```typescript
import { where, orderBy, limit } from 'firebase/firestore';

// Get all active drivers
const activeDrivers = await queryDocuments<Driver>(
  COLLECTIONS.DRIVERS,
  where('status', '==', 'available'),
  orderBy('rating', 'desc'),
  limit(10)
);
```

### Specialized Queries

```typescript
// Get documents by field value
const carrierDrivers = await getDocumentsByField<Driver>(
  COLLECTIONS.DRIVERS,
  'carrierId',
  carrierId
);

// Get paginated results
const recentOrders = await getDocumentsPaginated<Order>(
  COLLECTIONS.ORDERS,
  20, // page size
  'createdAt', // order by field
  'desc' // direction
);
```

## Initialization

To initialize Firestore with sample data:

```bash
npm run init-firestore
```

This creates:
- 1 Sample Client
- 1 Sample Carrier
- 1 Sample Driver
- 1 Sample Vehicle
- 1 Sample Warehouse

## TypeScript Types

All Firestore documents have corresponding TypeScript interfaces:

```typescript
interface Client {
  id: string;
  email: string;
  name: string;
  phone: string;
  company?: string;
  address: Address;
  creditLimit: number;
  paymentTerms: string;
  status: 'active' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Helper Types

```typescript
// For creating documents (excludes id, createdAt, updatedAt)
type CreateData<T> = Omit<FirestoreData<T>, 'createdAt' | 'updatedAt'>;

// For updating documents (partial, excludes createdAt)
type UpdateData<T> = Partial<Omit<FirestoreData<T>, 'createdAt'>>;
```

## Best Practices

1. **Always use TypeScript types** - Ensures type safety
2. **Use helper functions** - Consistent error handling and timestamps
3. **Validate data** - Use Zod or similar before writing to Firestore
4. **Index your queries** - Create composite indexes in Firebase Console
5. **Paginate large results** - Use `getDocumentsPaginated` for lists

## Required Indexes

Create these composite indexes in Firebase Console:

```javascript
// orders collection
{
  collection: 'orders',
  fields: [
    { field: 'carrierId', order: 'ASCENDING' },
    { field: 'status', order: 'ASCENDING' },
    { field: 'createdAt', order: 'DESCENDING' }
  ]
}

// tracking collection
{
  collection: 'tracking',
  fields: [
    { field: 'orderId', order: 'ASCENDING' },
    { field: 'timestamp', order: 'DESCENDING' }
  ]
}

// auctions collection
{
  collection: 'auctions',
  fields: [
    { field: 'status', order: 'ASCENDING' },
    { field: 'expiresAt', order: 'ASCENDING' }
  ]
}
```

## Next Steps

1. ✅ Firestore schema created
2. ✅ Helper functions implemented
3. ✅ Sample data initialized
4. ⏳ Implement authentication & RBAC
5. ⏳ Create API routes
6. ⏳ Build UI components

---

**Created**: 2026-01-20  
**Author**: JFC Cargo Destino Team
