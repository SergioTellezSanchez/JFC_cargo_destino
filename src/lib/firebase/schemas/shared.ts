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
    detailedAddress?: Address;
    coords: {
        lat: number;
        lng: number;
    };
}

export interface CartaPorteItem {
    satProductCode: string; // Clave de Producto/Servicio SAT
    description: string; // Descripción de los bienes
    quantity: number; // Cantidad
    satUnitCode: string; // Clave de unidad de medida SAT
    weightInKg: number; // Peso en kilogramos
    isHazardousMaterial?: boolean | '0' | '1' | '0,1'; // Material peligroso
    hazardousMaterialCode?: string; // Clave del material peligroso
    packagingCode?: string; // Clave de tipo de embalaje
    packagingDescription?: string; // Descripción del embalaje
}

export interface CartaPorte {
    isInternationalTransport: boolean;
    senderRfc?: string; // RFC del Remitente
    receiverRfc?: string; // RFC del Destinatario
    totalGrossWeight: number;
    weightUnit: string; // e.g., 'KGM'
    totalItems: number;
    items: CartaPorteItem[];
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
