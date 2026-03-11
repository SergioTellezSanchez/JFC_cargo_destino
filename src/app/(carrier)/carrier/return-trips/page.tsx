'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/UserContext';
import { useRouter } from 'next/navigation';
import { ReturnTrip, Order } from '@/lib/firebase/schemas/orders';
import { queryDocuments, updateDocument, createDocument } from '@/lib/firebase/helpers';
import { where, orderBy, Timestamp } from 'firebase/firestore';
import { Loader2, Repeat, Plus, Calendar, MapPin, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { COLLECTIONS } from '@/lib/firebase/collections';
import Modal from '@/components/Modal';
import PlaceAutocomplete from '@/components/PlaceAutocomplete';

export default function ReturnTripsPage() {
    const { user, loading: authLoading } = useUser();
    const router = useRouter();

    const [returnTrips, setReturnTrips] = useState<ReturnTrip[]>([]);
    const [customerRequests, setCustomerRequests] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Publish Modal State
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [newOrigin, setNewOrigin] = useState<any>(null);
    const [newDestination, setNewDestination] = useState<any>(null);
    const [newDate, setNewDate] = useState<string>('');
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        fetchData();
    }, [user, authLoading, router]);

    const fetchData = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            // Fetch my published return trips
            const trips = await queryDocuments<ReturnTrip>(COLLECTIONS.RETURN_TRIPS,
                where('carrierId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            setReturnTrips(trips);

            // Fetch matched customer orders 
            // Query logic: we need orders where matchedReturnTripId is in my returnTrips 
            // OR we fetch all orders pending_assignment and filter locally if we don't have an array.
            // Let's get my trips IDs:
            const tripIds = trips.map(t => t.id);
            if (tripIds.length > 0) {
                // Because firestore block in queries, we might need to query in chunks or just fetch matching
                // We'll query orders where matchedReturnTripId in tripIds. max 10.
                const chunkIds = tripIds.slice(0, 10);
                const requests = await queryDocuments<Order>(COLLECTIONS.ORDERS,
                    where('matchedReturnTripId', 'in', chunkIds),
                    where('status', '==', 'pending_assignment')
                );
                setCustomerRequests(requests);
            } else {
                setCustomerRequests([]);
            }
        } catch (error) {
            console.error('Error fetching return trips:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!user?.uid || !newOrigin || !newDestination || !newDate) return;
        setPublishing(true);
        try {
            const availableFrom = Timestamp.fromDate(new Date(newDate + 'T00:00:00'));
            // Default 48 hrs availability window
            const availableUntil = Timestamp.fromDate(new Date(new Date(newDate + 'T00:00:00').getTime() + (48 * 60 * 60 * 1000)));

            const newTrip: Partial<ReturnTrip> = {
                carrierId: user.uid,
                origin: {
                    address: newOrigin.address,
                    coords: { lat: newOrigin.lat, lng: newOrigin.lng }
                },
                destination: {
                    address: newDestination.address,
                    coords: { lat: newDestination.lat, lng: newDestination.lng }
                },
                availableFrom,
                availableUntil,
                status: 'active',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            await createDocument(COLLECTIONS.RETURN_TRIPS, newTrip);
            setShowPublishModal(false);
            setNewOrigin(null);
            setNewDestination(null);
            setNewDate('');
            fetchData();
        } catch (error) {
            console.error('Error publishing return trip:', error);
            alert('Error al publicar. Intente nuevamente.');
        } finally {
            setPublishing(false);
        }
    };

    const handleAcceptRequest = async (orderId: string, returnTripId: string) => {
        if (!user?.uid) return;
        try {
            // Update Order: Assign it to this carrier
            await updateDocument(COLLECTIONS.ORDERS, orderId, {
                carrierId: user.uid,
                status: 'assigned',
                assignmentStatus: 'carrier_assigned',
                updatedAt: Timestamp.now()
            });

            // Update Return Trip: Mark as matched
            await updateDocument(COLLECTIONS.RETURN_TRIPS, returnTripId, {
                status: 'matched',
                matchedOrderId: orderId,
                updatedAt: Timestamp.now()
            });

            alert('¡Carga asignada exitosamente!');
            fetchData();
        } catch (error) {
            console.error('Error accepting request:', error);
            alert('Error al procesar solicitud.');
        }
    };

    const handleRejectRequest = async (orderId: string) => {
        try {
            // Update Order: Revert to normal flow
            await updateDocument(COLLECTIONS.ORDERS, orderId, {
                matchedReturnTripId: null, // Clear the tie
                updatedAt: Timestamp.now()
            });
            fetchData();
        } catch (error) {
            console.error('Error rejecting request:', error);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Repeat className="text-blue-600" size={32} />
                        Mis Viajes de Regreso
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">
                        Publica retornos vacíos para que los clientes puedan aprovecharlos.
                    </p>
                </div>
                <button
                    onClick={() => setShowPublishModal(true)}
                    className="btn btn-primary gap-2 shadow-lg shadow-blue-100"
                >
                    <Plus size={20} /> Publicar Regreso
                </button>
            </header>

            {/* Solicitudes de Clientes */}
            {customerRequests.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2 text-slate-700">Solicitudes Nuevas de Clientes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customerRequests.map(order => {
                            const relatedTrip = returnTrips.find(t => t.id === order.matchedReturnTripId);
                            return (
                                <div key={order.id} className="bg-amber-50 rounded-2xl p-5 border-2 border-amber-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="badge badge-warning text-xs font-bold">¡Hizo Match con tu Viaje!</div>
                                        <span className="text-xs text-amber-600 font-bold hidden md:inline">
                                            Viaje Base: {relatedTrip?.origin.address.split(',')[0]} ➔ {relatedTrip?.destination.address.split(',')[0]}
                                        </span>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                                        <p className="font-bold text-slate-800 text-sm mb-1">Ruta Solicitada por el Cliente:</p>
                                        <p className="text-xs text-slate-600 truncate"><span className="font-bold">A:</span> {order.origin.address}</p>
                                        <p className="text-xs text-slate-600 truncate"><span className="font-bold">B:</span> {order.destination.address}</p>
                                        <div className="flex gap-2 mt-2">
                                            {order.packageCount && <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">{order.packageCount} paquetes</span>}
                                            {order.cargoType && <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">{order.cargoType}</span>}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-100 mb-4">
                                        <p className="text-xs font-bold text-slate-400">Oferta del Cliente:</p>
                                        <p className="text-lg font-black text-slate-800">${order.pricing?.total?.toLocaleString('es-MX')} MXN</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => handleRejectRequest(order.id)} className="btn btn-outline flex-1 border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400">
                                            <XCircle size={18} className="mr-2" /> Rechazar
                                        </button>
                                        <button onClick={() => handleAcceptRequest(order.id, relatedTrip!.id)} className="btn bg-amber-500 hover:bg-amber-600 text-white border-none flex-1">
                                            <CheckCircle2 size={18} className="mr-2" /> Aceptar Viaje
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Mis Viajes Publicados */}
            <section className="space-y-4 pt-4">
                <h2 className="text-xl font-bold border-b pb-2 text-slate-700">Mis Regresos Publicados</h2>
                {returnTrips.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Truck className="mx-auto text-slate-300 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-slate-600">No hay regresos publicados</h3>
                        <p className="text-slate-400 text-sm">Empieza a publicar para rentabilizar tus retornos vacíos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {returnTrips.map(trip => (
                            <div key={trip.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
                                {trip.status === 'matched' && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">ASIGNADO</div>
                                )}
                                {trip.status === 'active' && (
                                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">ACTIVO</div>
                                )}
                                <div className="space-y-3 mt-2">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Salida (Camión Vacío)</p>
                                            <p className="text-sm font-bold text-slate-800 line-clamp-2">{trip.origin.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Destino (Base)</p>
                                            <p className="text-sm font-bold text-slate-800 line-clamp-2">{trip.destination.address}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {(trip.availableFrom as any).toDate().toLocaleDateString()}</span>
                                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded">Vence: 48h</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Modal para Publicar Regreso */}
            <Modal
                isOpen={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                title="Publicar Viaje de Regreso"
            >
                <div className="space-y-5 p-1">
                    <p className="text-sm text-slate-500">Publica la ruta en la que tu unidad regresará vacía. Los clientes podrán solicitar tus servicios para aprovechar la ruta.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Origen (Donde inicia el regreso vacío)</label>
                            <PlaceAutocomplete
                                className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                                placeholder="Ciudad o dirección de salida..."
                                onPlaceSelect={(loc: any) => setNewOrigin(loc)}
                            />
                            {newOrigin && <p className="text-[10px] text-emerald-600 mt-1 font-bold pl-1">Seleccionado: {newOrigin.address.split(',')[0]}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Destino (Hacia dónde regresas)</label>
                            <PlaceAutocomplete
                                className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                                placeholder="Ciudad o dirección de destino..."
                                onPlaceSelect={(loc: any) => setNewDestination(loc)}
                            />
                            {newDestination && <p className="text-[10px] text-emerald-600 mt-1 font-bold pl-1">Seleccionado: {newDestination.address.split(',')[0]}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Fecha de Disponibilidad</label>
                            <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            className="btn btn-outline flex-1"
                            onClick={() => setShowPublishModal(false)}
                            disabled={publishing}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary flex-1 shadow-md shadow-blue-100"
                            onClick={handlePublish}
                            disabled={!newOrigin || !newDestination || !newDate || publishing}
                        >
                            {publishing ? <Loader2 className="animate-spin" size={20} /> : 'Publicar Disponibilidad'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
