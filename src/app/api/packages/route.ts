import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const packages = await prisma.package.findMany({
        include: {
            deliveries: {
                include: {
                    driver: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
        },
    });
    return NextResponse.json(packages);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { trackingId, recipientName, address, postalCode, weight, size, latitude, longitude, instructions, leaveWithSecurity } = body;

        // Validate required fields
        if (!trackingId || !recipientName || !address || !postalCode) {
            return NextResponse.json(
                { error: 'Missing required fields: trackingId, recipientName, address, postalCode' },
                { status: 400 }
            );
        }

        const newPackage = await prisma.package.create({
            data: {
                trackingId,
                recipientName,
                address,
                postalCode,
                latitude: latitude || null,
                longitude: longitude || null,
                weight: weight ? parseFloat(weight) : null,
                size,
                instructions: instructions || null,
                leaveWithSecurity: leaveWithSecurity || false,
            },
        });

        return NextResponse.json(newPackage);
    } catch (error: any) {
        console.error('Error creating package:', error);
        return NextResponse.json(
            { error: 'Failed to create package', details: error.message },
            { status: 500 }
        );
    }
}

