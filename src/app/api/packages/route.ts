import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { mockData } from '@/lib/mockData';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('trackingId');
    const storageStatus = searchParams.get('storageStatus');

    try {
        const whereClause: any = {};
        if (trackingId) {
            whereClause.trackingId = { contains: trackingId };
        }
        if (storageStatus) {
            whereClause.storageStatus = storageStatus;
        }

        const packages = await prisma.package.findMany({
            where: whereClause,
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
    } catch (error) {
        console.warn('Database failed, returning mock data');
        let filtered = mockData.packages;
        if (trackingId) filtered = filtered.filter(p => p.trackingId.includes(trackingId));
        if (storageStatus) filtered = filtered.filter(p => p.storageStatus === storageStatus);
        return NextResponse.json(filtered);
    }
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

