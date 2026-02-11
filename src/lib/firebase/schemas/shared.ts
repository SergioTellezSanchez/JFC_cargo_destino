import { Timestamp, GeoPoint } from 'firebase/firestore';

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

// ============================================================================
// FIRESTORE CONVERTER HELPERS
// ============================================================================

export type FirestoreData<T> = Omit<T, 'id'>;

export type CreateData<T> = Omit<FirestoreData<T>, 'createdAt' | 'updatedAt'>;

export type UpdateData<T> = Partial<Omit<FirestoreData<T>, 'createdAt'>>;
