import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.warn('Firebase Admin initialization failed (this is expected during build if env vars are missing):', error);
    }
}

let adminDb: FirebaseFirestore.Firestore;
let adminAuth: admin.auth.Auth;

try {
    adminDb = admin.firestore();
    adminAuth = admin.auth();
} catch (e) {
    console.warn('Firebase Admin services not available');
    adminDb = {} as any;
    adminAuth = {} as any;
}

export { adminDb, adminAuth };
