import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

import { verifyAuth, unauthorized } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();
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
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();
    try {
        const body = await request.json();
        const { recipientName, weight, size, latitude, longitude, instructions, leaveWithSecurity } = body;

        const trackingId = body.trackingId || `PKG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const address = body.address || body.destination || '';
        const postalCode = body.postalCode || '00000'; // Default if missing

        if (!recipientName || !address) {
            return NextResponse.json(
                { error: 'Missing recipient name or destination address' },
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
            size: size || 'MEDIUM',
            instructions: instructions || null,
            leaveWithSecurity: leaveWithSecurity || false,
            storageStatus: 'NONE',
            createdAt: new Date().toISOString(),
            status: 'PENDING',
            createdBy: body.userId || body.createdBy || null,
            // Enhanced fields from Quote flow
            origin: body.origin || null,
            destination: body.destination || address,
            senderName: body.senderName || null,
            senderPhone: body.senderPhone || null,
            receiverPhone: body.recipientPhone || body.receiverPhone || null,
            type: body.packageType || body.type || 'BOX',
            price: body.price || body.cost || 0,
            loadType: body.loadType || null,
            loadTypeDetails: body.loadTypeDetails || null,
            serviceLevel: body.serviceLevel || 'standard',
            dimensions: body.dimensions || null,
            declaredValue: body.declaredValue || 0,
            distanceKm: body.distanceKm || 0
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

