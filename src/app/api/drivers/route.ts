import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const drivers = await prisma.user.findMany({
        where: {
            role: 'DRIVER',
        },
    });
    return NextResponse.json(drivers);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, licenseNumber } = body;

        const newDriver = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                licenseNumber,

                role: 'DRIVER',
            },
        });

        return NextResponse.json(newDriver);
    } catch (error) {
        console.error('Error creating driver:', error);
        return NextResponse.json(
            { error: 'Failed to create driver' },
            { status: 500 }
        );
    }
}
