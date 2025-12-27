import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAuth, unauthorized } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();
    try {
        const doc = await adminDb.collection('settings').doc('global').get();
        if (!doc.exists) {
            // Return defaults if not set
            return NextResponse.json({
                insuranceRate: 1.5,
                profitMargin: 1.4,
                suspensionTypes: ['Neumática', 'Muelles', 'Hidráulica'],
                usefulLifeKm: 500000,
                basePrice: 1000
            });
        }
        return NextResponse.json(doc.data());
    } catch (error) {
        console.error('Firestore error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();
    try {
        const body = await request.json();
        await adminDb.collection('settings').doc('global').set({
            ...body,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
