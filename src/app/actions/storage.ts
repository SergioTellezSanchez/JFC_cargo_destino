'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function getStorageLocations() {
    return await prisma.temporaryStorage.findMany({
        include: {
            packages: true,
        },
    });
}

export async function createStorageLocation(data: any) {
    await prisma.temporaryStorage.create({
        data: {
            location: data.location,
            capacity: Number(data.capacity),
            currentLoad: 0,
        },
    });
    revalidatePath('/storage');
}

export async function addPackageToStorage(storageId: string, packageId: string) {
    // Update package with storageId
    await prisma.package.update({
        where: { id: packageId },
        data: { storageId },
    });

    // Update storage current load (mock increment)
    // In real app, we would sum package weights/volumes
    const storage = await prisma.temporaryStorage.findUnique({ where: { id: storageId } });
    if (storage) {
        await prisma.temporaryStorage.update({
            where: { id: storageId },
            data: { currentLoad: (storage.currentLoad || 0) + 1 }, // Simple count for now
        });
    }

    revalidatePath('/storage');
}
