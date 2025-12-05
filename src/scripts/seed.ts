
const admin = require('firebase-admin');
const { getApps } = require('firebase-admin/app');

// Basic check for env vars
if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn('Warning: FIREBASE_PROJECT_ID not found in process.env. Trying to load from .env.local via dotenv...');
    try {
        require('dotenv').config({ path: '.env.local' });
    } catch (e) {
        console.error('Error loading dotenv. Make sure it is installed if you rely on .env files.');
    }
}

if (!getApps().length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.error('Missing Firebase environment variables!');
        process.exit(1);
    }

    // Normalize key: replace literal \n with real newlines
    let privKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    // Also strip possible CR if on windows
    privKey = privKey.replace(/\r/g, '');

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privKey,
            }),
        });
        console.log('Firebase Admin initialized successfully.');
    } catch (error) {
        console.error('Firebase Admin initialization failed:', error);
        process.exit(1);
    }
}

const db = admin.firestore();

async function seedDrivers() {
    console.log('Seeding Drivers...');
    const drivers = [
        {
            name: "Juan Perez",
            email: "juan.perez@example.com",
            phone: "+525512345678",
            licenseNumber: "CDMX-123456",
            role: "DRIVER",
            status: "AVAILABLE",
            vehicleId: null,
            createdAt: new Date().toISOString()
        },
        {
            name: "Maria Gonzalez",
            email: "maria.gonzalez@example.com",
            phone: "+525587654321",
            licenseNumber: "CDMX-654321",
            role: "DRIVER",
            status: "BUSY",
            vehicleId: null,
            createdAt: new Date().toISOString()
        },
        {
            name: "Carlos Lopez",
            email: "carlos.lopez@example.com",
            phone: "+525511223344",
            licenseNumber: "CDMX-998877",
            role: "DRIVER",
            status: "OFFLINE",
            vehicleId: null,
            createdAt: new Date().toISOString()
        }
    ];

    for (const driver of drivers) {
        // Check if exists to avoid duplicates if possible, or just add
        // For simplicity in this seed, we'll suggest adding. 
        // Real seed might want to upsert based on email.
        const snapshot = await db.collection('users').where('email', '==', driver.email).get();
        if (snapshot.empty) {
            await db.collection('users').add(driver);
            console.log(`Added driver: ${driver.name}`);
        } else {
            console.log(`Driver already exists: ${driver.name}`);
        }
    }
}

async function seedVehicles() {
    console.log('Seeding Vehicles...');
    const vehicles = [
        {
            type: "VAN",
            plateNumber: "ABC-123",
            model: "Nissan NV200",
            capacity: "500kg",
            status: "ACTIVE",
            createdAt: new Date().toISOString()
        },
        {
            type: "MOTORCYCLE",
            plateNumber: "MOTO-99",
            model: "Honda Corto",
            capacity: "30kg",
            status: "ACTIVE",
            createdAt: new Date().toISOString()
        },
        {
            type: "TRUCK",
            plateNumber: "XYZ-789",
            model: "Ford F-150",
            capacity: "1000kg",
            status: "MAINTENANCE",
            createdAt: new Date().toISOString()
        }
    ];

    for (const vehicle of vehicles) {
        const snapshot = await db.collection('vehicles').where('plateNumber', '==', vehicle.plateNumber).get();
        if (snapshot.empty) {
            await db.collection('vehicles').add(vehicle);
            console.log(`Added vehicle: ${vehicle.plateNumber}`);
        } else {
            console.log(`Vehicle already exists: ${vehicle.plateNumber}`);
        }
    }
}

async function seedPackages() {
    console.log('Seeding Packages...');
    const packages = [
        {
            trackingId: "PKG-001",
            recipientName: "Ana Torres",
            address: "Av. Reforma 123, CDMX",
            postalCode: "06600",
            status: "PENDING",
            storageStatus: "IN_WAREHOUSE",
            weight: 2.5,
            size: "MEDIUM",
            createdAt: new Date().toISOString()
        },
        {
            trackingId: "PKG-002",
            recipientName: "Luis Hernandez",
            address: "Calle 10, Num 45, CDMX",
            postalCode: "03100",
            status: "IN_TRANSIT",
            storageStatus: "OUT",
            weight: 5.0,
            size: "LARGE",
            createdAt: new Date().toISOString()
        },
        {
            trackingId: "PKG-003",
            recipientName: "Sofia Castro",
            address: "Insurgentes Sur 1500, CDMX",
            postalCode: "01020",
            status: "DELIVERED",
            storageStatus: "OUT",
            weight: 1.0,
            size: "SMALL",
            createdAt: new Date().toISOString()
        },
        {
            trackingId: "PKG-004",
            recipientName: "Pedro Martinez",
            address: "Polanco V, CDMX",
            postalCode: "11560",
            status: "PENDING",
            storageStatus: "NONE", // Not matched yet
            weight: 0.5,
            size: "SMALL",
            createdAt: new Date().toISOString()
        }
    ];

    for (const pkg of packages) {
        const snapshot = await db.collection('packages').where('trackingId', '==', pkg.trackingId).get();
        if (snapshot.empty) {
            await db.collection('packages').add(pkg);
            console.log(`Added package: ${pkg.trackingId}`);
        } else {
            console.log(`Package already exists: ${pkg.trackingId}`);
        }
    }
}

async function main() {
    try {
        await seedDrivers();
        await seedVehicles();
        await seedPackages();
        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

main();
