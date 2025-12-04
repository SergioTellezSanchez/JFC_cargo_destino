import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DRIVER_NAMES = [
    'Juan Pérez', 'María López', 'Carlos Ramírez', 'Ana Martínez', 'Luis Hernández',
    'Sofía González', 'Jorge Rodríguez', 'Carmen Sánchez', 'Miguel Torres', 'Patricia Flores',
    'Fernando Rivera', 'Diana Gómez', 'Ricardo Díaz', 'Gabriela Cruz', 'Antonio Reyes',
    'Verónica Morales', 'Héctor Ortiz', 'Rosa Gutiérrez', 'Javier Castro', 'Claudia Ruiz',
    'Alejandro Vargas', 'Mónica Jiménez', 'Roberto Silva', 'Adriana Ramos', 'Daniel Medina',
    'Teresa Aguilar', 'Eduardo Mendoza', 'Yolanda Castillo', 'Francisco Romero', 'Isabel Delgado'
];

const WAREHOUSE_LOCATIONS = [
    'Atlacomulco Norte', 'Atlacomulco Sur', 'Toluca Industrial', 'Toluca Aeropuerto',
    'Jilotepec Centro', 'Polotitlán Logística', 'San Felipe del Progreso', 'Ixtlahuaca Distribución',
    'El Oro Almacén', 'Acambay Bodega', 'Temascalcingo Ruta', 'Jocotitlán Parque'
];

const ORIGINS = ['CDMX', 'Monterrey', 'Guadalajara', 'Laredo', 'Manzanillo', 'Veracruz', 'Tijuana', 'Querétaro'];

async function main() {
    console.log('🌱 Starting JFC Cargo Destino seed...')

    // Clear existing data
    await prisma.deliveryHistory.deleteMany()
    await prisma.delivery.deleteMany()
    await prisma.packagePhoto.deleteMany()
    await prisma.package.deleteMany()
    await prisma.temporaryStorage.deleteMany()
    await prisma.vehicle.deleteMany()
    await prisma.user.deleteMany()
    console.log('🧹 Database cleared')

    // Create Admin User
    await prisma.user.create({
        data: {
            email: 'admin@jfc.com',
            name: 'Admin JFC',
            role: 'ADMIN',
        },
    })
    console.log('✅ Admin created')

    // Create 30 Drivers
    const drivers = []
    for (let i = 0; i < 30; i++) {
        const name = DRIVER_NAMES[i] || `Conductor ${i + 1}`;
        const d = await prisma.user.create({
            data: {
                email: `driver${i + 1}@jfc.com`,
                name: name,
                role: 'DRIVER',
                phone: `55${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
                licenseNumber: `LIC-${Math.floor(Math.random() * 1000000)}`,
            },
        })
        drivers.push(d)
    }
    console.log('✅ 30 Drivers created')

    // Create 50 Vehicles
    const vehicles = []
    const vehicleTypes = ['Nissan NP300', 'Ford Transit', 'Kenworth T680', 'Isuzu ELF', 'Volkswagen Transporter'];
    for (let i = 0; i < 50; i++) {
        const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        const v = await prisma.vehicle.create({
            data: {
                make: type.split(' ')[0],
                model: type.split(' ')[1],
                year: 2018 + Math.floor(Math.random() * 6),
                plate: `JFC-${Math.floor(Math.random() * 1000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
                capacityVolume: Math.floor(Math.random() * 20) + 5,
                capacityWeight: Math.floor(Math.random() * 5000) + 1000,
                fuelType: Math.random() > 0.7 ? 'DIESEL' : 'GASOLINE',
                fuelPerformance: Math.floor(Math.random() * 10) + 5,
                marketValue: Math.floor(Math.random() * 500000) + 200000,
                usefulLifeDays: 365 * 10,
            },
        })
        vehicles.push(v)
    }
    console.log('✅ 50 Vehicles created')

    // Create 12 Warehouses
    const warehouses = []
    for (let i = 0; i < 12; i++) {
        const w = await prisma.temporaryStorage.create({
            data: {
                location: WAREHOUSE_LOCATIONS[i],
                capacity: Math.floor(Math.random() * 500) + 100,
                currentLoad: 0,
                createdAt: new Date('2026-01-01'),
                updatedAt: new Date('2026-01-01'),
            },
        })
        warehouses.push(w)
    }
    console.log('✅ 12 Warehouses created')

    // Create 300 Packages
    const packages = []
    for (let i = 0; i < 300; i++) {
        const origin = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
        const isBackhaul = Math.random() > 0.8; // 20% backhaul chance

        // Random date in 2026
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        const date = new Date(2026, month, day);

        // Storage logic
        let storageStatus = 'NONE';
        let storageId = null;
        const rand = Math.random();
        if (rand > 0.9) {
            storageStatus = 'REQUESTED';
        } else if (rand > 0.8) {
            storageStatus = 'APPROVED';
            storageId = warehouses[Math.floor(Math.random() * warehouses.length)].id;
        } else if (rand > 0.7) {
            storageStatus = 'STORED';
            storageId = warehouses[Math.floor(Math.random() * warehouses.length)].id;
        }

        const p = await prisma.package.create({
            data: {
                trackingId: `JFC-${String(i + 1).padStart(5, '0')}`,
                recipientName: `Cliente ${i + 1}`,
                address: `Calle ${i + 1}, Col. Centro, Atlacomulco, Edo Mex`,
                postalCode: '50450',
                weight: Math.floor(Math.random() * 50) + 1,
                size: ['SMALL', 'MEDIUM', 'LARGE'][Math.floor(Math.random() * 3)],
                declaredValue: Math.floor(Math.random() * 10000) + 500,
                insurance: Math.random() > 0.5,
                isBackhaul: isBackhaul,
                instructions: `Procedente de ${origin}`,
                storageId: storageId,
                storageStatus: storageStatus,
                createdAt: date,
                updatedAt: date,
            },
        })
        packages.push(p)
    }
    console.log('✅ 300 Packages created')

    // Create Deliveries (Assign some to drivers)
    let assignedCount = 0;
    for (const pkg of packages) {
        // 60% assigned, 40% pending
        if (Math.random() > 0.4) {
            const driver = drivers[Math.floor(Math.random() * drivers.length)];
            const deliveryDate = new Date(pkg.createdAt);
            deliveryDate.setDate(deliveryDate.getDate() + 1); // Delivery 1 day after creation

            await prisma.delivery.create({
                data: {
                    packageId: pkg.id,
                    driverId: driver.id,
                    status: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'][Math.floor(Math.random() * 4)],
                    createdAt: deliveryDate,
                    updatedAt: deliveryDate,
                },
            })
            assignedCount++;
        } else {
            await prisma.delivery.create({
                data: {
                    packageId: pkg.id,
                    status: 'PENDING',
                    createdAt: pkg.createdAt,
                    updatedAt: pkg.createdAt,
                },
            })
        }
    }
    console.log(`✅ Deliveries created (${assignedCount} assigned)`)

    console.log('🎉 JFC Demo Seed Completed!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Error during seed:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
