
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAuth, unauthorized } from '@/lib/auth-server';

const PARTNER_COMPANIES = [
    'JFC Cargo Central',
    'Logística Express MX',
    'Transportes del Norte',
    'Mudanzas Rápidas S.A.',
    'Flotilla Continental',
    'Aliado Estratégico Bajío'
];

const FIRST_NAMES = ['Juan', 'José', 'Luis', 'Carlos', 'Miguel', 'Pedro', 'Jorge', 'Antonio', 'Francisco', 'David', 'Daniel', 'Alejandro', 'Manuel', 'Ricardo', 'Fernando', 'Roberto', 'Javier', 'Eduardo', 'Sergio', 'Alberto'];
const LAST_NAMES = ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Vázquez', 'Reyes', 'Jiménez', 'Torres', 'Díaz', 'Gutiérrez', 'Mendoza'];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateLicense() {
    const prefix = getRandomElement(['CDMX', 'MEX', 'JAL', 'NLE', 'PUE']);
    const num = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${num}`;
}

function generatePhone() {
    return `+52 55 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();

    try {
        const batch = adminDb.batch();
        const driversRef = adminDb.collection('users'); // Updated to match /api/drivers reading from 'users'
        // Actually, let's use 'drivers' collection as it is standard in this project's recent context for specific entities.

        let count = 0;

        for (let i = 0; i < 20; i++) {
            const driverDoc = driversRef.doc();
            const firstName = getRandomElement(FIRST_NAMES);
            const lastName = getRandomElement(LAST_NAMES);
            const fullName = `${firstName} ${lastName}`;
            const company = getRandomElement(PARTNER_COMPANIES);

            const driverData = {
                carrierId: 'system_seed', // Placeholder
                name: fullName,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${count + 1}@${company.replace(/\s+/g, '').toLowerCase()}.com`,
                phone: generatePhone(),
                license: generateLicense(),
                licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + Math.floor(Math.random() * 3) + 1)).toISOString(), // 1-4 years future
                photoUrl: `https://i.pravatar.cc/150?u=${driverDoc.id}`,
                role: 'DRIVER', // Explicitly set role for /api/drivers filter
                age: Math.floor(25 + Math.random() * 35), // 25-60
                dailySalary: Math.floor(500 + Math.random() * 500), // 500-1000
                status: 'available',
                rating: (3.5 + Math.random() * 1.5).toFixed(1), // 3.5 - 5.0
                totalTrips: Math.floor(Math.random() * 500),
                earnings: Math.floor(Math.random() * 50000),
                company: company,
                vehicleId: null, // Initially unassigned
                currentVehicleId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            batch.set(driverDoc, driverData);
            count++;
        }

        await batch.commit();

        return NextResponse.json({
            success: true,
            message: `Database updated. Added ${count} drivers.`,
            companies: PARTNER_COMPANIES
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
