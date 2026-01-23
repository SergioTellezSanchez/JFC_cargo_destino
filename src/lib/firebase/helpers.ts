import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    QueryConstraint,
    DocumentData,
    WithFieldValue,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, CollectionName } from './collections';
import type { FirestoreData, CreateData, UpdateData } from './schema';

// ============================================================================
// GENERIC CRUD OPERATIONS
// ============================================================================

/**
 * Create a new document in a collection
 */
export async function createDocument<T extends DocumentData>(
    collectionName: CollectionName,
    data: CreateData<T>
): Promise<string> {
    const now = Timestamp.now();
    const docData: WithFieldValue<DocumentData> = {
        ...data,
        createdAt: now,
        updatedAt: now,
    };

    const docRef = await addDoc(collection(db, collectionName), docData);
    return docRef.id;
}

/**
 * Create a document with a specific ID
 */
export async function setDocument<T extends DocumentData>(
    collectionName: CollectionName,
    id: string,
    data: CreateData<T>
): Promise<void> {
    const now = Timestamp.now();
    const docData: WithFieldValue<DocumentData> = {
        ...data,
        createdAt: now,
        updatedAt: now,
    };

    await setDoc(doc(db, collectionName, id), docData);
}

/**
 * Get a document by ID
 */
export async function getDocument<T extends DocumentData>(
    collectionName: CollectionName,
    id: string
): Promise<(T & { id: string }) | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return {
        id: docSnap.id,
        ...docSnap.data(),
    } as T & { id: string };
}

/**
 * Update a document
 */
export async function updateDocument<T extends DocumentData>(
    collectionName: CollectionName,
    id: string,
    data: UpdateData<T>
): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Delete a document
 */
export async function deleteDocument(
    collectionName: CollectionName,
    id: string
): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
}

/**
 * Query documents with constraints
 */
export async function queryDocuments<T extends DocumentData>(
    collectionName: CollectionName,
    ...constraints: QueryConstraint[]
): Promise<(T & { id: string })[]> {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as (T & { id: string })[];
}

/**
 * Get all documents in a collection
 */
export async function getAllDocuments<T extends DocumentData>(
    collectionName: CollectionName
): Promise<(T & { id: string })[]> {
    const querySnapshot = await getDocs(collection(db, collectionName));

    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as (T & { id: string })[];
}

// ============================================================================
// SPECIALIZED QUERIES
// ============================================================================

/**
 * Get documents by field value
 */
export async function getDocumentsByField<T extends DocumentData>(
    collectionName: CollectionName,
    field: string,
    value: any
): Promise<(T & { id: string })[]> {
    return queryDocuments<T>(collectionName, where(field, '==', value));
}

/**
 * Get documents with pagination
 */
export async function getDocumentsPaginated<T extends DocumentData>(
    collectionName: CollectionName,
    pageSize: number,
    orderByField: string = 'createdAt',
    orderDirection: 'asc' | 'desc' = 'desc'
): Promise<(T & { id: string })[]> {
    return queryDocuments<T>(
        collectionName,
        orderBy(orderByField, orderDirection),
        limit(pageSize)
    );
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Check if a document exists
 */
export async function documentExists(
    collectionName: CollectionName,
    id: string
): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
}

/**
 * Count documents in a collection (expensive operation, use sparingly)
 */
export async function countDocuments(
    collectionName: CollectionName
): Promise<number> {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.size;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { COLLECTIONS };
export * from './schema';
