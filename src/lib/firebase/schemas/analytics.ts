import { Timestamp } from 'firebase/firestore';
import { Location } from './shared';

// ============================================================================
// ANALYTICS & AUDIT
// ============================================================================

export interface Analytics {
    id: string;
    orderId: string;
    carrierId: string;
    driverId: string;
    vehicleId: string;
    revenue: number;
    costs: {
        fuel: number;
        salary: number;
        tolls: number;
        depreciation: number;
        maintenance: number;
        insurance: number;
        platformCommission: number;
        other: number;
        total: number;
    };
    margin: number;
    roi: number;
    profitPerKm: number;
    profitPerHour: number;
    distance: number; // km
    duration: number; // hours
    type: 'regular' | 'auction';
    route: {
        origin: Location;
        destination: Location;
    };
    createdAt: Timestamp;
}

export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    changes?: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    timestamp: Timestamp;
    metadata?: Record<string, any>;
}
