import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAuth, unauthorized } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();

    try {
        const batch = adminDb.batch();

        // 1. Seed Vehicles
        const vehiclesRef = adminDb.collection('vehicles');
        const vehicleData = [
            {
                name: "Kenworth T680 - Master",
                plate: "72-AS-1A",
                capacity: 25000,
                value: 2800000,
                usefulLifeKm: 800000,
                costPerKm: 18.5,
                suspensionType: "Neumática",
                length: 1500, width: 260, height: 420,
                createdBy: auth.uid,
                currentLoad: 0
            },
            {
                name: "Freightliner Cascadia",
                plate: "91-BB-2C",
                capacity: 30000,
                value: 3200000,
                usefulLifeKm: 1000000,
                costPerKm: 20.2,
                suspensionType: "Neumática",
                length: 1600, width: 260, height: 430,
                createdBy: auth.uid,
                currentLoad: 0
            },
            {
                name: "Isuzu ELF 600",
                plate: "LC-12-987",
                capacity: 6000,
                value: 950000,
                usefulLifeKm: 500000,
                costPerKm: 12.0,
                suspensionType: "Muelles",
                length: 700, width: 230, height: 300,
                createdBy: auth.uid,
                currentLoad: 0
            }
        ];

        const seededVehicleIds: string[] = [];
        for (const v of vehicleData) {
            const ref = vehiclesRef.doc();
            batch.set(ref, { ...v, createdAt: new Date().toISOString() });
            seededVehicleIds.push(ref.id);
        }

        // 2. Seed Drivers (In 'users' collection with role DRIVER)
        const driversRef = adminDb.collection('users');
        const driverData = [
            { name: "Juan Carlos Rodríguez", phone: "55-1234-5678", licenseNumber: "FED-998877", email: "juan.rodriguez@jfcargo.com", createdBy: auth.uid, status: 'AVAILABLE', role: 'DRIVER' },
            { name: "Pedro Antonio Lopez", phone: "72-9876-5432", licenseNumber: "FED-112233", email: "pedro.lopez@jfcargo.com", createdBy: auth.uid, status: 'AVAILABLE', role: 'DRIVER' },
            { name: "Miguel Angel Sánchez", phone: "55-4433-2211", licenseNumber: "FED-556677", email: "miguel.sanchez@jfcargo.com", createdBy: auth.uid, status: 'AVAILABLE', role: 'DRIVER' }
        ];

        driverData.forEach(d => {
            const ref = driversRef.doc();
            // Assign random vehicle from seeded ones
            const randomVehicleId = seededVehicleIds[Math.floor(Math.random() * seededVehicleIds.length)];
            batch.set(ref, { ...d, vehicleId: randomVehicleId, createdAt: new Date().toISOString() });
        });

        // 3. Seed Warehouses (In 'storage_locations' collection)
        const storageRef = adminDb.collection('storage_locations');
        const storageData = [
            { name: "CEDIS Toluca - Lerma", address: "Av. Las Partidas 120, Lerma, Edo. Méx.", capacity: "50,000 m2", location: "Toluca, Méx.", createdBy: auth.uid },
            { name: "Planta San Luis Potosí", address: "Eje 140 S/N, Zona Industrial, SLP", capacity: "25,000 m2", location: "San Luis Potosí", createdBy: auth.uid }
        ];

        storageData.forEach(s => {
            const ref = storageRef.doc();
            batch.set(ref, { ...s, createdAt: new Date().toISOString() });
        });

        // 4. Ensure Admin User Roles (Search by email)
        const admins = ['sergiotellezsanchez@gmail.com', 'contacto@jfccargodestino.com'];
        const usersRef = adminDb.collection('users');

        for (const email of admins) {
            const snap = await usersRef.where('email', '==', email).get();
            snap.docs.forEach(doc => {
                batch.update(doc.ref, { role: 'ADMIN_MASTER' });
            });
        }

        await batch.commit();
        return NextResponse.json({ success: true, message: "Database seeded with Mexican data and random vehicle assignments." });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
    }
}
