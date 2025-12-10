'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { authenticatedFetch } from '@/lib/api';
import PlaceAutocomplete from '@/components/PlaceAutocomplete';
import DirectionsMap from '@/components/DirectionsMap';
import { APIProvider } from '@vis.gl/react-google-maps';
import { formatCurrency } from '@/lib/utils';
import Modal from '@/components/Modal';

interface LocationState {
    address: string;
    lat: number;
    lng: number;
}

export default function QuotePage() {
    const { user } = useUser();
    const router = useRouter();
    const { language } = useLanguage();
    const t = useTranslation(language);

    const [origin, setOrigin] = useState<LocationState | null>(null);
    const [destination, setDestination] = useState<LocationState | null>(null);

    // Package Details
    const [weight, setWeight] = useState(1);
    const [dimensions, setDimensions] = useState({ length: 10, width: 10, height: 10 });
    const [description, setDescription] = useState('');

    // Service Level
    const [serviceLevel, setServiceLevel] = useState<'standard' | 'express'>('standard');

    // Calculation State
    const [distanceKm, setDistanceKm] = useState(0);
    const [quotePrice, setQuotePrice] = useState(0);
    const [quoteDetails, setQuoteDetails] = useState<{
        base: number;
        distance: number;
        weight: number;
        serviceMultiplier: number;
        serviceFee: number;
    } | null>(null);
    const [calculated, setCalculated] = useState(false);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');

    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    const handleCalculate = () => {
        if (!origin || !destination) {
            alert('Por favor selecciona origen y destino válidos.');
            return;
        }

        setLoading(true);
        // Base calculation logic (mimicking backend or utilizing distance)
        // Base rate: $50
        // Per km: $10
        // Per kg: $5
        // Service Multiplier: Standard 1x, Express 1.5x

        // Note: Real distance comes from the map component callback, 
        // but we trigger a recalc here to finalize the price display.

        setTimeout(() => {
            const baseRate = 50;
            const distanceCost = distanceKm * 10;
            const weightCost = weight * 5;
            const subtotal = baseRate + distanceCost + weightCost;
            const multiplier = serviceLevel === 'express' ? 1.5 : 1.0;
            const finalPrice = subtotal * multiplier;

            setQuoteDetails({
                base: baseRate,
                distance: distanceCost,
                weight: weightCost,
                serviceMultiplier: multiplier,
                serviceFee: finalPrice - subtotal
            });
            setQuotePrice(finalPrice);
            setCalculated(true);
            setLoading(false);
        }, 800);
    };

    const handleCreatePackage = async () => {
        if (!user) {
            alert(t('loginRequired'));
            router.push('/login');
            return;
        }

        try {
            const packageData = {
                origin: origin?.address,
                destination: destination?.address,
                weight,
                dimensions: `${dimensions.length}x${dimensions.width}x${dimensions.height}`,
                price: quotePrice,
                description,
                status: 'PENDING',
                userId: user.uid,
                recipientName,
                recipientPhone,
                serviceLevel, // Save service level if backend supports it (optional)
            };

            const res = await authenticatedFetch('/api/packages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(packageData)
            });

            if (res.ok) {
                alert('Paquete creado exitosamente');
                router.push('/tracking');
            } else {
                alert('Error al crear el paquete');
            }
        } catch (error) {
            console.error(error);
            alert('Error al conectar con el servidor');
        }
    };

    // Progressive Step Validation
    const isStep1Valid = !!origin && !!destination;
    const isStep2Valid = isStep1Valid && weight > 0 && description.trim().length > 0;

    // Auto-scroll to next step (optional enhancement, can be added later if requested)

    return (
        <APIProvider apiKey={API_KEY}>
            <div className="container mx-auto p-6 lg:p-12 min-h-screen bg-gray-50/50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold mb-3 text-gradient">Cotizar Envío</h1>
                        <p className="text-gray-600 text-lg">Completa los pasos para obtener tu tarifa al instante.</p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                        {/* Left Column: Progressive Form */}
                        <div className="space-y-8">

                            {/* Step 1: Ruta */}
                            <div className={`card transition-all duration-300 ${isStep1Valid ? 'border-l-4 border-l-[#1f4a5e]' : 'border-l-4 border-l-gray-300'}`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${isStep1Valid ? 'bg-[#1f4a5e] text-white shadow-lg' : 'bg-gray-200 text-gray-500'}`}>
                                        1
                                    </div>
                                    <div>
                                        <h2 className={`text-xl font-bold ${isStep1Valid ? 'text-[#1f4a5e]' : 'text-gray-500'}`}>Ruta del Envío</h2>
                                        <p className="text-sm text-gray-500">Define el punto de recolección y entrega.</p>
                                    </div>
                                </div>
                                <div className="space-y-6 pl-4 lg:pl-14">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">📍 Origen (Recolección)</label>
                                        <PlaceAutocomplete
                                            className="input"
                                            placeholder="Ej. Av. Reforma 222, CDMX"
                                            onPlaceSelect={setOrigin}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Ingresa la dirección completa donde recogeremos el paquete.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">🏁 Destino (Entrega)</label>
                                        <PlaceAutocomplete
                                            className="input"
                                            placeholder="Ej. Polanco V Sección, CDMX"
                                            onPlaceSelect={setDestination}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Ingresa la dirección exacta de entrega.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Paquete */}
                            <div className={`card transition-all duration-300 ${!isStep1Valid ? 'opacity-50 pointer-events-none grayscale' : ''} ${isStep2Valid ? 'border-l-4 border-l-[#1f4a5e]' : 'border-l-4 border-l-gray-300'}`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${isStep2Valid ? 'bg-[#1f4a5e] text-white shadow-lg' : 'bg-gray-200 text-gray-500'}`}>
                                        2
                                    </div>
                                    <div>
                                        <h2 className={`text-xl font-bold ${isStep2Valid ? 'text-[#1f4a5e]' : 'text-gray-500'}`}>Detalles del Paquete</h2>
                                        <p className="text-sm text-gray-500">Específica las características de tu envío.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 lg:pl-14">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">📦 Peso Aproximado</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                className="input pr-8"
                                                value={weight}
                                                onChange={(e) => setWeight(Number(e.target.value))}
                                            />
                                            <span className="absolute right-3 top-3 text-gray-400 text-sm">kg</span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">📝 Descripción del Contenido</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Ej. Documentos, Ropa, Electrónicos..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Breve descripción para el conductor.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Servicio */}
                            <div className={`card transition-all duration-300 ${!isStep2Valid ? 'opacity-50 pointer-events-none grayscale' : ''} border-l-4 border-l-[#1f4a5e]`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors bg-[#1f4a5e] text-white shadow-lg`}>
                                        3
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[#1f4a5e]">Tipo de Servicio</h2>
                                        <p className="text-sm text-gray-500">¿Qué tan rápido lo necesitas?</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 lg:pl-14 h-full">
                                    <button
                                        className={`group relative p-6 border-2 rounded-xl text-left transition-all duration-200 h-full flex flex-col justify-between hover:shadow-lg ${serviceLevel === 'standard' ? 'border-[#1f4a5e] bg-[#f0f9ff] shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                                        onClick={() => setServiceLevel('standard')}
                                    >
                                        <div className="mb-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-lg text-[#1f4a5e]">Estándar</span>
                                                {serviceLevel === 'standard' && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1f4a5e] opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-[#1f4a5e]"></span></span>}
                                            </div>
                                            <p className="text-sm text-gray-600">Ideal para envíos no urgentes.</p>
                                        </div>
                                        <div className="text-xs font-semibold text-gray-500 bg-white/50 px-3 py-1 rounded-full w-fit">
                                            🕒 1-2 días hábiles
                                        </div>
                                    </button>

                                    <button
                                        className={`group relative p-6 border-2 rounded-xl text-left transition-all duration-200 h-full flex flex-col justify-between hover:shadow-lg ${serviceLevel === 'express' ? 'border-[#1f4a5e] bg-[#f0f9ff] shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                                        onClick={() => setServiceLevel('express')}
                                    >
                                        <div className="mb-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-lg text-[#1f4a5e]">Express ⚡</span>
                                                {serviceLevel === 'express' && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1f4a5e] opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-[#1f4a5e]"></span></span>}
                                            </div>
                                            <p className="text-sm text-gray-600">Prioridad máxima de entrega.</p>
                                        </div>
                                        <div className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full w-fit">
                                            🚀 Entrega Hoy
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <button
                                className={`w-full text-xl py-5 rounded-xl font-bold tracking-wide shadow-xl transition-all transform hover:-translate-y-1 ${!isStep2Valid ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'btn-primary hover:shadow-2xl'}`}
                                onClick={handleCalculate}
                                disabled={loading || !isStep2Valid}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                        <span>Calculando Tarifa...</span>
                                    </div>
                                ) : (
                                    'COTIZAR AHORA'
                                )}
                            </button>
                        </div>

                        {/* Right Column: Map & Summary */}
                        <div className="sticky top-8 space-y-8">
                            <div className="bg-white p-2 rounded-2xl shadow-xl border border-gray-100">
                                <div className="h-[400px] xl:h-[600px] bg-gray-100 rounded-xl overflow-hidden relative">
                                    {/* Map Overlay Info */}
                                    {distanceKm > 0 && (
                                        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md">
                                            <div className="text-sm font-semibold text-gray-600">Distancia Estimada</div>
                                            <div className="text-xl font-bold text-[#1f4a5e]">{distanceKm.toFixed(1)} km</div>
                                        </div>
                                    )}

                                    <DirectionsMap
                                        origin={origin}
                                        destination={destination}
                                        onDistanceCalculated={setDistanceKm}
                                    />
                                </div>

                                {calculated && quoteDetails && (
                                    <div className="card bg-[#1f4a5e] text-white animate-in slide-in-from-bottom-4 fade-in duration-500 shadow-xl">
                                        <div className="mb-6">
                                            <h3 className="text-lg font-light opacity-90 mb-4 border-b border-white/20 pb-2">Desglose de Cotización</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="opacity-80">Tarifa Base</span>
                                                    <span>{formatCurrency(quoteDetails.base)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="opacity-80">Distancia ({distanceKm.toFixed(1)} km)</span>
                                                    <span>{formatCurrency(quoteDetails.distance)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="opacity-80">Peso ({weight} kg)</span>
                                                    <span>{formatCurrency(quoteDetails.weight)}</span>
                                                </div>
                                                {quoteDetails.serviceFee > 0 && (
                                                    <div className="flex justify-between text-yellow-300">
                                                        <span>Servicio Express (+50%)</span>
                                                        <span>{formatCurrency(quoteDetails.serviceFee)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mb-6 pt-4 border-t border-white/20">
                                            <div>
                                                <h3 className="text-sm font-semibold uppercase tracking-wider opacity-70">Total a Pagar</h3>
                                                <div className="text-4xl font-bold">{formatCurrency(quotePrice)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-4xl">📦</div>
                                            </div>
                                        </div>
                                        <button
                                            className="w-full bg-white text-[#1f4a5e] font-bold py-4 rounded-lg hover:bg-gray-100 transition shadow-lg text-lg uppercase tracking-wide"
                                            onClick={() => setShowModal(true)}
                                        >
                                            Generar Envío
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Recipient Details */}
            <Modal isOpen={showModal} title="Datos del Destinatario" onClose={() => setShowModal(false)}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            className="input"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                            type="tel"
                            className="input"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            className="btn btn-secondary flex-1"
                            onClick={() => setShowModal(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary flex-1"
                            onClick={handleCreatePackage}
                            disabled={!recipientName || !recipientPhone}
                        >
                            Confirmar y Crear
                        </button>
                    </div>
                </div>
            </Modal>

        </APIProvider>
    );
}
