
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAuth, unauthorized } from '@/lib/auth-server';
import { VEHICLE_TYPES } from '@/lib/calculations';

const PARTNER_COMPANIES = [
    'JFC Cargo Central',
    'Logística Express MX',
    'Transportes del Norte',
    'Mudanzas Rápidas S.A.',
    'Flotilla Continental',
    'Aliado Estratégico Bajío'
];

const MAKES = ['Kenworth', 'Freightliner', 'Volvo', 'International', 'Mack', 'Isuzu', 'Hino', 'Ford', 'Chevrolet', 'Nissan'];
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePlate() {
    const states = ['XX', 'XY', 'XZ', 'AB', 'CD']; // Simplified
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    return `${getRandomElement(states)}-${Math.floor(1000 + Math.random() * 9000)}-${letters[Math.floor(Math.random() * 26)]}`;
}

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();

    try {
        const batch = adminDb.batch();
        const vehiclesRef = adminDb.collection('vehicles');

        // Optional: Clean existing vehicles?
        // const existing = await vehiclesRef.get();
        // existing.docs.forEach(doc => batch.delete(doc.ref));

        let count = 0;

        for (const vType of VEHICLE_TYPES) {
            // Create 3 instances of each type
            for (let i = 0; i < 3; i++) {
                const vehicleDoc = vehiclesRef.doc();
                const make = getRandomElement(MAKES);
                const year = getRandomElement(YEARS);
                const company = getRandomElement(PARTNER_COMPANIES);

                // Map definition to Schema fields
                const vehicleData: any = {
                    carrierId: 'system_seed', // Placeholder
                    name: `${vType.name} - ${count + 1}`,
                    type: mapToSchemaType(vType.id), // 'van', 'truck', etc.
                    plates: generatePlate(),
                    year: year,
                    make: make,
                    model: `${make} ${vType.name} Series`,
                    capacity: vType.capacity,
                    volumetricCapacity: (vType.dimensions?.l || 0) * (vType.dimensions?.w || 0) * (vType.dimensions?.h || 0) || 10,
                    fuelType: vType.fuelType || 'diesel',
                    fuelEfficiency: vType.fuelEfficiency || 3.5,
                    suspensionType: 'Neumática', // Default
                    category: vType.category,
                    dimensions: vType.dimensions || { l: 0, w: 0, h: 0 },
                    value: 1000000, // Default fallback
                    costPerKm: 15,
                    usefulLifeKm: 500000,
                    status: 'active',
                    currentDriverId: null,
                    gpsDeviceId: null,
                    description: vType.description,
                    uses: vType.uses,
                    company: company,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    // Store the definition ID to help with matching logic if needed
                    vehicleTypeId: vType.id
                };

                batch.set(vehicleDoc, vehicleData);
                count++;
            }
        }

        await batch.commit();

        return NextResponse.json({
            success: true,
            message: `Database updated. Added ${count} vehicles (${VEHICLE_TYPES.length} types * 3).`,
            typesSeeded: VEHICLE_TYPES.map(v => v.id)
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function mapToSchemaType(id: string): string {
    if (id.includes('van')) return 'van';
    if (id.includes('pickup')) return 'pickup';
    if (id.includes('trailer') || id.includes('full') || id.includes('tren')) return 'trailer';
    return 'truck'; // Default for heavy rigid
}
