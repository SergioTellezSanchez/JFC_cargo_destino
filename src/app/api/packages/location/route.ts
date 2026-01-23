import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        const { packageId, latitude, longitude } = await request.json();

        if (!packageId || !latitude || !longitude) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await adminDb.collection('packages').doc(packageId).update({
            latitude,
            longitude,
            lastLocationUpdate: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating location:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
