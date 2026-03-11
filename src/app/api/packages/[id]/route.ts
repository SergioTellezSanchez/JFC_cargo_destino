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

        // 1. Update Order
        await adminDb.collection('orders').doc(id).update({
            ...updateData,
            updatedAt: new Date().toISOString()
        });

        // 2. CHECK FOR DELIVERY & UPDATE VEHICLE (Backhaul Logic)
        if (updateData.status === 'DELIVERED') {
            // Fetch the order to get assigned resources
            const orderDoc = await adminDb.collection('orders').doc(id).get();
            const orderData = orderDoc.data();

            if (orderData && orderData.vehicleId) {
                // Update Vehicle Location & Status
                await adminDb.collection('vehicles').doc(orderData.vehicleId).update({
                    currentLocation: {
                        address: orderData.destination?.address || '',
                        lat: orderData.destination?.latitude || orderData.destination?.lat || 0,
                        lng: orderData.destination?.longitude || orderData.destination?.lng || 0,
                        updatedAt: new Date().toISOString() // Store as ISO string for consistency with adminSDK
                    },
                    serviceStatus: 'awaiting_backhaul',
                    updatedAt: new Date().toISOString()
                });
                console.log(`Vehicle ${orderData.vehicleId} updated to awaiting_backhaul at ${orderData.destination?.address}`);
            }
        }

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
        await adminDb.collection('orders').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting package:', error);
        return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
    }
}
