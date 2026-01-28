import { Timestamp, GeoPoint } from 'firebase/firestore';

// ============================================================================
// USER ROLES
// ============================================================================

export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    WAREHOUSE_MANAGER = 'warehouse_manager',
    CARRIER_ADMIN = 'carrier_admin',
    DRIVER = 'driver',
    CUSTOMER = 'customer',
    CUSTOMS_AGENT = 'customs_agent',
}

// ============================================================================
// FUEL PRICES (from logistics.ts)
// ============================================================================

export interface FuelPrices {
    diesel: number;
    gasoline91: number;
    gasoline87: number;
}

export interface PricingSettings {
    // Core
    insuranceRate: number; // e.g. 1.5%
    profitMargin: number; // e.g. 1.4
    basePrice: number; // Minimum trip cost
    usefulLifeKm: number;
    imponderablesRate?: number; // e.g. 3%

    // Fuel Costs (Configurable)
    fuelPrices?: FuelPrices;

    // 1. Base Cost Components (Configurable)
    kilometerRate?: number; // Cost per km (e.g. $15/km)
    tonKmRate?: number; // [NEW] Cost per km per ton (e.g. $2/km/ton)

    // "Costo fijo asignado a cada Peso Aproximado"
    weightRates?: Record<string, number>; // e.g. {'50': 500, '500': 1500...}

    // "Cost rate asignado a cada Tipo de Transporte"
    transportRates?: {
        FTL: number; // e.g. 1.0 or Fixed Cost? User said "Cost rate... que asignamos"
        PTL: number;
        LTL: number;
    };

    // "Cost rate asignado a cada Tipo de Carga"
    cargoRates?: {
        general: number; // e.g. 1.0
        hazardous: number; // e.g. 1.5
        perishable: number;
        machinery: number;
        packages: number; // "Paquetería/Diversos"
        fragile: number; // [NEW] "Muebles/Frágil"
    };

    // 2. Multipliers / Rate Cost Operativos
    // "Presentación de Carga"
    presentationRates?: Record<string, number>; // e.g. {'Granel': 1.3...}
    quantityRate?: number; // [NEW] Factor for extra quantity

    // [NEW] Vehicle Config (Dimensions & Efficiency)
    vehicleDimensions?: Record<string, {
        length: number;
        width: number;
        height: number;
        efficiency?: number;
        volume?: number;
        fuelType?: 'diesel' | 'gasoline87' | 'gasoline91';
        pricePerKm?: number; // [NEW] Base rate per km for this vehicle
        fuelConfig?: Record<string, { enabled: boolean; efficiency: number }>; // [NEW] Per-fuel efficiency settings
    }>; // Keyed by weight/id

    // "Cantidad" - Multiplier based on quantity? Or simple cost per unit?
    // User said: "Cost rate que asignamos a cada Naturaleza" (Typo for Quantity?)
    // We will store a per-unit factor or fixed fee


    // 3. Operational Extras (Fixed Costs)
    maneuverFees?: {
        loading: number;
        unloading: number;
    };

    packagingFees?: {
        stackable: number; // "Producto Estibable" fee? Or discount?
        stretchWrap: number; // "Playo/Empaque"
    };

    // Legacy / Other
    defaultFuelPrice?: number;

