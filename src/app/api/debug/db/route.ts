import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAuth, unauthorized } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();

    try {
        const collections = ['vehicles', 'users', 'storage_locations', 'storage', 'drivers', 'packages'];
        const results: any = {};

        for (const col of collections) {
            const snap = await adminDb.collection(col).get();
            results[col] = snap.size;
        }

        return NextResponse.json({
            collections: results,
            message: "This endpoint shows the count of documents in each collection to help debug data visibility issues."
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
