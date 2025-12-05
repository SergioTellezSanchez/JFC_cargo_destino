export const mockData = {
    users: [
        { id: 'admin-1', name: 'Sergio Tellez', email: 'sergiotellezsanchez@gmail.com', role: 'ADMIN' },
        { id: 'driver-1', name: 'Juan Perez', email: 'juan@jfc.com', role: 'DRIVER', phone: '555-0001', licenseNumber: 'LIC-001' },
        { id: 'driver-2', name: 'Carlos Lopez', email: 'carlos@jfc.com', role: 'DRIVER', phone: '555-0002', licenseNumber: 'LIC-002' },
    ],
    vehicles: [
        { id: 'v1', make: 'Nissan', model: 'NP300', year: 2023, licensePlate: 'JFC-001', capacity: 1500, type: 'PICKUP', status: 'AVAILABLE' },
        { id: 'v2', make: 'Ford', model: 'Transit', year: 2022, licensePlate: 'JFC-002', capacity: 3500, type: 'VAN', status: 'IN_USE' },
        { id: 'v3', make: 'Kenworth', model: 'T680', year: 2021, licensePlate: 'JFC-003', capacity: 20000, type: 'TRAILER', status: 'MAINTENANCE' },
    ],
    warehouses: [
        { id: 'w1', name: 'CEDIS Atlacomulco', location: 'Atlacomulco, Edo Mex', capacity: 5000 },
        { id: 'w2', name: 'Bodega Norte', location: 'Monterrey, NL', capacity: 3000 },
    ],
    packages: [
        {
            id: 'pkg-1',
            trackingId: 'TRK-2026-001',
            recipientName: 'Empresa A',
            address: 'Av. Industrial 123',
            status: 'PENDING',
            weight: 150.5,
            dimensions: '100x100x100',
            storageStatus: 'NONE',
            createdAt: new Date('2026-01-15'),
        },
        {
            id: 'pkg-2',
            trackingId: 'TRK-2026-002',
            recipientName: 'Cliente B',
            address: 'Calle Reforma 456',
            status: 'IN_TRANSIT',
            weight: 25.0,
            dimensions: '30x30x30',
            storageStatus: 'REQUESTED',
            createdAt: new Date('2026-01-16'),
        },
        {
            id: 'pkg-3',
            trackingId: 'TRK-2026-003',
            recipientName: 'Distribuidora C',
            address: 'Blvd. Aeropuerto 789',
            status: 'DELIVERED',
            weight: 500.0,
            dimensions: 'Pallet Standard',
            storageStatus: 'STORED',
            createdAt: new Date('2026-01-10'),
        }
    ]
};
