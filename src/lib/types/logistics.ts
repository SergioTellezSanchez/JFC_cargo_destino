export interface FuelPrices {
    diesel: number;
    gasoline91: number;
    gasoline87: number;
}

export interface PricingSettings {
    insuranceRate: number;
    profitMargin: number;
    basePrice: number;
    usefulLifeKm: number;
    defaultFuelPrice?: number;
    fuelPrices?: FuelPrices;
}

export interface Vehicle {
    id: string;
    name: string;
    category?: string;
    capacity: number; // in kg
    volumetricCapacity: number; // in m3
    costPerKm: number;
    value: number;
    usefulLifeKm: number;
    suspensionType: string;
    plate?: string;
    company?: string;
    fuelEfficiency?: number; // km/l
    fuelType?: keyof FuelPrices;
    depreciationPerDay?: number;
    description?: string;
    uses?: string[];
    dimensions?: { l: number; w: number; h: number };
    // New fields
    year?: number;
    vehicleTypes?: string[]; // Refrigerada, Caja Seca, Plataforma, Cama Baja, Pirámide
    depreciationPerKm?: number;
    status?: 'active' | 'maintenance' | 'inactive';
}

export interface Driver {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    license?: string;
    company?: string;
    photoUrl?: string;
    age?: number;
    dailySalary?: number;
    vehicleId?: string | string[];
    status?: 'AVAILABLE' | 'BUSY' | 'OFF';
    createdBy?: string;
}

export interface Package {
    weight: number; // in kg
    volume?: number; // in m3
    declaredValue: number;
    distanceKm: number;
    type?: string;
    packageType?: string;
    loadType?: 'FTL' | 'PTL' | 'LTL';
    cargoType?: 'heavy' | 'hazard' | 'packages';

    // New Logistics options
    requiresLoadingSupport?: boolean;
    requiresUnloadingSupport?: boolean;
    isStackable?: boolean;
    requiresStretchWrap?: boolean;
    insuranceSelection?: 'jfc' | 'own';

    // New detailed fields for breakdown
    fuelPrice?: number;
    fuelEfficiency?: number;
    tolls?: number;
    driverSalary?: number;
    driverCommission?: number;
    assistantSalary?: number;
    assistantCommission?: number;
    food?: number;
    lodging?: number;
    travelDays?: number;
    unforeseenPercent?: number;
    otherExpenses?: number;

    // CRM/Folio data
    seller?: string;
    clientName?: string;
    folio?: string;
    origin?: string;
    destination?: string;
}

export interface VehicleDefinition {
    id: string;
    name: string;
    category: string;
    capacity: number; // kg
    description: string;
    uses: string[];
    dimensions?: { l: number; w: number; h: number };
    fuelType?: keyof FuelPrices;
    fuelEfficiency?: number;
}
