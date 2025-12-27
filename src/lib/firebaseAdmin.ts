import * as admin from 'firebase-admin';

function formatPrivateKey(key: string | undefined) {
    if (!key) return undefined;

    // Remove surrounding quotes if present (common mistake when copying from JSON)
    // Also remove any trailing whitespace
    const rawKey = key.replace(/^['"]|['"]$/g, '').trim();

    // Handle escaped newlines (from JSON)
    if (rawKey.includes('\\n')) {
        return rawKey.replace(/\\n/g, '\n');
    }

    return rawKey;
}

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
            }),
        });
    } catch (error) {
        console.warn('Firebase Admin initialization failed (this is expected during build if env vars are missing):', error);
    }
}

let adminDb: FirebaseFirestore.Firestore;
let adminAuth: admin.auth.Auth;
let adminStorage: admin.storage.Storage;

try {
    adminDb = admin.firestore();
    adminAuth = admin.auth();
    adminStorage = admin.storage();
} catch (_e) {
    console.warn('Firebase Admin services not available');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adminDb = {} as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adminAuth = {} as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adminStorage = {} as any;
}

export { adminDb, adminAuth, adminStorage };
