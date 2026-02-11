import { Timestamp } from 'firebase/firestore';

// ============================================================================
// PAYMENTS & INVOICES
// ============================================================================

export interface Payment {
    id: string;
    orderId: string;
    clientId: string;
    amount: number;
    currency: string;
    method: 'stripe' | 'paypal' | 'transfer' | 'cash';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    stripePaymentIntentId?: string;
    paypalOrderId?: string;
    transactionId?: string;
    refundAmount?: number;
    refundReason?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Invoice {
    id: string;
    orderId: string;
    clientId: string;
    invoiceNumber: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    dueDate: Timestamp;
    paidDate?: Timestamp;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    pdfUrl?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}
