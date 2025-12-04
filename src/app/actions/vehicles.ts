'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function getVehicles() {
    return await prisma.vehicle.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

export async function createVehicle(data: any) {
    await prisma.vehicle.create({
        data: {
            make: data.make,
            model: data.model,
            year: Number(data.year),
            plate: data.plate,
            capacityVolume: Number(data.capacityVolume),
            capacityWeight: Number(data.capacityWeight),
            fuelType: data.fuelType,
            fuelPerformance: Number(data.fuelPerformance),
            fuelPrice: Number(data.fuelPrice),
            marketValue: Number(data.marketValue),
            usefulLifeDays: Number(data.usefulLifeDays),
            // Calculate daily depreciation
            dailyDepreciation: Number(data.marketValue) / Number(data.usefulLifeDays),
        },
    });
    revalidatePath('/vehicles');
}

export async function deleteVehicle(id: string) {
    await prisma.vehicle.delete({
        where: { id },
    });
    revalidatePath('/vehicles');
}
