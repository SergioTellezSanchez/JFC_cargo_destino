import { adminAuth } from './firebaseAdmin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function verifyAuth(request: Request) {
    const authHeader = request.headers.get('Authorization');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split('Bearer ')[1];
        try {
            return await adminAuth.verifyIdToken(token);
        } catch (error) {
            console.warn('Bearer token invalid, checking cookie...');
        }
    }

    if (sessionCookie) {
        try {
            return await adminAuth.verifySessionCookie(sessionCookie, true);
        } catch (error) {
            console.error('Session cookie invalid', error);
        }
    }

    return null;
}

export function unauthorized() {
    return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to perform this action.' },
        { status: 401 }
    );
}
