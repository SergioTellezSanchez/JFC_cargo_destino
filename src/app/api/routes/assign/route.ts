import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/routes/assign
 * Assigns pending deliveries to drivers based on postal code zones
 * 
 * Algorithm:
 * 1. Get all pending deliveries with their packages
 * 2. Group deliveries by postal code zones
 * 3. Get all available drivers
 * 4. Distribute zones evenly among drivers
 * 5. Assign deliveries to drivers and update status to ASSIGNED
 */
export async function POST() {
    try {
        console.log('🚀 Starting route assignment...');

        // Get all pending deliveries with packages
        const pendingDeliveries = await prisma.delivery.findMany({
            where: {
                status: 'PENDING',
            },
            include: {
                package: true,
            },
        });

        if (pendingDeliveries.length === 0) {
            return NextResponse.json({
                message: 'No pending deliveries to assign',
                assignments: [],
            });
        }

        console.log(`📦 Found ${pendingDeliveries.length} pending deliveries`);

        // Group deliveries by postal code
        const deliveriesByPostalCode = new Map<string, typeof pendingDeliveries>();

        for (const delivery of pendingDeliveries) {
            const postalCode = delivery.package.postalCode;
            if (!deliveriesByPostalCode.has(postalCode)) {
                deliveriesByPostalCode.set(postalCode, []);
            }
            deliveriesByPostalCode.get(postalCode)!.push(delivery);
        }

        console.log(`📍 Grouped into ${deliveriesByPostalCode.size} postal code zones`);

        // Get all available drivers
        const drivers = await prisma.user.findMany({
            where: {
                role: 'DRIVER',
            },
        });

        if (drivers.length === 0) {
            return NextResponse.json(
                { error: 'No drivers available' },
                { status: 400 }
            );
        }

        console.log(`👥 Found ${drivers.length} available drivers`);

        // Sort postal codes by delivery count (descending) for better distribution
        const sortedPostalCodes = Array.from(deliveriesByPostalCode.entries())
            .sort((a, b) => b[1].length - a[1].length);

        // Distribute zones to drivers using round-robin
        const driverAssignments = new Map<string, {
            driver: typeof drivers[0];
            deliveries: typeof pendingDeliveries;
            postalCodes: string[];
        }>();

        // Initialize driver assignments
        for (const driver of drivers) {
            driverAssignments.set(driver.id, {
                driver,
                deliveries: [],
                postalCodes: [],
            });
        }

        // Assign postal code zones to drivers in round-robin fashion
        let driverIndex = 0;
        for (const [postalCode, deliveries] of sortedPostalCodes) {
            const driver = drivers[driverIndex];
            const assignment = driverAssignments.get(driver.id)!;

            assignment.deliveries.push(...deliveries);
            assignment.postalCodes.push(postalCode);

            driverIndex = (driverIndex + 1) % drivers.length;
        }

        console.log('📋 Assignments created, updating database...');

        // Update deliveries in database
        const results = [];
        for (const [driverId, assignment] of driverAssignments.entries()) {
            if (assignment.deliveries.length === 0) continue;

            // Update all deliveries for this driver
            for (const delivery of assignment.deliveries) {
                await prisma.delivery.update({
                    where: { id: delivery.id },
                    data: {
                        driverId: driverId,
                        status: 'ASSIGNED',
                        history: {
                            create: {
                                status: 'ASSIGNED',
                            },
                        },
                    },
                });
            }

            results.push({
                driverId: driverId,
                driverName: assignment.driver.name,
                driverEmail: assignment.driver.email,
                deliveryCount: assignment.deliveries.length,
                postalCodes: assignment.postalCodes,
                deliveryIds: assignment.deliveries.map(d => d.id),
            });
        }

        console.log('✅ Route assignment completed successfully');

        return NextResponse.json({
            message: 'Routes assigned successfully',
            totalDeliveries: pendingDeliveries.length,
            driversAssigned: results.length,
            assignments: results,
        });

    } catch (error) {
        console.error('❌ Error assigning routes:', error);
        return NextResponse.json(
            { error: 'Failed to assign routes' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/routes/assign
 * Returns current route assignments summary
 */
export async function GET() {
    try {
        const drivers = await prisma.user.findMany({
            where: {
                role: 'DRIVER',
            },
            include: {
                deliveries: {
                    include: {
                        package: true,
                    },
                },
            },
        });

        const summary = drivers.map(driver => {
            const deliveriesByStatus = driver.deliveries.reduce((acc, delivery) => {
                acc[delivery.status] = (acc[delivery.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const postalCodes = [...new Set(
                driver.deliveries.map(d => d.package.postalCode)
            )];

            return {
                driverId: driver.id,
                driverName: driver.name,
                driverEmail: driver.email,
                totalDeliveries: driver.deliveries.length,
                deliveriesByStatus,
                postalCodes,
            };
        });

        return NextResponse.json({
            drivers: summary,
            totalDrivers: drivers.length,
        });

    } catch (error) {
        console.error('Error fetching route summary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch route summary' },
            { status: 500 }
        );
    }
}
