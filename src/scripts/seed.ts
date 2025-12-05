import admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Helper to format private key
function formatPrivateKey(key: string | undefined) {
    if (!key) return undefined;
    const match = key.match(/-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/);
    if (match) {
        let cleanKey = match[0];
        if (cleanKey.includes('\\n')) {
            cleanKey = cleanKey.replace(/\\n/g, '\n');
        }
        return cleanKey;
    }
    const rawKey = key.replace(/^['"]|['"]$/g, '').trim();
    if (rawKey.includes('\\n')) {
        return rawKey.replace(/\\n/g, '\n');
    }
    return rawKey;
}

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
            }),
        });
        console.log('Firebase Admin initialized successfully.');
    } catch (error) {
        console.error('Firebase Admin initialization failed:', error);
        process.exit(1);
    }
}

const db = admin.firestore();

// Data Generators
const firstNames = ['Juan', 'Maria', 'Pedro', 'Ana', 'Luis', 'Sofia', 'Carlos', 'Fernanda', 'Jose', 'Laura', 'Miguel', 'Carmen', 'David', 'Lucia', 'Jorge'];
const lastNames = ['Perez', 'Gonzalez', 'Lopez', 'Rodriguez', 'Martinez', 'Hernandez', 'Garcia', 'Ramirez', 'Sanchez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Cruz'];
const colonias = ['Polanco', 'Roma Norte', 'Condesa', 'Centro Historico', 'Del Valle', 'Narvarte', 'Juarez', 'Coyoacan', 'San Angel', 'Santa Fe'];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedDrivers() {
    console.log('Seeding 15 Drivers...');
    const drivers = [];
    for (let i = 0; i < 15; i++) {
        const name = `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
        drivers.push({
            name,
            email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
            phone: `+5255${getRandomInt(10000000, 99999999)}`,
            licenseNumber: `CDMX-${getRandomInt(10000, 99999)}`,
            role: "DRIVER",
            status: getRandomElement(["AVAILABLE", "BUSY", "OFFLINE"]),
            vehicleId: null,
            createdAt: new Date().toISOString()
        });
    }

    for (const driver of drivers) {
        const snapshot = await db.collection('users').where('email', '==', driver.email).get();
        if (snapshot.empty) {
            await db.collection('users').add(driver);
        }
    }
    console.log('Drivers seeded.');
}

async function seedVehicles() {
    console.log('Seeding 25 Vehicles (Enhanced)...');

    const vehicleSpecs = {
        "VAN": {
            models: ["Nissan NV200", "Chevrolet Express", "Ford Transit"],
            capacityWeight: 800,
            capacityVolume: 4.2,
            fuelType: "GASOLINE",
            fuelPerformance: 10.5,
            marketValue: 450000
        },
        "MOTORCYCLE": {
            models: ["Honda Cargo 150", "Yamaha YBR 125", "Italika FT150"],
            capacityWeight: 30,
            capacityVolume: 0.1,
            fuelType: "GASOLINE",
            fuelPerformance: 35.0,
            marketValue: 25000
        },
        "TRUCK": {
            models: ["Ford F-150", "Chevrolet Silverado", "Ram 1500"],
            capacityWeight: 1500,
            capacityVolume: 6.5,
            fuelType: "GASOLINE",
            fuelPerformance: 7.5,
            marketValue: 850000
        }
    };

    const vehicles = [];
    for (let i = 0; i < 25; i++) {
        const type = getRandomElement(["VAN", "MOTORCYCLE", "TRUCK"]) as keyof typeof vehicleSpecs;
        const specs = vehicleSpecs[type];
        const model = getRandomElement(specs.models);

        vehicles.push({
            make: model.split(' ')[0],
            model: model.split(' ').slice(1).join(' '),
            year: getRandomInt(2020, 2024),
            plate: `${String.fromCharCode(65 + getRandomInt(0, 25))}${String.fromCharCode(65 + getRandomInt(0, 25))}${String.fromCharCode(65 + getRandomInt(0, 25))}-${getRandomInt(100, 999)}`,
            capacityVolume: specs.capacityVolume,
            capacityWeight: specs.capacityWeight,
            fuelType: specs.fuelType,
            fuelPerformance: specs.fuelPerformance,
            fuelPrice: 24.50, // Average gasoline price
            marketValue: specs.marketValue,
            usefulLifeDays: 1825, // 5 years
            status: getRandomElement(["ACTIVE", "MAINTENANCE", "IN_USE"]),
            createdAt: new Date().toISOString()
        });
    }

    for (const vehicle of vehicles) {
        const snapshot = await db.collection('vehicles').where('plate', '==', vehicle.plate).get();
        if (snapshot.empty) {
            await db.collection('vehicles').add(vehicle);
        }
    }
    console.log('Vehicles seeded.');
}

async function seedWarehouses() {
    console.log('Seeding 10 Warehouses...');
    const warehouses = [
        { location: "CEDIS Norte - Vallejo", capacity: 5000 },
        { location: "Bodega Sur - Coapa", capacity: 3000 },
        { location: "Centro Logístico Oriente - Iztapalapa", capacity: 8000 },
        { location: "Almacén Poniente - Santa Fe", capacity: 2500 },
        { location: "Hub Central - Doctores", capacity: 4000 },
        { location: "Bodega Satélite", capacity: 2000 },
        { location: "CEDIS Tlalnepantla", capacity: 6000 },
        { location: "Almacén Aeropuerto", capacity: 10000 },
        { location: "Bodega Central de Abastos", capacity: 7500 },
        { location: "Hub Express - Polanco", capacity: 1500 }
    ];

    for (const warehouse of warehouses) {
        const snapshot = await db.collection('storage_locations').where('location', '==', warehouse.location).get();
        if (snapshot.empty) {
            await db.collection('storage_locations').add({
                ...warehouse,
                currentLoad: getRandomInt(0, warehouse.capacity / 2), // Start with some load
                createdAt: new Date().toISOString()
            });
        }
    }
    console.log('Warehouses seeded.');
}

async function seedPackages() {
    console.log('Seeding 100 Packages...');
    const packages = [];
    for (let i = 1; i <= 100; i++) {
        const status = getRandomElement(["PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED"]);
        const storageStatus = status === "PENDING" ? getRandomElement(["IN_WAREHOUSE", "NONE"]) : "OUT";

        packages.push({
            trackingId: `PKG-${String(i).padStart(3, '0')}-${getRandomInt(1000, 9999)}`,
            recipientName: `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`,
            address: `Calle ${getRandomInt(1, 100)}, ${getRandomElement(colonias)}, CDMX`,
            postalCode: `0${getRandomInt(1000, 9999)}`,
            status,
            storageStatus,
            weight: getRandomInt(1, 20) / 2,
            size: getRandomElement(["SMALL", "MEDIUM", "LARGE"]),
            createdAt: new Date().toISOString()
        });
    }

    const batchSize = 20;
    for (let i = 0; i < packages.length; i += batchSize) {
        const chunk = packages.slice(i, i + batchSize);
        const batch = db.batch();

        for (const pkg of chunk) {
            const ref = db.collection('packages').doc();
            batch.set(ref, pkg);
        }
        await batch.commit();
        console.log(`Seeded packages ${i + 1} to ${Math.min(i + batchSize, packages.length)}`);
    }
    console.log('Packages seeded.');
}

async function main() {
    try {
        await seedDrivers();
        await seedVehicles();
        await seedWarehouses();
        await seedPackages();
        console.log('Enhanced seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

main();
