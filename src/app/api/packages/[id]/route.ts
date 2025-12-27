import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAuth, unauthorized } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();

    try {
        const { id } = await params;
        const body = await request.json();
        const { id: _, ...updateData } = body;

        await adminDb.collection('packages').doc(id).update({
            ...updateData,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating package:', error);
        return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();

    try {
        const { id } = await params;
        await adminDb.collection('packages').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting package:', error);
        return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
    }
}
