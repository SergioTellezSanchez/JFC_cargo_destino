import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('trackingId');
    const storageStatus = searchParams.get('storageStatus');

    try {
        let query: FirebaseFirestore.Query = adminDb.collection('packages');

        if (storageStatus) {
            query = query.where('storageStatus', '==', storageStatus);
        }

        const snapshot = await query.get();
        let packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Client-side filter for partial matches (Firestore doesn't support 'contains' natively easily)
        if (trackingId) {
            packages = packages.filter((p: any) => p.trackingId.includes(trackingId));
        }

        return NextResponse.json(packages);
    } catch (error) {
        console.error('Firestore error:', error);
        return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { trackingId, recipientName, address, postalCode, weight, size, latitude, longitude, instructions, leaveWithSecurity } = body;

        if (!trackingId || !recipientName || !address || !postalCode) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const newPackage = {
            trackingId,
            recipientName,
            address,
            postalCode,
            latitude: latitude || null,
            longitude: longitude || null,
            weight: weight ? parseFloat(weight) : null,
            size,
            instructions: instructions || null,
            leaveWithSecurity: leaveWithSecurity || false,
            storageStatus: 'NONE',
            createdAt: new Date().toISOString(),
            status: 'PENDING'
        };

        const docRef = await adminDb.collection('packages').add(newPackage);

        return NextResponse.json({ id: docRef.id, ...newPackage });
    } catch (error: any) {
        console.error('Error creating package:', error);
        return NextResponse.json(
            { error: 'Failed to create package', details: error.message },
            { status: 500 }
        );
    }
}

