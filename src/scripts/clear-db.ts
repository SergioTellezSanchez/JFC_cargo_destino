import admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Helper to format private key
function formatPrivateKey(key: string | undefined) {
    if (!key) return undefined;
    const match = key.match(/-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/);
    if (match) {
        let cleanKey = match[0];
        if (cleanKey.includes('\\n')) {
            cleanKey = cleanKey.replace(/\\n/g, '\n');
        }
        return cleanKey;
    }
    const rawKey = key.replace(/^['"]|['"]$/g, '').trim();
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
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
        });
        console.log('Firebase Admin initialized successfully.');
    } catch (error) {
        console.error('Firebase Admin initialization failed:', error);
        process.exit(1);
    }
}

const db = admin.firestore();
const storage = admin.storage();

async function deleteCollection(collectionPath: string, batchSize: number = 100) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db: admin.firestore.Firestore, query: admin.firestore.Query, resolve: any) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

async function clearStorage() {
    console.log('Cleaning Storage...');
    try {
        const [files] = await storage.bucket().getFiles();
        if (files.length === 0) {
            console.log('No files found in storage.');
            return;
        }

        console.log(`Deleting ${files.length} files from storage...`);
        await Promise.all(files.map(file => file.delete()));
        console.log('Storage cleaned.');
    } catch (error) {
        console.error('Error cleaning storage:', error);
    }
}

async function main() {
    console.log('WARNING: This will delete ALL data in Firestore and Storage.');

    try {
        // 1. Clear Collections
        const collections = await db.listCollections();
        console.log(`Found ${collections.length} collections.`);

        for (const collection of collections) {
            console.log(`Cleaning collection: ${collection.id}`);
            await deleteCollection(collection.id);
            console.log(`Finished cleaning: ${collection.id}`);
        }

        // 2. Clear Storage
        await clearStorage();

        console.log('\nDatabase and Storage cleared completely.');
        console.log('You can now run the seeding script if needed.');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

main();
