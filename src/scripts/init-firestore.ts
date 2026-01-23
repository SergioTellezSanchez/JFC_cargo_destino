#!/usr/bin/env ts-node

/**
 * Initialize Firestore Collections
 * 
 * This script creates initial data for testing and development.
 * Run with: npm run init-firestore
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

// Collection names
const COLLECTIONS = {
    CLIENTS: 'clients',
    CARRIERS: 'carriers',
    DRIVERS: 'drivers',
    VEHICLES: 'vehicles',
    WAREHOUSES: 'warehouses',
    QUOTES: 'quotes',
    ORDERS: 'orders',
    AUCTIONS: 'auctions',
    BIDS: 'bids',
    SHIPMENTS: 'shipments',
    PAYMENTS: 'payments',
    INVOICES: 'invoices',
    DOCUMENTS: 'documents',
    TRACKING: 'tracking',
    INCIDENTS: 'incidents',
    SUPPORT_TICKETS: 'support_tickets',
    NOTIFICATIONS: 'notifications',
    ANALYTICS: 'analytics',
    AUDIT_LOGS: 'audit_logs',
};

async function initializeFirestore() {
    console.log('🚀 Initializing Firestore collections...\n');

    try {
        // Create sample client
        console.log('📦 Creating sample client...');
        const clientRef = await db.collection(COLLECTIONS.CLIENTS).add({
            email: 'cliente@example.com',
            name: 'Cliente Demo',
            phone: '+525512345678',
            company: 'Empresa Demo S.A. de C.V.',
            address: {
                street: 'Av. Reforma 123',
                city: 'Ciudad de México',
                state: 'CDMX',
                zipCode: '06600',
                country: 'México',
            },
            creditLimit: 100000,
            paymentTerms: '30 días',
            status: 'active',
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        });
        console.log(`✅ Client created: ${clientRef.id}\n`);

        // Create sample carrier
        console.log('🚚 Creating sample carrier...');
        const carrierRef = await db.collection(COLLECTIONS.CARRIERS).add({
            name: 'Transportes JFC',
            email: 'transportes@jfc.com',
            phone: '+525587654321',
            rfc: 'TJF123456ABC',
            address: {
                street: 'Av. Insurgentes 456',
                city: 'Ciudad de México',
                state: 'CDMX',
                zipCode: '03100',
                country: 'México',
            },
            fleetSize: 10,
            rating: 4.5,
            status: 'active',
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        });
        console.log(`✅ Carrier created: ${carrierRef.id}\n`);

        // Create sample driver
        console.log('👨‍✈️ Creating sample driver...');
        const driverRef = await db.collection(COLLECTIONS.DRIVERS).add({
            carrierId: carrierRef.id,
            name: 'Juan Pérez',
            email: 'juan.perez@jfc.com',
            phone: '+525511112222',
            license: 'A1234567',
            licenseExpiry: admin.firestore.Timestamp.fromDate(
                new Date('2026-12-31')
            ),
            dailySalary: 800,
            status: 'available',
            rating: 4.8,
            totalTrips: 0,
            earnings: 0,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        });
        console.log(`✅ Driver created: ${driverRef.id}\n`);

        // Create sample vehicle (with updated schema)
        console.log('🚛 Creating sample vehicle...');
        const vehicleRef = await db.collection(COLLECTIONS.VEHICLES).add({
            carrierId: carrierRef.id,
            name: 'Freightliner Cascadia 2022',
            type: 'truck',
            plates: 'ABC-123-XYZ',
            year: 2022,
            make: 'Freightliner',
            model: 'Cascadia',

            // Capacity
            capacity: 5000, // kg
            volumetricCapacity: 30, // m³
            palletCapacity: 20,

            // Fuel & Efficiency
            fuelType: 'diesel',
            fuelEfficiency: 2.5, // km/l

            // Vehicle Characteristics
            suspensionType: 'Neumática',
            category: 'Camiones unitarios (Rígidos)',
            vehicleTypes: ['Caja Seca'],
            dimensions: { l: 8.5, w: 2.5, h: 3.0 },

            // Financial
            value: 1500000, // MXN
            costPerKm: 12.5,
            depreciationPerKm: 3.0,
            usefulLifeKm: 500000,

            // Status
            status: 'active',
            currentDriverId: driverRef.id,

            // Additional
            description: 'Camión de carga general para rutas regionales',
            uses: ['Urbano', 'Regional', 'Carga general'],
            company: 'Transportes JFC',

            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        });
        console.log(`✅ Vehicle created: ${vehicleRef.id}\n`);

        // Create sample warehouse
        console.log('🏭 Creating sample warehouse...');
        const warehouseRef = await db.collection(COLLECTIONS.WAREHOUSES).add({
            name: 'Almacén Central CDMX',
            location: new admin.firestore.GeoPoint(19.4326, -99.1332),
            address: {
                street: 'Calzada Ignacio Zaragoza 1234',
                city: 'Ciudad de México',
                state: 'CDMX',
                zipCode: '15530',
                country: 'México',
            },
            capacity: {
                weight: 100000,
                volume: 500,
                pallets: 200,
            },
            operatingHours: {
                open: '08:00',
                close: '18:00',
            },
            manager: 'María González',
            status: 'active',
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        });
        console.log(`✅ Warehouse created: ${warehouseRef.id}\n`);

        console.log('✨ Firestore initialization complete!\n');
        console.log('📊 Summary:');
        console.log(`   - 1 Client`);
        console.log(`   - 1 Carrier`);
        console.log(`   - 1 Driver`);
        console.log(`   - 1 Vehicle (with updated schema)`);
        console.log(`   - 1 Warehouse`);
        console.log('\n🎉 Ready to start development!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing Firestore:', error);
        process.exit(1);
    }
}

// Run the initialization
initializeFirestore();
