'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getDrivers() {
    return await prisma.user.findMany({
        where: { role: 'DRIVER' },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createDriver(data: any) {
    await prisma.user.create({
        data: {
            ...data,
            role: 'DRIVER'
        }
    });
    revalidatePath('/drivers');
}

export async function deleteDriver(id: string) {
    await prisma.user.delete({
        where: { id }
    });
    revalidatePath('/drivers');
}
