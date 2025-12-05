import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mockData } from '@/lib/mockData';

export async function GET() {
    try {
        const drivers = await prisma.user.findMany({
            where: {
                role: 'DRIVER',
            },
        });
        return NextResponse.json(drivers);
    } catch (error) {
        console.warn('Database failed, returning mock drivers');
        return NextResponse.json(mockData.users.filter(u => u.role === 'DRIVER'));
    }
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
