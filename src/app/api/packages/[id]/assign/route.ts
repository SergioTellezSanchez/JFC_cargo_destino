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
        const { driverId, vehicleId } = body;

        if (!driverId || !vehicleId) {
            return NextResponse.json(
                { error: 'Driver and Vehicle are required' },
                { status: 400 }
            );
        }

        // Get driver and vehicle details to store snapshot if needed, 
        // or just store IDs. Storing names helps reduce reads.
        const driverDoc = await adminDb.collection('users').doc(driverId).get();
        const vehicleDoc = await adminDb.collection('vehicles').doc(vehicleId).get();

        if (!driverDoc.exists || !vehicleDoc.exists) {
            return NextResponse.json(
                { error: 'Driver or Vehicle not found' },
                { status: 404 }
            );
        }

        const driverData = driverDoc.data();
        const vehicleData = vehicleDoc.data();

        // Update package with assignment
        await adminDb.collection('packages').doc(id).update({
            assignedDriverId: driverId,
            assignedVehicleId: vehicleId,
            driverName: driverData?.name,
            vehiclePlate: vehicleData?.plate,
            status: 'IN_TRANSIT', // Or 'ASSIGNED'
            assignedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error assigning resources:', error);
        return NextResponse.json(
            { error: 'Failed to assign resources' },
            { status: 500 }
        );
    }
}
