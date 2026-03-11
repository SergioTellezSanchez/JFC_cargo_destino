'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/UserContext';
import { useRouter } from 'next/navigation';
import { Order } from '@/lib/firebase/schemas/orders';
import { Vehicle } from '@/lib/firebase/schemas/vehicles';
import { Driver } from '@/lib/firebase/schemas/users';
import { PricingSettings } from '@/lib/firebase/schemas/pricing';
import OrderTable from '@/components/carrier/OrderTable';
import { queryDocuments, getAllDocuments } from '@/lib/firebase/helpers';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { where, orderBy, limit } from 'firebase/firestore';
import { Loader2, Package } from 'lucide-react';

export default function CarrierOrdersPage() {
    const { user, loading: authLoading } = useUser();
    const router = useRouter();

    const [orders, setOrders] = useState<Order[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [settings, setSettings] = useState<PricingSettings>({} as PricingSettings);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user?.uid) return;
        try {
            setLoading(true);
            const assignedOrders = await queryDocuments<Order>('orders',
                where('carrierId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            setOrders(assignedOrders.filter(o => o.carrierId === user.uid));

            const [fetchedVehicles, fetchedDrivers] = await Promise.all([
                queryDocuments<Vehicle>('vehicles', where('carrierId', '==', user.uid)),
                queryDocuments<Driver>('drivers', where('carrierId', '==', user.uid), where('status', '!=', 'offline'))
            ]);
            setVehicles(fetchedVehicles);
            setDrivers(fetchedDrivers);

            const settingsDocs = await getAllDocuments<PricingSettings>(COLLECTIONS.PRICING_SETTINGS);
            setSettings(settingsDocs.length > 0 ? settingsDocs[0] : { backhaulMatchRadiusKm: 50 } as PricingSettings);
        } catch (error) {
            console.error('Error fetching carrier data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) fetchData();
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Package className="text-indigo-600" size={32} />
                        Gestión de Órdenes
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Asigna vehículos, conductores y optimiza tus rutas de regreso.
                    </p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold border border-indigo-100">
                    {orders.length} Órdenes Activas
                </div>
            </header>

            {orders.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Package className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-600">No hay órdenes asignadas</h3>
                    <p className="text-slate-400">Las nuevas solicitudes aparecerán aquí.</p>
                </div>
            ) : (
                <OrderTable
                    orders={orders}
                    drivers={drivers}
                    vehicles={vehicles}
                    settings={settings}
                    carrierId={user?.uid || ''}
                    onRefresh={fetchData}
                />
            )}
        </div>
    );
}
