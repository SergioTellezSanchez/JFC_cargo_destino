import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { verifyAuth, unauthorized } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();
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
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();
    try {
        let payload: any = {};
        let photoFile: File | null = null;

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            formData.forEach((value, key) => {
                if (key === 'photo' && value instanceof File) {
                    photoFile = value;
                } else {
                    payload[key] = value;
                }
            });
        } else {
            payload = await request.json();
        }

        const { name, email, phone, licenseNumber } = payload;

        const newDriver: any = {
            name,
            email,
            phone,
            licenseNumber: licenseNumber || payload.license,
            role: 'DRIVER',
            createdAt: new Date().toISOString(),
            createdBy: payload.createdBy || null
        };

        console.log('Attempting to create driver with payload:', JSON.stringify(newDriver, null, 2));
        const docRef = await adminDb.collection('users').add(newDriver);
        console.log('Driver created with ID:', docRef.id);
        const id = docRef.id;

        if (photoFile) {
            console.log('Processing photo upload for driver:', id);
            const buffer = Buffer.from(await (photoFile as File).arrayBuffer());
            const fileRef = adminStorage.bucket().file(`drivers/${id}_${Date.now()}.jpg`);
            await fileRef.save(buffer, { contentType: 'image/jpeg' });
            const [url] = await fileRef.getSignedUrl({ action: 'read', expires: '03-01-2500' });
            await docRef.update({ photoUrl: url });
            newDriver.photoUrl = url;
            console.log('Photo uploaded and URL updated:', url);
        }

        return NextResponse.json({ id, ...newDriver });
    } catch (error) {
        console.error('Error creating driver:', error);
        return NextResponse.json(
            { error: 'Failed to create driver' },
            { status: 500 }
        );
    }
}
