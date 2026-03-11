import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * One-time role migration: maps old role strings to new canonical names.
 * Safe to call multiple times (idempotent). Uses Admin SDK (no auth required).
 * Protected by a simple secret key via query param: ?key=jfc-migrate-2026
 */
export async function POST(request: Request) {
    // Simple static key guard — this endpoint is debug-only
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== 'jfc-migrate-2026') {
        return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
    }

    // Map from old role string → new role string
    const roleMap: Record<string, string> = {
        'ADMIN_MASTER': 'ADMIN',
        'ADMIN_JR': 'CARRIER',
        'USER': 'CLIENT',
        'user': 'CLIENT',
        'customer': 'CLIENT',
        'super_admin': 'ADMIN',
        'warehouse_manager': 'ADMIN',
        'carrier_admin': 'CARRIER',
        'customs_agent': 'CLIENT',
        'driver': 'DRIVER',
    };

    try {
        const snapshot = await adminDb.collection('users').get();
        const batch = adminDb.batch();
        let migrated = 0;
        let skipped = 0;
        const changes: { email: string; oldRole: string; newRole: string }[] = [];

        snapshot.docs.forEach(doc => {
            const currentRole: string = doc.data().role || '';
            const newRole = roleMap[currentRole];

            if (newRole && newRole !== currentRole) {
                batch.update(doc.ref, { role: newRole });
                migrated++;
                changes.push({ email: doc.data().email || doc.id, oldRole: currentRole, newRole });
            } else {
                skipped++;
            }
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            migrated,
            skipped,
            changes,
            message: `Migration complete: ${migrated} users updated, ${skipped} already up-to-date.`
        });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: 'Migration failed', details: error.message }, { status: 500 });
    }
}
