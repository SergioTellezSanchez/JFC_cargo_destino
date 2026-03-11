'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/UserContext';
import { useRouter } from 'next/navigation';
import { Order } from '@/lib/firebase/schemas/orders';
import { queryDocuments, updateDocument } from '@/lib/firebase/helpers';
import { where, orderBy } from 'firebase/firestore';
import { Loader2, Globe, ArrowRight, CheckCircle2, MapPin, Calendar, DollarSign, Package } from 'lucide-react';
import { COLLECTIONS } from '@/lib/firebase/collections';

export default function AvailableLoadsPage() {
    const { user, loading: authLoading } = useUser();
    const router = useRouter();

    const [availableOrders, setAvailableOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const fetchAvailableLoads = async () => {
            if (!user?.uid) return;
            setLoading(true);
            try {
                // Fetch orders that are NOT assigned to a specific carrier yet
                // Logic: carrierId == null OR status == 'pending_assignment' (and not assigned to me)
                // Firestore queries can be tricky with "not equal" and "null".
                // We'll fetch 'pending_assignment' orders and filter client-side for now 
                // to exclude those already assigned to *other* carriers (if any).

                // Assumption: Unassigned orders have carrierId as non-existent or null.
                // Or status is 'pending_assignment'.

                // Let's query by status 'pending_assignment'.
                const orders = await queryDocuments<Order>('orders',
                    where('status', '==', 'pending_assignment'),
                    orderBy('createdAt', 'desc')
                );

                // Filter:
                // 1. Not assigned to ANY carrier (carrierId is falsy)
                // 2. OR assigned to pending pool?
                // 3. Exclude orders correctly assigned to others.

                const filtered = orders.filter(o => !o.carrierId);
                setAvailableOrders(filtered);

            } catch (error) {
                console.error('Error fetching marketplace:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAvailableLoads();
        }

    }, [user, authLoading, router]);

    const handleRequestLoad = async (orderId: string) => {
        if (!user?.uid) return;
        setProcessingId(orderId);
        try {
            // Logic: Add user.uid to interestedCarriers array
            // And update status to 'carrier_requested' (optional, or keep pending_assignment)

            // We need to fetch the order first to get current interestedCarriers? 
            // Or use arrayUnion (helpers might not support it directly, need verify).
            // Helper updateDocument merges. 
            // Let's read local state for simplicity or re-fetch.

            const order = availableOrders.find(o => o.id === orderId);
            const currentInterested = order?.interestedCarriers || [];

            if (currentInterested.includes(user.uid)) {
                alert('Ya has solicitado esta carga.');
                return;
            }

            const updatedInterested = [...currentInterested, user.uid];

            await updateDocument(COLLECTIONS.ORDERS, orderId, {
                interestedCarriers: updatedInterested,
                // assignmentStatus: 'carrier_requested' // Could toggle this, but multiple implies competitive.
            });

            // Optimistic update
            setAvailableOrders(prev => prev.map(o =>
                o.id === orderId
                    ? { ...o, interestedCarriers: updatedInterested }
                    : o
            ));

            alert('Solicitud enviada. El administrador revisará tu interés.');

        } catch (error) {
            console.error('Error requesting load:', error);
            alert('Error al solicitar la carga.');
        } finally {
            setProcessingId(null);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Globe className="text-indigo-600" size={32} />
                    Bolsa de Carga (Marketplace)
                </h1>
                <p className="text-slate-500 font-medium mt-2">
                    Encuentra cargas disponibles y solicita la asignación para tu flota.
                </p>
            </header>

            {availableOrders.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Globe className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-600">No hay cargas disponibles</h3>
                    <p className="text-slate-400">Las nuevas oportunidades aparecerán aquí.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {availableOrders.map(order => {
                        const hasRequested = order.interestedCarriers?.includes(user?.uid || '');

                        return (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col md:flex-row">
                                {/* Left: Route Info */}
                                <div className="p-6 flex-1 flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="badge badge-ghost font-mono text-xs text-slate-500">#{order.folio || order.id.slice(0, 6)}</span>
                                        <div className="flex items-center text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                            <Calendar size={14} className="mr-1" />
                                            {order.pickupDate?.toDate().toLocaleDateString('es-MX')}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6 relative">
                                        {/* Route Line Visualization */}
                                        <div className="absolute left-[7px] top-7 bottom-7 w-0.5 bg-slate-200" />

                                        <div className="flex gap-4">
                                            <div className="mt-1 w-4 h-4 rounded-full border-[3px] border-emerald-500 bg-white z-10 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Origen</p>
                                                <p className="font-semibold text-slate-800 text-lg leading-tight">{order.origin?.address || 'Sin definir'}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="mt-1 w-4 h-4 rounded-full border-[3px] border-rose-500 bg-white z-10 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Destino</p>
                                                <p className="font-semibold text-slate-800 text-lg leading-tight">{order.destination?.address || 'Sin definir'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {order.loadType && <span className="badge badge-outline text-xs">{order.loadType}</span>}
                                        {order.cargoType && <span className="badge badge-outline text-xs">{order.cargoType}</span>}
                                        {order.packageCount && <span className="badge badge-outline text-xs">{order.packageCount} paquetes</span>}
                                    </div>
                                </div>

                                {/* Right: Action & Price */}
                                <div className="p-6 bg-slate-50 border-l border-slate-100 md:w-72 flex flex-col justify-between items-center text-center">
                                    <div className="w-full">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Oferta Estimada</p>
                                        <div className="text-3xl font-black text-slate-800 flex items-center justify-center gap-1 mb-1">
                                            {(() => {
                                                const price = order.pricing?.subtotal
                                                    ?? order.pricing?.total
                                                    ?? order.price
                                                    ?? order.quoteDetails?.priceToClient
                                                    ?? null;
                                                return price != null
                                                    ? <span className="text-3xl font-black text-slate-800">{price.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</span>
                                                    : <span className="text-3xl font-black text-slate-400">---</span>;
                                            })()}
                                        </div>
                                        <p className="text-xs text-slate-400">+ IVA</p>
                                    </div>

                                    <div className="w-full mt-6">
                                        {hasRequested ? (
                                            <button disabled className="btn btn-success w-full gap-2 cursor-default opacity-100">
                                                <CheckCircle2 size={18} />
                                                Solicitado
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-primary w-full gap-2 shadow-lg shadow-indigo-100"
                                                onClick={() => handleRequestLoad(order.id)}
                                                disabled={!!processingId}
                                            >
                                                {processingId === order.id ? <Loader2 className="animate-spin" /> : <ArrowRight size={18} />}
                                                Solicitar Viaje
                                            </button>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-2 text-center h-4">
                                            {hasRequested ? 'Esperando confirmación del administrador' : 'Sujeto a aprobación'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
