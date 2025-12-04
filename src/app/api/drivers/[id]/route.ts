import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, email, phone, licenseNumber } = body;

        const updatedDriver = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                licenseNumber,

            },
        });

        return NextResponse.json(updatedDriver);
    } catch (error) {
        console.error('Error updating driver:', error);
        return NextResponse.json({ error: 'Failed to update driver', details: String(error) }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        // First, unassign deliveries from this driver to avoid foreign key constraint errors
        await prisma.delivery.updateMany({
            where: { driverId: id },
            data: { driverId: null, status: 'PENDING' }, // Reset status to PENDING if driver is deleted
        });

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting driver:', error);
        return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 });
    }
}
