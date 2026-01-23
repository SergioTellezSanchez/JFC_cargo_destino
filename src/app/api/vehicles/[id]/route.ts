import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Remove id from body to avoid saving it as a field
        const { id: _, ...updateData } = body;

        // --- Bidirectional Assignment Sync ---
        // If currentDriverId is changing, update the related drivers
        if (updateData.currentDriverId !== undefined) {
            const vehicleDoc = await adminDb.collection('vehicles').doc(id).get();
            const currentVehicleData = vehicleDoc.data();
            const oldDriverId = currentVehicleData?.currentDriverId;
            const newDriverId = updateData.currentDriverId;

            if (oldDriverId !== newDriverId) {
                console.log(`Syncing driver assignment for vehicle ${id}: ${oldDriverId} -> ${newDriverId}`);

                // 1. Remove vehicle from old driver
                if (oldDriverId) {
                    await adminDb.collection('users').doc(oldDriverId).update({
                        vehicleId: null
                    });
                }

                // 2. Add vehicle to new driver
                if (newDriverId) {
                    await adminDb.collection('users').doc(newDriverId).update({
                        vehicleId: id
                    });
                }
            }
        }
        // -------------------------------------

        await adminDb.collection('vehicles').doc(id).update({
            ...updateData,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating vehicle:', error);
        return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await adminDb.collection('vehicles').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
    }
}
