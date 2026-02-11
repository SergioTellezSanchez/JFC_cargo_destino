import { Timestamp, GeoPoint } from 'firebase/firestore';

// ============================================================================
// INCIDENTS & SUPPORT
// ============================================================================

export interface Incident {
    id: string;
    orderId: string;
    driverId: string;
    type: 'security' | 'accident' | 'breakdown' | 'delay' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location: GeoPoint;
    photos: string[]; // URLs
    status: 'reported' | 'investigating' | 'resolved' | 'closed';
    reportedAt: Timestamp;
    resolvedAt?: Timestamp;
    resolution?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface SupportTicket {
    id: string;
    userId: string;
    orderId?: string;
    subject: string;
    description: string;
    category: 'technical' | 'billing' | 'delivery' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    assignedTo?: string; // adminId
    messages: TicketMessage[];
    createdAt: Timestamp;
    resolvedAt?: Timestamp;
    updatedAt: Timestamp;
}

export interface TicketMessage {
    from: string; // userId
    message: string;
    timestamp: Timestamp;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'push' | 'sms' | 'email';
    channel: 'fcm' | 'twilio' | 'sendgrid';
    title: string;
    body: string;
    data?: Record<string, any>;
    status: 'pending' | 'sent' | 'failed' | 'read';
    sentAt?: Timestamp;
    readAt?: Timestamp;
    error?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
