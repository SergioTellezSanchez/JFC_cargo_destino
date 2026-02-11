import { Timestamp } from 'firebase/firestore';

// ============================================================================
// VEHICLE CATEGORIES (from logistics.ts)
// ============================================================================

export const VEHICLE_CATEGORIES = {
    RIGIDOS: 'Camiones unitarios (Rígidos)',
    ARTICULADOS: 'Camiones articulados',
    ESPECIALIZADOS: 'Unidades especializadas',
    PLATAFORMAS: 'Plataformas abiertas'
} as const;

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
