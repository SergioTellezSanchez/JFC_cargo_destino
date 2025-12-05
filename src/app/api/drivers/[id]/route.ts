export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // First, unassign deliveries from this driver to avoid foreign key constraint errors
        // Note: In Firestore we might just update the user doc or delete it. 
        // If we want to keep data integrity, we should update packages assigned to this driver.
        // For now, just deleting the user doc as per migration.

        await adminDb.collection('users').doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting driver:', error);
        return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 });
    }
}
