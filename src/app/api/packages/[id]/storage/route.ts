import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action } = body;

        let newStatus = 'NONE';
        if (action === 'REQUEST') newStatus = 'REQUESTED';
        else if (action === 'APPROVE') newStatus = 'APPROVED';
        else if (action === 'REJECT') newStatus = 'REJECTED';
        else if (action === 'STORE') newStatus = 'STORED';
        else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const updatedPackage = await prisma.package.update({
            where: { id },
            data: { storageStatus: newStatus },
            include: { deliveries: true }
        });

        return NextResponse.json(updatedPackage);
    } catch (error) {
        console.error('Error updating storage status:', error);
        return NextResponse.json(
            { error: 'Error updating storage status' },
            { status: 500 }
        );
    }
}
