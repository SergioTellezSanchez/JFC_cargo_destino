import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

import { verifyAuth, unauthorized } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();
    try {
        const snapshot = await adminDb.collection('vehicles').get();
        const vehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(vehicles);
    } catch (error) {
        console.error('Firestore error:', error);
        return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();
    try {
        const body = await request.json();
        const docRef = await adminDb.collection('vehicles').add({
            ...body,
            createdAt: new Date().toISOString()
        });
        return NextResponse.json({ id: docRef.id, ...body });
    } catch (error) {
        console.error('Failed to create vehicle:', error);
        return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
    }
}
