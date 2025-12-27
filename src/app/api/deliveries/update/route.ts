import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { verifyAuth, unauthorized } from '@/lib/auth-server';
import { deliveryMachine } from '@/lib/deliveryMachine';
import { createActor } from 'xstate';

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorized();

    try {
        let deliveryId, action, evidence;

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            deliveryId = formData.get('deliveryId') as string;
            action = formData.get('action') as string;
            evidence = formData.get('evidence') as File;
        } else {
            const body = await request.json();
            deliveryId = body.deliveryId;
            action = body.action;
        }

        if (!deliveryId || !action) {
            return NextResponse.json({ error: 'Missing deliveryId or action' }, { status: 400 });
        }

        // Find the package containing this delivery
        const packagesRef = adminDb.collection('packages');
        const snapshot = await packagesRef.where('deliveries', 'array-contains-any', [{ id: deliveryId }]).get();

        // Note: structured array-contains might fail if object is deep. 
        // Better: Query all and find in memory or use a flatter structure.
        // For now, let's assume we have a flatter way or just find it.
        const allPackages = await packagesRef.get();
        let targetPkg: any = null;
        let pkgDocId = '';

        allPackages.forEach(doc => {
            const data = doc.data();
            if (data.deliveries?.some((d: any) => d.id === deliveryId)) {
                targetPkg = data;
                pkgDocId = doc.id;
            }
        });

        if (!targetPkg) return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });

        const deliveryIndex = targetPkg.deliveries.findIndex((d: any) => d.id === deliveryId);
        const currentStatus = targetPkg.deliveries[deliveryIndex].status;

        // XState transition
        const actor = createActor(deliveryMachine, { snapshot: { status: 'active', value: currentStatus.toLowerCase() } as any });
        actor.start();
        actor.send({ type: action });
        const nextState = actor.getSnapshot().value as string;

        if (nextState === currentStatus.toLowerCase()) {
            return NextResponse.json({ error: `Invalid transition ${action} from ${currentStatus}` }, { status: 400 });
        }

        const updatedDeliveries = [...targetPkg.deliveries];
        updatedDeliveries[deliveryIndex] = {
            ...updatedDeliveries[deliveryIndex],
            status: nextState.toUpperCase(),
            updatedAt: new Date().toISOString()
        };

        if (evidence) {
            const buffer = Buffer.from(await evidence.arrayBuffer());
            const fileRef = adminStorage.bucket().file(`evidence/${deliveryId}_${Date.now()}.jpg`);
            await fileRef.save(buffer, { contentType: 'image/jpeg' });
            const [url] = await fileRef.getSignedUrl({ action: 'read', expires: '03-01-2500' });
            updatedDeliveries[deliveryIndex].evidenceUrl = url;
        }

        await packagesRef.doc(pkgDocId).update({ deliveries: updatedDeliveries });

        return NextResponse.json({ success: true, nextState });
    } catch (error: any) {
        console.error('Update delivery error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
