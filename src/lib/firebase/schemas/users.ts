import { Timestamp } from 'firebase/firestore';
import { Address } from './shared';

// ============================================================================
// USER ROLES
// ============================================================================

export enum UserRole {
    ADMIN = 'ADMIN',       // Dueño — acceso total al sistema
    CARRIER = 'CARRIER',   // Empresa transportista — gestiona flota y acepta cargas de la bolsa
    DRIVER = 'DRIVER',     // Conductor — ve viajes asignados
    CLIENT = 'CLIENT',     // Cliente — solo portal de cotización y seguimiento
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
