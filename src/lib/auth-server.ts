import { adminAuth } from './firebaseAdmin';
import { NextResponse } from 'next/server';

export async function verifyAuth(request: Request) {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return null;
    }
}

export function unauthorized() {
    return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to perform this action.' },
        { status: 401 }
    );
}