    serviceMultipliers?: {
        express: number; // e.g. 1.4
        roundTrip: number; // e.g. 1.8
        weekend: number;
    };
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Client {
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

export interface Carrier {
    id: string;
    name: string;
    email: string;
    phone: string;
    rfc: string;
    address: Address;
    fleetSize: number;
    rating: number;
    status: 'active' | 'suspended';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Driver {
    id: string;
    carrierId: string;
    name: string;
    email: string;
    phone: string;
    license: string;
    licenseExpiry: Timestamp;

    // Additional fields from logistics.ts
    photoUrl?: string;
    age?: number;
    dailySalary?: number;
    // vehicleId can be a string or array to support:
    // - Single assignment: Driver certified for one specific vehicle
    // - Multiple assignment: Driver certified for multiple vehicle types (e.g., van + truck)
    // This allows flexible driver-vehicle relationships for fleet management
    vehicleId?: string | string[];

    // Status & Performance
    currentVehicleId?: string; // Currently assigned vehicle
    status: 'available' | 'on_trip' | 'offline';
    rating: number;
    totalTrips: number;
    earnings: number;

    // Metadata
    company?: string;
    createdBy?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Vehicle {
    id: string;
    carrierId: string;

    // Basic Info
    name: string;
    type: 'pickup' | 'van' | 'truck' | 'trailer';
    plates: string;
    year: number;
    make: string;
    model: string;

    // Capacity
    capacity: number; // kg (weight capacity)
    volumetricCapacity: number; // m³
    palletCapacity?: number; // number of pallets

    // Fuel & Efficiency
    // fuelType uses specific names to match Mexican fuel standards:
    // - 'diesel': Standard diesel fuel
    // - 'gasoline87': Regular gasoline (87 octane - Magna in Mexico)
    // - 'gasoline91': Premium gasoline (91+ octane - Premium in Mexico)
    fuelType: 'diesel' | 'gasoline87' | 'gasoline91';
    fuelEfficiency: number; // km/l

    // Vehicle Characteristics
    suspensionType: string; // e.g., 'Neumática', 'Mecánica', 'Hidráulica'
    category?: string; // From VEHICLE_CATEGORIES
    vehicleTypes?: string[]; // Refrigerada, Caja Seca, Plataforma, Cama Baja, Pirámide
    dimensions?: { l: number; w: number; h: number }; // length, width, height in meters

    // Financial
    value: number; // Asset value for depreciation
    costPerKm: number; // Operating cost per km
    depreciationPerKm?: number; // Depreciation per km
    depreciationPerDay?: number; // Daily depreciation
    usefulLifeKm: number; // Total useful life in km

    // Status & Assignment
    status: 'active' | 'maintenance' | 'inactive';
    currentDriverId?: string;
    gpsDeviceId?: string;

    // Additional Info
    description?: string;
    uses?: string[]; // Use cases: ['Urbano', 'Regional', 'Perecederos', etc.]
    company?: string; // Company name if applicable

    // Timestamps
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Warehouse {
    id: string;
    name: string;
    location: GeoPoint;
    address: Address;
    capacity: {
        weight: number;
        volume: number;
        pallets: number;
    };
    operatingHours: {
        open: string; // HH:MM
        close: string; // HH:MM
    };
    manager: string;

    // Additional operational fields
    clearanceHeight?: number; // meters
    staffCount?: number; // operational personnel
    certifications?: string[]; // e.g., ['ISO 9001', 'HACCP', 'C-TPAT']
    dockCount?: number; // number of loading docks

    status: 'active' | 'inactive';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

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

export type OrderStatus =
    | 'pending_assignment'
    | 'assigned'
    | 'assigned_confirmed'
    | 'in_transit'
    | 'delivered'
    | 'completed'
    | 'cancelled'
    | 'paused_security';

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

// ============================================================================
// PAYMENTS & INVOICES
// ============================================================================

export interface Payment {
    id: string;
    orderId: string;
    clientId: string;
    amount: number;
    currency: string;
    method: 'stripe' | 'paypal' | 'transfer' | 'cash';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    stripePaymentIntentId?: string;
    paypalOrderId?: string;
    transactionId?: string;
    refundAmount?: number;
    refundReason?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Invoice {
    id: string;
    orderId: string;
    clientId: string;
    invoiceNumber: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    dueDate: Timestamp;
    paidDate?: Timestamp;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    pdfUrl?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

// ============================================================================
// DOCUMENTS & INCIDENTS
// ============================================================================

export interface Document {
    id: string;
    orderId: string;
    type: 'pod' | 'customs' | 'invoice' | 'contract' | 'permit' | 'other';
    name: string;
    url: string;
    mimeType: string;
    size: number; // bytes
    uploadedBy: string; // userId
    metadata?: Record<string, any>;
    ocrText?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Incident {
    id: string;
    orderId: string;
    driverId: string;
    type: 'security' | 'accident' | 'breakdown' | 'delay' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location: GeoPoint;
    photos: string[]; // URLs
    status: 'reported' | 'investigating' | 'resolved' | 'closed';
    reportedAt: Timestamp;
    resolvedAt?: Timestamp;
    resolution?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================================================
// SUPPORT & NOTIFICATIONS
// ============================================================================

export interface SupportTicket {
    id: string;
    userId: string;
    orderId?: string;
    subject: string;
    description: string;
    category: 'technical' | 'billing' | 'delivery' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    assignedTo?: string; // adminId
    messages: TicketMessage[];
    createdAt: Timestamp;
    resolvedAt?: Timestamp;
    updatedAt: Timestamp;
}

export interface TicketMessage {
    from: string; // userId
    message: string;
    timestamp: Timestamp;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'push' | 'sms' | 'email';
    channel: 'fcm' | 'twilio' | 'sendgrid';
    title: string;
    body: string;
    data?: Record<string, any>;
    status: 'pending' | 'sent' | 'failed' | 'read';
    sentAt?: Timestamp;
    readAt?: Timestamp;
    error?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

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

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface Location {
    address: string;
    coords: {
        lat: number;
        lng: number;
    };
}

export interface Cargo {
    weight: number; // kg
    volume?: number; // m³
    type: 'general' | 'fragile' | 'dangerous' | 'perishable' | 'machinery' | 'furniture';
    packageType?: string; // 'Perecederos', 'Maquinaria', 'Productos Químicos', etc.
    description?: string;
    value?: number; // for insurance (declaredValue)
}

export interface Pricing {
    basePrice: number;
    fuelSurcharge: number;
    insurance: number;
    urgency?: number;
    total: number;

    // Detailed breakdown (from logistics.ts)
    fuelCost?: number;
    tolls?: number;
    driverSalary?: number;
    driverCommission?: number;
    assistantSalary?: number;
    assistantCommission?: number;
    food?: number;
    lodging?: number;
    depreciation?: number;
    otherExpenses?: number;
    unforeseen?: number;
    operationalCost?: number;
    operationalCostPerKm?: number;
    subtotal?: number;
    iva?: number;
    utility?: number;
    utilityPercent?: number;

    // Billable Breakdown (For UI & History)
    billableFreight?: number;
    billableFees?: number;
    billableTolls?: number;
    billableLineItems?: Array<{ label: string; value: number; type: string; price: number }>;
}

// ============================================================================
// VEHICLE CATEGORIES (from logistics.ts)
// ============================================================================

export const VEHICLE_CATEGORIES = {
    RIGIDOS: 'Camiones unitarios (Rígidos)',
    ARTICULADOS: 'Camiones articulados',
    ESPECIALIZADOS: 'Unidades especializadas',
    PLATAFORMAS: 'Plataformas abiertas'
} as const;

// ============================================================================
// FIRESTORE CONVERTER HELPERS
// ============================================================================

export type FirestoreData<T> = Omit<T, 'id'>;

export type CreateData<T> = Omit<FirestoreData<T>, 'createdAt' | 'updatedAt'>;

export type UpdateData<T> = Partial<Omit<FirestoreData<T>, 'createdAt'>>;
