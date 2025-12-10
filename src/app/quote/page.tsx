'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { authenticatedFetch } from '@/lib/api';
import PlaceAutocomplete from '@/components/PlaceAutocomplete';
import DirectionsMap from '@/components/DirectionsMap';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { formatCurrency } from '@/lib/utils';
import Modal from '@/components/Modal';
import { MapPin, Package, Zap, ChevronRight, CheckCircle, Navigation, Clock } from 'lucide-react';

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

    // Steps: 1 = Route, 2 = Package, 3 = Service
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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

    // Map Interaction State
    const [isPickingLocation, setIsPickingLocation] = useState<'origin' | 'destination' | null>(null);

    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    // Step Validation Logic
    const isStep1Valid = !!origin && !!destination;
    const isStep2Valid = isStep1Valid && weight > 0 && description.trim().length > 0;

    // Real-time calculation effect
    useEffect(() => {
        if (isStep1Valid) {
            // Calculo preliminar sin esperar al botón
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
        }
    }, [distanceKm, weight, serviceLevel, isStep1Valid]);

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
                serviceLevel,
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
            <QuoteContent
                pickingLocation={isPickingLocation}
                setPickingLocation={setIsPickingLocation}
                setOrigin={setOrigin}
                setDestination={setDestination}
                origin={origin}
                destination={destination}
                weight={weight}
                setWeight={setWeight}
                description={description}
                setDescription={setDescription}
                serviceLevel={serviceLevel}
                setServiceLevel={setServiceLevel}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isStep1Valid={isStep1Valid}
                isStep2Valid={isStep2Valid}
                distanceKm={distanceKm}
                setDistanceKm={setDistanceKm}
                quoteDetails={quoteDetails}
                quotePrice={quotePrice}
                handleCreatePackage={handleCreatePackage}
                showModal={showModal}
                setShowModal={setShowModal}
                recipientName={recipientName}
                setRecipientName={setRecipientName}
                recipientPhone={recipientPhone}
                setRecipientPhone={setRecipientPhone}
                loading={loading}
            />
        </APIProvider>
    );
}

