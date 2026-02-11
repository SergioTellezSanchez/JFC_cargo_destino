import { Timestamp } from 'firebase/firestore';

// ============================================================================
// DOCUMENTS
// ============================================================================

export interface Document {
    id: string;
    orderId: string;
    type: 'pod' | 'customs' | 'invoice' | 'contract' | 'permit' | 'other';
    name: string;
    url: string;
    mimeType: string;
    size: number; // bytes
    uploadedBy: string; // userId
    metadata?: Record<string, any>;
    ocrText?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
