import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAuth, unauthorized } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();

    // Check if requester is Admin (Check both role and email bypass)
    const requesterDoc = await adminDb.collection('users').doc(auth.uid).get();
    const requesterRole = requesterDoc.data()?.role;
    const userEmail = auth.email?.toLowerCase();
    const isHardcodedAdmin = userEmail === 'sergiotellezsanchez@gmail.com' || userEmail === 'contacto@jfccargodestino.com' || userEmail === 'sergiotellezsanchez.us@gmail.com';

    if (requesterRole !== 'ADMIN' && requesterRole !== 'CARRIER' && !isHardcodedAdmin) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    try {
        const snapshot = await adminDb.collection('users').get();
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));
        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();

    // Check if requester is Admin Master
    const requesterDoc = await adminDb.collection('users').doc(auth.uid).get();
    const requesterRole = requesterDoc.data()?.role;
    const userEmail = auth.email?.toLowerCase();
    const isHardcodedAdmin = userEmail === 'sergiotellezsanchez@gmail.com' || userEmail === 'contacto@jfccargodestino.com' || userEmail === 'sergiotellezsanchez.us@gmail.com';

    if (requesterRole !== 'ADMIN' && !isHardcodedAdmin) {
        return NextResponse.json({ error: 'Only Admin Master can manage roles' }, { status: 403 });
    }

    try {
        const { uid, role, company } = await request.json();
        if (!uid || (!role && company === undefined)) {
            return NextResponse.json({ error: 'Missing uid or fields to update' }, { status: 400 });
        }

        const updateData: Record<string, string> = {};
        if (role) updateData.role = role;
        if (company !== undefined) updateData.company = company;

        await adminDb.collection('users').doc(uid).update(updateData);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
