// Firestore collection names
export const COLLECTIONS = {
    // Core entities
    CLIENTS: 'clients',
    CARRIERS: 'carriers',
    DRIVERS: 'drivers',
    VEHICLES: 'vehicles',
    WAREHOUSES: 'warehouses',

    // Orders & Quotes
    QUOTES: 'quotes',
    ORDERS: 'orders',

    // Auctions
    AUCTIONS: 'auctions',
    BIDS: 'bids',

    // Delivery
    SHIPMENTS: 'shipments',

    // Payments & Invoices
    PAYMENTS: 'payments',
    INVOICES: 'invoices',

    // Documents & Tracking
    DOCUMENTS: 'documents',
    TRACKING: 'tracking',

    // Support & Incidents
    INCIDENTS: 'incidents',
    SUPPORT_TICKETS: 'support_tickets',
    NOTIFICATIONS: 'notifications',

    // Analytics & Audit
    ANALYTICS: 'analytics',
    AUDIT_LOGS: 'audit_logs',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
