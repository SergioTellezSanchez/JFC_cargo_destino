import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mockData } from '@/lib/mockData';

export async function GET() {
    try {
        const vehicles = await prisma.vehicle.findMany();
        return NextResponse.json(vehicles);
    } catch (error) {
        console.warn('Database failed, returning mock vehicles');
        return NextResponse.json(mockData.vehicles);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const vehicle = await prisma.vehicle.create({ data: body });
        return NextResponse.json(vehicle);
    } catch (error) {
        console.error('Failed to create vehicle:', error);
        return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
    }
}
