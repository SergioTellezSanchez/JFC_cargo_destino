'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StoragePage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/admin?tab=warehouses');
    }, [router]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <p>Redirigiendo al Panel de Administración...</p>
        </div>
    );
}