// Extracted Content Component to use Maps Hooks safely
function QuoteContent(props: any) {
    const geocodingLib = useMapsLibrary('geocoding');
    const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

    useEffect(() => {
        if (geocodingLib) {
            setGeocoder(new geocodingLib.Geocoder());
        }
    }, [geocodingLib]);

    const handleMapClick = (e: any) => {
        if (!props.pickingLocation || !geocoder || !e.detail.latLng) return;

        const lat = e.detail.latLng.lat;
        const lng = e.detail.latLng.lng;

        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const locationData = {
                    address: results[0].formatted_address,
                    lat,
                    lng
                };

                if (props.pickingLocation === 'origin') {
                    props.setOrigin(locationData);
                } else {
                    props.setDestination(locationData);
                }
                props.setPickingLocation(null); // Exit picking mode
            } else {
                alert('No pudimos obtener la dirección de este punto.');
            }
        });
    };

    return (
        <div className="container mx-auto p-6 lg:p-8 min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Main Content Area (Left) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="text-left mb-6">
                        <h1 className="text-3xl font-extrabold mb-2 text-gradient">Cotizar Envío</h1>
                        <p className="text-gray-500">Completa los datos en orden para ver tu tarifa.</p>
                    </div>

                    {/* Top Navigation Steps */}
                    <div className="flex border-b border-gray-200 mb-8 bg-white rounded-t-xl overflow-hidden shadow-sm">
                        {[
                            { id: 1, label: 'Ruta', icon: Navigation, valid: props.isStep1Valid },
                            { id: 2, label: 'Paquete', icon: Package, valid: props.isStep2Valid },
                            { id: 3, label: 'Servicio', icon: Zap, valid: false }
                        ].map((step) => (
                            <button
                                key={step.id}
                                onClick={() => {
                                    if (step.id === 1) props.setCurrentStep(1);
                                    if (step.id === 2 && props.isStep1Valid) props.setCurrentStep(2);
                                    if (step.id === 3 && props.isStep2Valid) props.setCurrentStep(3);
                                }}
                                disabled={(step.id === 2 && !props.isStep1Valid) || (step.id === 3 && !props.isStep2Valid)}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all relative
                                    ${props.currentStep === step.id ? 'text-[#1f4a5e] bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}
                                    ${(step.id === 2 && !props.isStep1Valid) || (step.id === 3 && !props.isStep2Valid) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                    ${props.currentStep === step.id ? 'bg-gradient-to-r from-[#1f4a5e] to-[#6daec7] text-white shadow-md' :
                                        step.valid ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}
                                `}>
                                    {step.valid ? <CheckCircle size={14} /> : step.id}
                                </div>
                                <span className="hidden sm:inline">{step.label}</span>
                                {props.currentStep === step.id && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#1f4a5e] rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Step Content */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 lg:p-10 min-h-[400px]">

                        {/* Step 1: Ruta */}
                        {props.currentStep === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-[#1f4a5e]">Definir Ruta</h2>
                                    <button
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${props.pickingLocation ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        onClick={() => props.setPickingLocation(props.pickingLocation ? null : 'origin')}
                                    >
                                        <MapPin size={16} />
                                        {props.pickingLocation ? 'Cancel Selection' : 'Seleccionar en Mapa'}
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className={`p-4 rounded-xl border-2 transition-all ${props.pickingLocation === 'origin' ? 'border-[#1f4a5e] bg-blue-50/30' : 'border-transparent bg-gray-50'}`}>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">📍 Origen</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <PlaceAutocomplete
                                                    className="input bg-white"
                                                    placeholder="Ej. Av. Reforma 222, CDMX"
                                                    onPlaceSelect={props.setOrigin}
                                                />
                                            </div>
                                            <button
                                                className={`p-3 rounded-lg border transition-colors ${props.pickingLocation === 'origin' ? 'bg-[#1f4a5e] text-white border-[#1f4a5e]' : 'bg-white text-gray-500 border-gray-300 hover:border-[#1f4a5e]'}`}
                                                onClick={() => props.pickingLocation === 'origin' ? props.setPickingLocation(null) : props.setPickingLocation('origin')}
                                                title="Seleccionar en mapa"
                                            >
                                                <MapPin size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`p-4 rounded-xl border-2 transition-all ${props.pickingLocation === 'destination' ? 'border-[#1f4a5e] bg-blue-50/30' : 'border-transparent bg-gray-50'}`}>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">🏁 Destino</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <PlaceAutocomplete
                                                    className="input bg-white"
                                                    placeholder="Ej. Polanco V Sección, CDMX"
                                                    onPlaceSelect={props.setDestination}
                                                />
                                            </div>
                                            <button
                                                className={`p-3 rounded-lg border transition-colors ${props.pickingLocation === 'destination' ? 'bg-[#1f4a5e] text-white border-[#1f4a5e]' : 'bg-white text-gray-500 border-gray-300 hover:border-[#1f4a5e]'}`}
                                                onClick={() => props.pickingLocation === 'destination' ? props.setPickingLocation(null) : props.setPickingLocation('destination')}
                                                title="Seleccionar en mapa"
                                            >
                                                <MapPin size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {props.isStep1Valid && (
                                    <div className="flex justify-end pt-4">
                                        <button
                                            className="btn btn-primary px-8 py-3 rounded-full text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                                            onClick={() => props.setCurrentStep(2)}
                                        >
                                            Siguiente Paso <ChevronRight size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Paquete */}
                        {props.currentStep === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-2xl font-bold text-[#1f4a5e]">Detalles del Paquete</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Peso (kg)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                className="input pr-10 text-lg font-mono"
                                                value={props.weight}
                                                onChange={(e) => props.setWeight(Number(e.target.value))}
                                            />
                                            <span className="absolute right-3 top-3.5 text-gray-400 font-bold">KG</span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                                        <textarea
                                            className="input h-32 resize-none"
                                            placeholder="Describa brevemente el contenido (ej. Documentos, Caja mediana...)"
                                            value={props.description}
                                            onChange={(e) => props.setDescription(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {props.isStep2Valid && (
                                    <div className="flex justify-end pt-4">
                                        <button
                                            className="btn btn-primary px-8 py-3 rounded-full text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                                            onClick={() => props.setCurrentStep(3)}
                                        >
                                            Ver Tarifas <ChevronRight size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Servicio */}
                        {props.currentStep === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-2xl font-bold text-[#1f4a5e]">Elige tu Servicio</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <button
                                        className={`group relative p-6 border-2 rounded-2xl text-left transition-all duration-300 hover:shadow-xl overflow-hidden
                                            ${props.serviceLevel === 'standard' ? 'border-transparent ring-2 ring-[#1f4a5e] bg-gradient-to-br from-white to-blue-50 shadow-lg' : 'border-gray-100 hover:border-gray-200 bg-white'}
                                        `}
                                        onClick={() => props.setServiceLevel('standard')}
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Clock size={64} className="text-[#1f4a5e]" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-bold text-xl text-[#1f4a5e]">Estándar</span>
                                                {props.serviceLevel === 'standard' && <CheckCircle className="text-[#1f4a5e]" />}
                                            </div>
                                            <p className="text-gray-500 text-sm mb-4">La opción económica para envíos sin prisa.</p>
                                            <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                                                <Clock size={14} className="text-gray-500" />
                                                <span className="text-xs font-bold text-gray-600">1-2 días hábiles</span>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        className={`group relative p-6 border-2 rounded-2xl text-left transition-all duration-300 hover:shadow-xl overflow-hidden
                                            ${props.serviceLevel === 'express' ? 'border-transparent ring-2 ring-[#1f4a5e] bg-gradient-to-br from-white to-yellow-50 shadow-lg' : 'border-gray-100 hover:border-gray-200 bg-white'}
                                        `}
                                        onClick={() => props.setServiceLevel('express')}
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Zap size={64} className="text-yellow-500" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-bold text-xl text-[#1f4a5e]">Express</span>
                                                {props.serviceLevel === 'express' && <CheckCircle className="text-[#1f4a5e]" />}
                                            </div>
                                            <p className="text-gray-500 text-sm mb-4">Entrega prioritaria para urgencias.</p>
                                            <div className="inline-flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-full">
                                                <Zap size={14} className="text-yellow-600" />
                                                <span className="text-xs font-bold text-yellow-700">Entrega Hoy</span>
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <div className="bg-[#1f4a5e] text-white p-6 rounded-2xl shadow-xl mt-8">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="opacity-80 text-sm uppercase tracking-wider mb-1">Total Estimado</p>
                                            <div className="text-4xl font-bold">{formatCurrency(props.quotePrice)}</div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm opacity-80">{props.distanceKm.toFixed(1)} km • {props.weight} kg</p>
                                        </div>
                                    </div>
                                    <button
                                        className="w-full bg-white text-[#1f4a5e] font-bold py-4 rounded-xl hover:bg-gray-100 transition shadow-lg text-lg uppercase tracking-wide flex items-center justify-center gap-2"
                                        onClick={() => props.setShowModal(true)}
                                    >
                                        Crear Solicitud de Envío
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Map */}
                <div className="lg:col-span-5 h-full order-first lg:order-last">
                    <div className="sticky top-8 space-y-6">
                        <div className={`rounded-2xl overflow-hidden shadow-2xl border-4 transition-all h-[500px] relative ${props.pickingLocation ? 'border-red-400 ring-4 ring-red-100' : 'border-white'}`}>

                            {props.pickingLocation && (
                                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-red-500 text-white px-6 py-2 rounded-full shadow-lg font-bold animate-pulse pointer-events-none">
                                    Toca un punto en el mapa
                                </div>
                            )}

                            <DirectionsMap
                                origin={props.origin}
                                destination={props.destination}
                                onDistanceCalculated={props.setDistanceKm}
                                onMapClick={handleMapClick}
                            />

                            {/* Simple Quote Overlay if not in Step 3 */}
                            {props.quotePrice > 0 && props.currentStep < 3 && (
                                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-xs text-gray-500 font-bold uppercase">Estimado</div>
                                            <div className="text-xl font-bold text-[#1f4a5e]">{formatCurrency(props.quotePrice)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 font-bold uppercase">Distancia</div>
                                            <div className="text-sm font-semibold">{props.distanceKm.toFixed(1)} km</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Recipient Details */}
            <Modal isOpen={props.showModal} title="Datos del Destinatario" onClose={() => props.setShowModal(false)}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            className="input"
                            value={props.recipientName}
                            onChange={(e) => props.setRecipientName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                            type="tel"
                            className="input"
                            value={props.recipientPhone}
                            onChange={(e) => props.setRecipientPhone(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            className="btn btn-secondary flex-1"
                            onClick={() => props.setShowModal(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary flex-1"
                            onClick={props.handleCreatePackage}
                            disabled={!props.recipientName || !props.recipientPhone}
                        >
                            Confirmar y Crear
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

