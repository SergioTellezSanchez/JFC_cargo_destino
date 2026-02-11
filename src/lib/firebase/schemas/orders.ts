import { Timestamp, GeoPoint } from 'firebase/firestore';
import { Location, Cargo } from './shared';
import { Vehicle } from './vehicles';
import { Pricing } from './pricing';

// ============================================================================
// QUOTES & ORDERS
// ============================================================================

export interface Quote {
    id: string;
    clientId: string;
    origin: Location;
    destination: Location;
    cargo: Cargo;
    pickupDate: Timestamp;
    deliveryDate: Timestamp;
    vehicleType: Vehicle['type'];
    pricing: Pricing;
    validUntil: Timestamp;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

    // Additional fields from logistics.ts Package
    seller?: string;
    folio?: string;
    loadType?: 'FTL' | 'PTL' | 'LTL';
    cargoType?: 'hazardous' | 'perishable' | 'machinery' | 'furniture' | 'packages' | 'general';

    // Service Requirements
    requiresLoadingSupport?: boolean;
    requiresUnloadingSupport?: boolean;
    isStackable?: boolean;
    requiresStretchWrap?: boolean;
    requiresStraps?: boolean;
    insuranceSelection?: 'jfc' | 'own';
    packageCount?: number;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type OrderStatus =
    | 'pending_assignment'
    | 'assigned'
    | 'assigned_confirmed'
    | 'in_transit'
    | 'delivered'
    | 'completed'
    | 'cancelled'
    | 'paused_security';

export interface Order {
    id: string;
    quoteId?: string;
    clientId: string;
    carrierId?: string;
    driverId?: string;
    vehicleId?: string;
    origin: Location;
    destination: Location;
    cargo: Cargo;
    pickupDate: Timestamp;
    deliveryDate: Timestamp;
    pricing: Pricing;
    status: OrderStatus;
    type: 'regular' | 'auction';
    auctionId?: string;

    // Additional fields from logistics.ts
    seller?: string;
    folio?: string;
    clientName?: string;
    distanceKm?: number;
    loadType?: 'FTL' | 'PTL' | 'LTL';
    cargoType?: 'hazardous' | 'perishable' | 'machinery' | 'furniture' | 'packages' | 'general';

    // Timing
    actualPickupTime?: Timestamp;
    actualDeliveryTime?: Timestamp;
    deliveryDuration?: number; // milliseconds

    // Rating
    rating?: number;
    ratingCategories?: {
        punctuality: number;
        communication: number;
        cargoCondition: number;
        driverProfessionalism: number;
    };
    ratingComments?: string;
    ratedAt?: Timestamp;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================================================
// AUCTIONS & BIDS
// ============================================================================

export interface Auction {
    id: string;
    carrierId: string;
    origin: Location;
    destination: Location;
    cargo: Cargo;
    pickupDate: Timestamp;
    suggestedPrice: number;
    commission: number; // percentage
    netProfit: number;
    vehicleRequirements: {
        type: Vehicle['type'];
        minCapacity: number;
    };
    status: 'open' | 'bidding' | 'assigned' | 'closed' | 'expired';
    claimedBy?: string; // driverId
    claimedAt?: Timestamp;
    expiresAt: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Bid {
    id: string;
    auctionId: string;
    driverId: string;
    carrierId: string;
    bidAmount: number;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================================================
// DELIVERY & SHIPMENTS
// ============================================================================

export interface Shipment {
    id: string;
    orderId: string;
    driverId: string;
    vehicleId: string;
    barcode: string;
    qrCode: string;
    pickupPhotos: string[]; // URLs
    deliveryPhotos: string[]; // URLs
    signature?: string; // URL
    signedBy?: string;
    pickupTime?: Timestamp;
    deliveryTime?: Timestamp;
    deliveryLocation?: GeoPoint;
    podUrl?: string; // Proof of Delivery PDF URL
    status: 'preparing' | 'picked_up' | 'in_transit' | 'delivered';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Tracking {
    id: string;
    orderId: string;
    driverId: string;
    vehicleId: string;
    location: GeoPoint;
    speed: number; // km/h
    heading: number; // degrees
    accuracy: number; // meters
    timestamp: Timestamp;
    eventType: 'gps_update' | 'checkpoint' | 'geofence_enter' | 'geofence_exit' | 'stop_detected';
    metadata?: Record<string, any>;
}
