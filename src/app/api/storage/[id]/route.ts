import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await adminDb.collection('warehouses').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting warehouse:', error);
        return NextResponse.json({ error: 'Failed to delete warehouse' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        await adminDb.collection('warehouses').doc(id).update(body);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating warehouse:', error);
        return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
    }
}
