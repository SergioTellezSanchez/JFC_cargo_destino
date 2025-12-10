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

    return (
        <APIProvider apiKey={API_KEY}>
            <div className="container mx-auto p-4 min-h-screen">
                <h1 className="text-3xl font-bold mb-2 text-gradient">Cotizar Envío</h1>
                <p className="text-gray-500 mb-8">Calcula el costo de tu envío en segundos.</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Inputs */}
                    <div className="space-y-6">
                        {/* 1. Ruta */}
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-6 text-[#1f4a5e] flex items-center gap-3">
                                <span className="bg-[#1f4a5e] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-sm">1</span>
                                Ruta del Envío
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                                    <PlaceAutocomplete
                                        className="input"
                                        placeholder="¿Dónde recolectamos?"
                                        onPlaceSelect={setOrigin}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                                    <PlaceAutocomplete
                                        className="input"
                                        placeholder="¿A dónde va?"
                                        onPlaceSelect={setDestination}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Detalles del Paquete */}
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-6 text-[#1f4a5e] flex items-center gap-3">
                                <span className="bg-[#1f4a5e] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-sm">2</span>
                                Detalles del Paquete
                            </h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="input"
                                        value={weight}
                                        onChange={(e) => setWeight(Number(e.target.value))}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="¿Qué envías?"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Nivel de Servicio */}
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-6 text-[#1f4a5e] flex items-center gap-3">
                                <span className="bg-[#1f4a5e] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-sm">3</span>
                                Tipo de Servicio
                            </h2>
                            <div className="grid grid-cols-2 gap-4 h-full">
                                <button
                                    className={`p-6 border rounded-xl text-left transition-all h-full flex flex-col justify-between ${serviceLevel === 'standard' ? 'border-[#1f4a5e] bg-[#f0f9ff] ring-2 ring-[#1f4a5e] shadow-md' : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                                    onClick={() => setServiceLevel('standard')}
                                >
                                    <div className="font-bold text-lg text-[#1f4a5e] mb-2">Estándar</div>
                                    <div className="text-sm text-gray-500">Entrega en 1-2 días<br /><span className="text-xs opacity-75">Tarifa Normal</span></div>
                                </button>
                                <button
                                    className={`p-6 border rounded-xl text-left transition-all h-full flex flex-col justify-between ${serviceLevel === 'express' ? 'border-[#1f4a5e] bg-[#f0f9ff] ring-2 ring-[#1f4a5e] shadow-md' : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                                    onClick={() => setServiceLevel('express')}
                                >
                                    <div className="font-bold text-lg text-[#1f4a5e] mb-2">Express ⚡</div>
                                    <div className="text-sm text-gray-500">Entrega hoy mismo<br /><span className="text-xs text-yellow-600 font-semibold">+50% Tarifa</span></div>
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary w-full text-xl py-4 shadow-lg hover:shadow-xl transform transition-all active:scale-[0.98] font-bold tracking-wide"
                            onClick={handleCalculate}
                            disabled={loading || !origin || !destination}
                        >
                            {loading ? 'Calculando...' : 'COTIZAR AHORA'}
                        </button>
                    </div>

                    {/* Right Column: Map & Summary */}
                    <div className="flex flex-col gap-6">
                        <div className="h-[400px] lg:h-[500px] bg-gray-100 rounded-xl overflow-hidden shadow-inner relative border border-gray-200">
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
