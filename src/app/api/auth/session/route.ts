import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];

        // 1. Verify the ID token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Refresh Role from Firestore (Single Source of Truth)
        // We do this to ensure the session cookie has the latest role
        const userDoc = await adminDb.collection('users').doc(uid).get();
        let role = 'user'; // Default role

        if (userDoc.exists) {
            role = userDoc.data()?.role || 'user';
        } else {
            // Fallback for bootstrap admins if needed (optional)
            const adminEmails = ['sergiotellezsanchez@gmail.com', 'contacto@jfccargodestino.com'];
            if (decodedToken.email && adminEmails.includes(decodedToken.email)) {
                role = 'super_admin';
                // Optionally create the doc here if desired, but UserContext usually handles it.
            }
        }

        // 3. Ensure Custom Claims match Firestore Role
        // This optimization allows Middleware to verify role without DB calls
        if (decodedToken.role !== role) {
            await adminAuth.setCustomUserClaims(uid, { role });
        }

        // 4. Create Session Cookie
        // Expires in 5 days
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        // 5. Set Cookie
        const cookieStore = await cookies();
        cookieStore.set('__session', sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });

        return NextResponse.json({ success: true, role });
    } catch (error) {
        console.error('Session creation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
