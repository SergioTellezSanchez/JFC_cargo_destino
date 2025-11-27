import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    const body = await request.json();
    const { packageId, driverId } = body;

    // Create a new delivery record
    const delivery = await prisma.delivery.create({
        data: {
            packageId,
            driverId,
            status: 'ASSIGNED',
            history: {
                create: {
                    status: 'ASSIGNED',
                },
            },
        },
    });

    return NextResponse.json(delivery);
}
