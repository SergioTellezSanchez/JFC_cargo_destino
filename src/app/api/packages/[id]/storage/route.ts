import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action } = body; // 'REQUEST' | 'APPROVE' | 'REJECT'

        if (!['REQUEST', 'APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }

        let updateData: any = {};
        if (action === 'REQUEST') {
            updateData = { storageStatus: 'REQUESTED' };
        } else if (action === 'APPROVE') {
            updateData = { storageStatus: 'STORED' };
        } else if (action === 'REJECT') {
            updateData = { storageStatus: 'NONE' };
        }

        await adminDb.collection('packages').doc(id).update(updateData);

        return NextResponse.json({ success: true, ...updateData });
    } catch (error) {
        console.error('Error updating storage status:', error);
        return NextResponse.json(
            { error: 'Failed to update storage status' },
            { status: 500 }
        );
    }
}
