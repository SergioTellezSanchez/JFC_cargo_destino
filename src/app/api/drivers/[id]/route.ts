try {
    const { id } = await params;
    // First, unassign deliveries from this driver to avoid foreign key constraint errors
    await prisma.delivery.updateMany({
        where: { driverId: id },
        data: { driverId: null, status: 'PENDING' }, // Reset status to PENDING if driver is deleted
    });

    await prisma.user.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });
} catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 });
}
}
