import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { verifyAuth, unauthorized } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();

    try {
        const { id } = await params;

        let updateData: any = {};
        let photoFile: File | null = null;

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            formData.forEach((value, key) => {
                if (key === 'photo' && value instanceof File) {
                    photoFile = value;
                } else if (key !== 'id') {
                    updateData[key] = value;
                }
            });
        } else {
            const body = await request.json();
            const { id: _, ...rest } = body;
            updateData = rest;
        }

        if (photoFile) {
            const buffer = Buffer.from(await (photoFile as File).arrayBuffer());
            const fileRef = adminStorage.bucket().file(`drivers/${id}_${Date.now()}.jpg`);
            await fileRef.save(buffer, { contentType: 'image/jpeg' });
            const [url] = await fileRef.getSignedUrl({ action: 'read', expires: '03-01-2500' });
            updateData.photoUrl = url;
        }

        await adminDb.collection('users').doc(id).update({
            ...updateData,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, photoUrl: updateData.photoUrl });
    } catch (error) {
        console.error('Error updating driver:', error);
        return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();

    try {
        const { id } = await params;
        await adminDb.collection('users').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting driver:', error);
        return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 });
    }
}
