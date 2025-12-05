import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
    try {
        const snapshot = await adminDb.collection('users').where('role', '==', 'DRIVER').get();
        const drivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(drivers);
    } catch (error) {
        console.error('Firestore error:', error);
        return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, licenseNumber } = body;

        const newDriver = {
            name,
            email,
            phone,
            licenseNumber,
            role: 'DRIVER',
            createdAt: new Date().toISOString()
        };

        const docRef = await adminDb.collection('users').add(newDriver);

        return NextResponse.json({ id: docRef.id, ...newDriver });
    } catch (error) {
        console.error('Error creating driver:', error);
        return NextResponse.json(
            { error: 'Failed to create driver' },
            { status: 500 }
        );
    }
}
