import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple state machine mapping
const STATE_TRANSITIONS: Record<string, Record<string, string>> = {
    PENDING: { ASSIGN: 'ASSIGNED' },
    ASSIGNED: { PICK_UP: 'PICKED_UP', UNASSIGN: 'PENDING' },
    PICKED_UP: { START_DELIVERY: 'IN_TRANSIT' },
    IN_TRANSIT: { CONFIRM_DELIVERY: 'DELIVERED', REPORT_ISSUE: 'FAILED' },
    FAILED: { RETRY: 'ASSIGNED' },
};

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get('content-type') || '';

        let deliveryId: string;
        let action: string;
        let evidenceUrl: string | undefined;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            deliveryId = formData.get('deliveryId') as string;
            action = formData.get('action') as string;

            const file = formData.get('evidence') as File;
            if (file) {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                // Ensure uploads directory exists
                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                await mkdir(uploadDir, { recursive: true });

                // Create unique filename
                const filename = `evidence-${deliveryId}-${Date.now()}${path.extname(file.name || '.jpg')}`;
                const filepath = path.join(uploadDir, filename);

                await writeFile(filepath, buffer);
                evidenceUrl = `/uploads/${filename}`;
            }
        } else {
            const body = await request.json();
            deliveryId = body.deliveryId;
            action = body.action;
        }

        console.log('Update delivery request:', { deliveryId, action, hasEvidence: !!evidenceUrl });

        // Fetch current delivery
        const delivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
        });

        if (!delivery) {
            console.error('Delivery not found:', deliveryId);
            return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
        }

        console.log('Current delivery status:', delivery.status);

        // Get next status based on current status and action
        const nextStatus = STATE_TRANSITIONS[delivery.status]?.[action];

        if (!nextStatus) {
            console.error('Invalid transition:', { from: delivery.status, action });
            return NextResponse.json(
                { error: `Invalid transition from ${delivery.status} with action ${action}` },
                { status: 400 }
            );
        }

        console.log('Transitioning to:', nextStatus);

        // Update DB
        const updatedDelivery = await prisma.delivery.update({
            where: { id: deliveryId },
            data: {
                status: nextStatus,
                evidenceUrl: evidenceUrl || undefined, // Only update if we have a new URL
                history: {
                    create: {
                        status: nextStatus,
                    },
                },
            },
            include: {
                package: true,
                driver: true,
            },
        });

        console.log('Delivery updated successfully:', updatedDelivery.id);

        return NextResponse.json(updatedDelivery);
    } catch (error) {
        console.error('Error updating delivery:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
