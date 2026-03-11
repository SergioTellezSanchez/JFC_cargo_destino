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
        const { driverId, vehicleId, carrierId, logisticsCompany, status } = body;

        const updateData: any = {
            updatedAt: new Date().toISOString()
        };

        // 1. Handle Carrier Assignment (Control Tower)
        if (carrierId) updateData.carrierId = carrierId;
        if (logisticsCompany) updateData.logisticsCompany = logisticsCompany;

        // 2. Handle Resource Assignment (Carrier or Legacy)
        if (driverId) {
            const driverDoc = await adminDb.collection('users').doc(driverId).get(); // Drivers are Users now? Or 'drivers' collection?
            // checking schemes: Driver is in 'top level' drivers collection in some places, but users in others?
            // The previous code used 'users'. Let's stick to what works for the project structure or use specific collection if known.
            // In Helpers we see 'drivers'. In previous code 'users'. 
            // Let's try 'drivers' first as it's the specific collection.
            const driverRef = adminDb.collection('drivers').doc(driverId);
            const driverSnap = await driverRef.get();
            if (driverSnap.exists) {
                updateData.assignedDriverId = driverId;
                updateData.driverName = driverSnap.data()?.name;
            } else {
                // Fallback to users if not in drivers
                const userRef = adminDb.collection('users').doc(driverId);
                const userSnap = await userRef.get();
                if (userSnap.exists) {
                    updateData.assignedDriverId = driverId;
                    updateData.driverName = userSnap.data()?.name;
                }
            }
        }

        if (vehicleId) {
            const vehicleRef = adminDb.collection('vehicles').doc(vehicleId);
            const vehicleSnap = await vehicleRef.get();
            if (vehicleSnap.exists) {
                updateData.assignedVehicleId = vehicleId;
                updateData.vehiclePlate = vehicleSnap.data()?.plates; // Schema says 'plates'
            }
        }

        // 3. Update Status
        if (status) updateData.status = status;
        else if (carrierId && !driverId) updateData.status = 'ASSIGNED'; // Assigned to Carrier, waiting for driver
        else if (driverId && vehicleId) updateData.status = 'ASSIGNED_CONFIRMED'; // Ready to go

        // Update Order
        await adminDb.collection('orders').doc(id).update(updateData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error assigning resources:', error);
        return NextResponse.json(
            { error: 'Failed to assign resources' },
            { status: 500 }
        );
    }
}
