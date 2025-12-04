'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function getVehiclesAndDrivers() {
    const vehicles = await prisma.vehicle.findMany();
    const drivers = await prisma.user.findMany({
        where: { role: 'DRIVER' },
    });
    return { vehicles, drivers };
}

export async function createPackage(data: any) {
    // Logic for backhaul: Check if there is a delivery arriving at the origin of this new package
    // around the same time. For simplicity, we just check if any vehicle is currently at the origin.
    // Or we check if there's a delivery with status 'DELIVERED' at the origin location.

    // Logic for tolls: Mock calculation based on distance
    const tolls = Math.floor(Math.random() * 500); // Mock tolls between 0 and 500

    // Logic for advance payment: "costos de ir a recoger el paquete"
    // Assume a fixed pickup cost or based on distance from base to pickup.
    const advancePayment = 200; // Fixed pickup cost for now

    const newPackage = await prisma.package.create({
        data: {
            trackingId: `TRK-${Date.now()}`,
            recipientName: data.recipientName,
            address: data.address,
            postalCode: data.postalCode,
            weight: Number(data.weight),
            size: data.size,
            instructions: data.instructions,
            leaveWithSecurity: data.leaveWithSecurity === 'true',
            declaredValue: Number(data.declaredValue),
            insurance: data.insurance === 'true',
            tolls: tolls,
            advancePayment: advancePayment,
            isBackhaul: data.isBackhaul === 'true',

            // Create photos
            photos: {
                create: data.photos.map((url: string) => ({ url })),
            },
        },
    });

    // Create Delivery assignment
    if (data.vehicleId || data.driverId) {
        await prisma.delivery.create({
            data: {
                packageId: newPackage.id,
                driverId: data.driverId || undefined,
                status: 'ASSIGNED',
                // We don't have vehicleId in Delivery model directly, usually it's linked to driver
                // But if we want to track vehicle per delivery, we might need to add it or assume driver has vehicle.
                // For now, we just assign driver.
            },
        });
    }

    revalidatePath('/packages');
    return newPackage;
}

export async function checkBackhaulOpportunity(origin: string) {
    // Mock logic: return true randomly or if origin matches a "known" destination
    // In real app, query DB for recent deliveries to this location.
    return Math.random() > 0.7;
}
