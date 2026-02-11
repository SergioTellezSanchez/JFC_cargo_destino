import { Timestamp, GeoPoint } from 'firebase/firestore';
import { Address } from './shared';

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
