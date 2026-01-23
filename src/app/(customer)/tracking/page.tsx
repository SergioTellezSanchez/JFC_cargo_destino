'use client';

import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, Warehouse, AlertCircle, CheckCircle, Clock, Truck, Box, FileText, Download } from 'lucide-react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { generateShippingGuide } from '@/lib/pdfGenerator';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;
const MAP_ID = "4b2094d4b3b1a5ccd5a74cb9";

export default function TrackingPage() {
    const [trackingId, setTrackingId] = useState('');
    const [packageData, setPackageData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-search from URL param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlId = params.get('trackingId');
        if (urlId) {
            setTrackingId(urlId);
            // Trigger search immediately if ID exists
            // We need to move the fetch logic to a reusable function or trigger it here
            fetchPackage(urlId);
        }
    }, []);

    const fetchPackage = async (id: string) => {
        setLoading(true);
        setError('');
        setPackageData(null);

        try {
            const response = await fetch(`/api/packages?trackingId=${id}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    setPackageData(data[0]);
                } else {
                    setError('Paquete no encontrado. Verifica el ID.');
                }
            } else {
                setError('Error al buscar el paquete.');
            }
        } catch (err) {
            setError('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingId) return;
        fetchPackage(trackingId);
    };

    const requestStorage = async () => {
        if (!packageData) return;

        try {
            const response = await fetch(`/api/packages/${packageData.id}/storage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'REQUEST' })
            });

            if (response.ok) {
                const updatedPkg = await response.json();
                setPackageData(updatedPkg);
                alert('Solicitud de almacenaje enviada correchamente.');
            } else {
                alert('Error al solicitar almacenaje.');
            }
        } catch (err) {
            alert('Error de conexión.');
        }
    };

    // Helper to get status color
    const getStatusColor = (status: string) => {
        const s = status?.toUpperCase();
        if (s === 'DELIVERED') return 'bg-green-100 text-green-700 border-green-200';
        if (s === 'IN_TRANSIT') return 'bg-blue-100 text-blue-700 border-blue-200';
        if (s === 'PENDING') return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-slate-100 text-slate-600 border-slate-200';
    };

    const getStatusLabel = (status: string) => {
        const mapping: Record<string, string> = {
            'PENDING': 'Pendiente',
            'ASSIGNED': 'Recolector Asignado',
            'PICKED_UP': 'Recolectado',
            'IN_TRANSIT': 'En Tránsito',
            'DELIVERED': 'Entregado',
            'CANCELLED': 'Cancelado'
        };
        return mapping[status] || status;
    };

    return (
        <APIProvider apiKey={API_KEY}>
            <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden">
                {/* Background Decorations */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />
                </div>

                <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">

                    {/* Header */}
                    <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                            Rastrea tu{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-400 to-amber-400">
                                Paquete
                            </span>
                        </h1>
                        <p className="text-slate-500">
                            Ingresa tu código de rastreo para ver el estado en tiempo real.
                        </p>
                    </div>

                    {/* Search Card */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-2 mb-8 transform transition-all hover:scale-[1.01]">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none text-slate-800 placeholder:text-slate-400 font-medium transition-all"
                                    placeholder="Ej. PKG-123456"
                                    value={trackingId}
                                    onChange={(e) => setTrackingId(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Buscando...' : <><Search size={20} /> Buscar</>}
                            </button>
                        </form>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={20} />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Results */}
                    {packageData && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">

                            {/* Main Info Card */}
                            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-visible border border-slate-100">
                                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ID de Rastreo</div>
                                        <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">{packageData.trackingId}</div>
                                        <div className="text-slate-500 flex items-center gap-2 mt-1">
                                            <Package size={14} />
                                            Para: <span className="font-semibold text-slate-700">{packageData.recipientName}</span>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-full border font-bold text-sm uppercase tracking-wide flex items-center gap-2 ${getStatusColor(packageData.deliveries?.[0]?.status)}`}>
                                        <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                        {getStatusLabel(packageData.deliveries?.[0]?.status)}
                                    </div>
                                    <button
                                        onClick={() => generateShippingGuide({
                                            ...packageData,
                                            dimensions: packageData.dimensions || packageData.size,
                                            destination: packageData.address || packageData.destination
                                        })}
                                        className="btn btn-secondary flex items-center gap-2 py-2 px-4 rounded-xl border-2 border-slate-200 hover:bg-slate-50 transition-all text-slate-700 font-bold text-sm shadow-sm"
                                    >
                                        <Download size={16} /> Descargar Guía
                                    </button>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-xl h-fit">
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">Dirección de Entrega</h3>
                                                <p className="text-slate-600 leading-relaxed mt-1">{packageData.address}</p>
                                                <p className="text-slate-400 text-sm mt-1">CP: {packageData.postalCode}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="mt-1 p-2 bg-purple-50 text-purple-600 rounded-xl h-fit">
                                                <Box size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">Detalles del Paquete</h3>
                                                <div className="flex gap-4 mt-2">
                                                    <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-sm font-medium text-slate-600">
                                                        {packageData.weight} kg
                                                    </div>
                                                    <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-sm font-medium text-slate-600">
                                                        {packageData.size}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Storage Status */}
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                            <Warehouse className="text-slate-500" size={20} />
                                            Servicio de Almacenaje
                                        </h3>

                                        <div className="space-y-4">
                                            {packageData.storageStatus === 'NONE' && (
                                                <>
                                                    <p className="text-sm text-slate-500">¿No puedes recibirlo ahora? Solicita que guardemos tu paquete seguro en bodega.</p>
                                                    <button
                                                        onClick={requestStorage}
                                                        className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all text-sm"
                                                    >
                                                        Solicitar Almacenaje
                                                    </button>
                                                </>
                                            )}
                                            {packageData.storageStatus === 'REQUESTED' && (
                                                <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                                                    <Clock size={20} />
                                                    <span className="font-bold text-sm">Solicitud en proceso...</span>
                                                </div>
                                            )}
                                            {packageData.storageStatus === 'APPROVED' && (
                                                <div className="flex items-center gap-3 text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">
                                                    <CheckCircle size={20} />
                                                    <span className="font-bold text-sm">Aprobado. Espacio reservado.</span>
                                                </div>
                                            )}
                                            {packageData.storageStatus === 'REJECTED' && (
                                                <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                                                    <AlertCircle size={20} />
                                                    <span className="font-bold text-sm">Solicitud rechazada.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Map Card */}
                            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 h-[500px]">
                                <div className="h-full w-full relative">
                                    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm border border-white/50 text-slate-500">
                                        Ubicación en tiempo real
                                    </div>
                                    <Map
                                        mapId={MAP_ID}
                                        defaultCenter={packageData.latitude && packageData.longitude ? { lat: packageData.latitude, lng: packageData.longitude } : { lat: 19.4326, lng: -99.1332 }}
                                        defaultZoom={12}
                                        gestureHandling={'cooperative'}
                                        disableDefaultUI={false}
                                        className="h-full w-full"
                                    >
                                        {packageData.latitude && packageData.longitude && (
                                            <Marker
                                                position={{ lat: packageData.latitude, lng: packageData.longitude }}
                                            />
                                        )}
                                    </Map>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </APIProvider>
    );
}
