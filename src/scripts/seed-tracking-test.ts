import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { Timestamp } from 'firebase-admin/firestore';

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

async function seedTrackingTest() {
    console.log('Seeding Test Package for Real-time Tracking...');

    const packageId = 'TEST-TRACK-001';

    // Coordinates near Paseo de la Reforma, Mexico City
    const startLat = 19.4294;
    const startLng = -99.1633;

    const testPackage = {
        trackingId: packageId,
        recipientName: "Cliente de Prueba Tracking",
        address: "Av. Paseo de la Reforma 222, CDMX",
        postalCode: "06600",
        status: "IN_TRANSIT",
        storageStatus: "NONE",
        weight: 15.5,
        size: "MEDIUM",
        dimensions: "40x40x40",
        price: 1500,
        declaredValue: 5000,

        // Critical for Real-time Map
        latitude: startLat,
        longitude: startLng,
        lastLocationUpdate: new Date().toISOString(),

        // Delivery details
        deliveries: [{
            id: `del_${Date.now()}`,
            status: "IN_TRANSIT",
            driverId: "test_driver_id", // Placeholder
            vehicleId: "test_vehicle_id", // Placeholder
            updatedAt: new Date().toISOString()
        }],

        createdAt: new Date().toISOString()
    };

    try {
        // Use set with merge: true or just overwrite for this test
        // We query by trackingId first to see if we should update or add
        const q = await db.collection('packages').where('trackingId', '==', packageId).get();

        if (!q.empty) {
            const docId = q.docs[0].id;
            await db.collection('packages').doc(docId).set(testPackage, { merge: true });
            console.log(`Updated existing test package: ${packageId} (Doc ID: ${docId})`);
        } else {
            await db.collection('packages').add(testPackage);
            console.log(`Created new test package: ${packageId}`);
        }

        console.log('------------------------------------------------');
        console.log('✅ SEED SUCCESSFUL');
        console.log(`🆔 Tracking ID: ${packageId}`);
        console.log(`📍 Location: ${startLat}, ${startLng}`);
        console.log('👉 Go to /tracking and search for this ID.');
        console.log('------------------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding test package:', error);
        process.exit(1);
    }
}

seedTrackingTest();
