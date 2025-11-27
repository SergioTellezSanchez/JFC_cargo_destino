import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // Clear existing data
    await prisma.deliveryHistory.deleteMany()
    await prisma.delivery.deleteMany()
    await prisma.package.deleteMany()
    await prisma.user.deleteMany()
    console.log('🧹 Database cleared')

    // Create Admin User
    const admin = await prisma.user.create({
        data: {
            email: 'admin@cafer.com',
            name: 'Administrador CAFER',
            role: 'ADMIN',
        },
    })
    console.log('✅ Admin created')

    // Create 4 Drivers
    const driverData = [
        { name: 'Juan Pérez García', email: 'juan.perez@cafer.com' },
        { name: 'María López Hernández', email: 'maria.lopez@cafer.com' },
        { name: 'Carlos Ramírez Torres', email: 'carlos.ramirez@cafer.com' },
        { name: 'Ana Martínez Flores', email: 'ana.martinez@cafer.com' },
    ]

    const drivers = []
    for (const driver of driverData) {
        const d = await prisma.user.create({
            data: {
                email: driver.email,
                name: driver.name,
                role: 'DRIVER',
                vehicleType: 'MOTORCYCLE',
            },
        })
        drivers.push(d)
    }
    console.log('✅ 4 Drivers created')

    // Create 20 Packages
    const packageData = [
        // Atlacomulco Centro (50450)
        { recipientName: 'Roberto González', address: 'Av. Hidalgo 123, Centro', postalCode: '50450', weight: 3.5, size: 'MEDIUM' },
        { recipientName: 'Laura Jiménez', address: 'Calle Morelos 45, Centro', postalCode: '50450', weight: 1.2, size: 'SMALL' },
        { recipientName: 'Pedro Ramírez', address: 'Av. Juárez 89, Centro', postalCode: '50450', weight: 5.8, size: 'LARGE' },
        { recipientName: 'Carmen Flores', address: 'Calle Allende 67, Centro', postalCode: '50450', weight: 2.3, size: 'SMALL' },
        { recipientName: 'Miguel Ángel Torres', address: 'Av. Independencia 234, Centro', postalCode: '50450', weight: 4.1, size: 'MEDIUM' },

        // Atlacomulco Colonias (50458)
        { recipientName: 'Sofía Hernández', address: 'Col. San Isidro, Calle 5 de Mayo 12', postalCode: '50458', weight: 2.7, size: 'MEDIUM' },
        { recipientName: 'Jorge Luis Méndez', address: 'Col. Ejido de Atlacomulco, Calle Reforma 78', postalCode: '50458', weight: 3.9, size: 'MEDIUM' },
        { recipientName: 'Patricia Ruiz', address: 'Col. San Pedro, Av. Revolución 156', postalCode: '50458', weight: 1.5, size: 'SMALL' },
        { recipientName: 'Fernando Castro', address: 'Col. Guadalupe, Calle Insurgentes 34', postalCode: '50458', weight: 6.2, size: 'LARGE' },
        { recipientName: 'Diana Morales', address: 'Col. San Antonio, Calle Zaragoza 90', postalCode: '50458', weight: 2.1, size: 'SMALL' },

        // Atlacomulco Colonias (50459)
        { recipientName: 'Ricardo Vargas', address: 'Col. Emiliano Zapata, Calle Niños Héroes 23', postalCode: '50459', weight: 4.5, size: 'MEDIUM' },
        { recipientName: 'Gabriela Ortiz', address: 'Col. Benito Juárez, Av. Constitución 145', postalCode: '50459', weight: 3.2, size: 'MEDIUM' },
        { recipientName: 'Antonio Reyes', address: 'Col. Miguel Hidalgo, Calle Guerrero 67', postalCode: '50459', weight: 1.8, size: 'SMALL' },
        { recipientName: 'Verónica Guzmán', address: 'Col. Lázaro Cárdenas, Av. Progreso 89', postalCode: '50459', weight: 5.3, size: 'LARGE' },
        { recipientName: 'Héctor Navarro', address: 'Col. Francisco Villa, Calle Libertad 112', postalCode: '50459', weight: 2.9, size: 'MEDIUM' },

        // San Felipe del Progreso (50600)
        { recipientName: 'Mariana Silva', address: 'Centro, Calle Principal 45', postalCode: '50600', weight: 3.7, size: 'MEDIUM' },
        { recipientName: 'Luis Alberto Campos', address: 'Barrio de San Miguel, Calle del Carmen 23', postalCode: '50600', weight: 2.4, size: 'SMALL' },
        { recipientName: 'Rosa María Delgado', address: 'Col. Centro, Av. Juárez 78', postalCode: '50600', weight: 4.8, size: 'MEDIUM' },
        { recipientName: 'Javier Mendoza', address: 'Barrio de Santiago, Calle Hidalgo 56', postalCode: '50600', weight: 1.9, size: 'SMALL' },
        { recipientName: 'Claudia Estrada', address: 'Col. Guadalupe, Calle Morelos 134', postalCode: '50600', weight: 6.5, size: 'LARGE' },
    ]

    const packages = []
    for (let i = 0; i < packageData.length; i++) {
        const pkg = packageData[i]
        const trackingId = `CAFER-${String(i + 1).padStart(4, '0')}`

        const p = await prisma.package.create({
            data: {
                trackingId,
                recipientName: pkg.recipientName,
                address: pkg.address,
                postalCode: pkg.postalCode,
                weight: pkg.weight,
                size: pkg.size,
            },
        })
        packages.push(p)
    }
    console.log('✅ 20 Packages created')

    // Create Deliveries for all packages (initially PENDING)
    for (const pkg of packages) {
        await prisma.delivery.create({
            data: {
                id: `delivery-${pkg.id}`,
                packageId: pkg.id,
                status: 'PENDING',
                history: {
                    create: {
                        status: 'PENDING',
                    },
                },
            },
        })
    }
    console.log('✅ 20 Deliveries created')

    console.log('🎉 Seed completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - 1 Admin`)
    console.log(`   - 4 Drivers`)
    console.log(`   - 20 Packages`)
    console.log(`   - 20 Deliveries (PENDING)`)
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
