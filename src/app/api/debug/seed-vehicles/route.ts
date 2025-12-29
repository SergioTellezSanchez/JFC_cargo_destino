import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const PARTNER_COMPANIES = [
    'JFC Cargo Central',
    'Logística Express MX',
    'Transportes del Norte',
    'Mudanzas Rápidas S.A.',
    'Flotilla Continental',
    'Aliado Estratégico Bajío'
];

const TRUCK_STANDARDS: Record<string, { weight: number, volume: number }> = {
    'Kenworth T680': { weight: 28000, volume: 85 },
    'Freightliner Cascadia': { weight: 30000, volume: 90 },
    'Volvo VNL 860': { weight: 29000, volume: 88 },
    'International LT Series': { weight: 27500, volume: 82 },
    'Peterbilt 579': { weight: 28500, volume: 86 },
    'Mack Anthem': { weight: 27000, volume: 80 },
    'Hino 338': { weight: 14000, volume: 45 },
    'Isuzu NPR-HD': { weight: 6500, volume: 22 },
    'Torton': { weight: 14000, volume: 50 },
    'Trailer': { weight: 30000, volume: 90 },
    'Camioneta 1.5 Tons': { weight: 1500, volume: 10 },
    'Camioneta 3.5 Tons': { weight: 3500, volume: 18 },
    'Nissan NPM': { weight: 1500, volume: 8 }
};

export async function GET() {
    try {
        const batch = adminDb.batch();
        const vehiclesRef = adminDb.collection('vehicles');

        // 1. Delete existing vehicles to avoid duplicates and ensure clean state
        const existing = await vehiclesRef.get();
        existing.docs.forEach(doc => batch.delete(doc.ref));

        // 2. Add full set of vehicles for each company
        let count = 0;
        for (const company of PARTNER_COMPANIES) {
            for (const [name, specs] of Object.entries(TRUCK_STANDARDS)) {
                const vehicleDoc = vehiclesRef.doc();
                const plateSuffix = Math.floor(1000 + Math.random() * 9000);
                const plateState = ['MX', 'TX', 'QRO', 'NL', 'CDMX'][Math.floor(Math.random() * 5)];

                batch.set(vehicleDoc, {
                    name,
                    company,
                    plate: `${plateState}-${plateSuffix}`,
                    maxWeight: specs.weight,
                    maxVolume: specs.volume,
                    status: 'available',
                    costPerKm: name.includes('Camioneta') || name.includes('Nissan') ? 12 : 25,
                    lastMaintenance: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                });
                count++;
            }
        }

        await batch.commit();

        return NextResponse.json({
            success: true,
            message: `Database updated. Added ${count} vehicles across ${PARTNER_COMPANIES.length} companies.`,
            companies: PARTNER_COMPANIES,
            typesCount: Object.keys(TRUCK_STANDARDS).length
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
