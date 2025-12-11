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
import { MapPin, Package, Zap, ChevronRight, CheckCircle, Navigation, Clock, ShieldCheck, Truck } from 'lucide-react';

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
                props.setPickingLocation(null);
            } else {
                alert('No pudimos obtener la dirección de este punto.');
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="container mx-auto px-4 py-8 lg:py-12 relative z-10">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                            Calcula tu{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                Envío Ideal
                            </span>
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Obtén una cotización instantánea y programa tu recolección en minutos. Sin complicaciones.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                        {/* Main Interaction Area */}
                        <div className="lg:col-span-7 space-y-8">

                            {/* Modern Navigation Tabs */}
                            <div className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl shadow-sm border border-slate-200/60 sticky top-4 z-50">
                                <div className="flex relative">
                                    {[
                                        { id: 1, label: 'Ruta', icon: Navigation },
                                        { id: 2, label: 'Paquete', icon: Package },
                                        { id: 3, label: 'Servicio', icon: Zap }
                                    ].map((step) => {
                                        const isActive = props.currentStep === step.id;
                                        const isCompleted = props.currentStep > step.id;
                                        const isDisabled = step.id > props.currentStep &&
                                            ((step.id === 2 && !props.isStep1Valid) || (step.id === 3 && !props.isStep2Valid));

                                        return (
                                            <button
                                                key={step.id}
                                                onClick={() => {
                                                    if (!isDisabled) props.setCurrentStep(step.id);
                                                }}
                                                disabled={isDisabled}
                                                className={`flex-1 relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300
                                                    ${isActive ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                                                    ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                                                `}
                                            >
                                                <step.icon size={18} className={isActive ? 'text-blue-500' : isCompleted ? 'text-green-500' : 'text-slate-400'} />
                                                <span>{step.label}</span>
                                                {isActive && (
                                                    <div className="absolute inset-0 border-2 border-blue-100 rounded-xl" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Cards Container */}
                            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative min-h-[500px] transition-all duration-500">

                                {/* Step 1: Route */}
                                {props.currentStep === 1 && (
                                    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-left-8 duration-500">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-800">¿A dónde vamos?</h2>
                                                <p className="text-slate-500">Define los puntos de recolección y entrega.</p>
                                            </div>
                                            <button
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all shadow-sm
                                                    ${props.pickingLocation
                                                        ? 'bg-red-50 text-red-600 ring-2 ring-red-100 animate-pulse'
                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 ring-1 ring-slate-200'}
                                                `}
                                                onClick={() => props.setPickingLocation(props.pickingLocation ? null : 'origin')}
                                            >
                                                <MapPin size={14} />
                                                {props.pickingLocation ? 'Cancelar Mapa' : 'Usar Mapa'}
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Origin Input */}
                                            <div className={`group relative p-1 rounded-2xl transition-all duration-300 ${props.pickingLocation === 'origin' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 p-[2px]' : 'bg-transparent'}`}>
                                                <div className="bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-200 group-hover:border-transparent transition-all shadow-sm group-hover:shadow-lg">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                                                        <Navigation size={12} className="text-blue-500" /> Origen
                                                    </label>
                                                    <div className="flex gap-4">
                                                        <PlaceAutocomplete
                                                            className="w-full bg-transparent border-b-2 border-slate-200 focus:border-blue-500 outline-none py-2 text-lg font-medium text-slate-800 placeholder:text-slate-300 transition-colors"
                                                            placeholder="Dirección de recolección"
                                                            onPlaceSelect={props.setOrigin}
                                                        />
                                                        <button
                                                            onClick={() => props.setPickingLocation('origin')}
                                                            className={`p-3 rounded-full transition-all ${props.pickingLocation === 'origin' ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-500'}`}
                                                        >
                                                            <MapPin size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Destination Input */}
                                            <div className={`group relative p-1 rounded-2xl transition-all duration-300 ${props.pickingLocation === 'destination' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 p-[2px]' : 'bg-transparent'}`}>
                                                <div className="bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-200 group-hover:border-transparent transition-all shadow-sm group-hover:shadow-lg">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                                                        <MapPin size={12} className="text-indigo-500" /> Destino
                                                    </label>
                                                    <div className="flex gap-4">
                                                        <PlaceAutocomplete
                                                            className="w-full bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none py-2 text-lg font-medium text-slate-800 placeholder:text-slate-300 transition-colors"
                                                            placeholder="Dirección de entrega"
                                                            onPlaceSelect={props.setDestination}
                                                        />
                                                        <button
                                                            onClick={() => props.setPickingLocation('destination')}
                                                            className={`p-3 rounded-full transition-all ${props.pickingLocation === 'destination' ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500'}`}
                                                        >
                                                            <MapPin size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {props.isStep1Valid && (
                                            <div className="flex justify-end pt-6">
                                                <button
                                                    onClick={() => props.setCurrentStep(2)}
                                                    className="group bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3"
                                                >
                                                    Continuar <ChevronRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2: Package */}
                                {props.currentStep === 2 && (
                                    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800">¿Qué envías?</h2>
                                            <p className="text-slate-500">Detalla tu paquete para calcular la tarifa exacta.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Peso (Kg)</label>
                                                <div className="flex items-baseline gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={props.weight}
                                                        onChange={(e) => props.setWeight(Number(e.target.value))}
                                                        className="w-full bg-transparent text-3xl font-bold text-slate-800 outline-none"
                                                    />
                                                    <span className="text-slate-400 font-medium">kg</span>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all md:col-span-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Descripción</label>
                                                <textarea
                                                    value={props.description}
                                                    onChange={(e) => props.setDescription(e.target.value)}
                                                    className="w-full bg-transparent text-lg font-medium text-slate-800 outline-none resize-none h-24 placeholder:text-slate-300"
                                                    placeholder="Ej. Documentos importantes, Electrónicos..."
                                                ></textarea>
                                            </div>
                                        </div>

                                        {props.isStep2Valid && (
                                            <div className="flex justify-end pt-6">
                                                <button
                                                    onClick={() => props.setCurrentStep(3)}
                                                    className="group bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3"
                                                >
                                                    Ver Precios <ChevronRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Service */}
                                {props.currentStep === 3 && (
                                    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800">Elige tu velocidad</h2>
                                            <p className="text-slate-500">Selecciona la opción que mejor se adapte a tu urgencia.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Standard Service */}
                                            <button
                                                onClick={() => props.setServiceLevel('standard')}
                                                className={`group relative p-6 rounded-3xl text-left border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden
                                                    ${props.serviceLevel === 'standard'
                                                        ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-100'
                                                        : 'border-slate-100 bg-white hover:border-blue-200'}
                                                `}
                                            >
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <Truck size={100} className="text-blue-900" />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className={`p-3 rounded-2xl ${props.serviceLevel === 'standard' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                            <Truck size={24} />
                                                        </div>
                                                        {props.serviceLevel === 'standard' && <CheckCircle className="text-blue-500 fill-blue-100" />}
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-800 mb-1">Estándar</h3>
                                                    <p className="text-slate-500 text-sm mb-4">La opción inteligente para envíos planificados.</p>
                                                    <div className="inline-block bg-slate-200/50 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                                                        1-2 Días Hábiles
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Express Service */}
                                            <button
                                                onClick={() => props.setServiceLevel('express')}
                                                className={`group relative p-6 rounded-3xl text-left border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden
                                                    ${props.serviceLevel === 'express'
                                                        ? 'border-orange-500 bg-orange-50/50 ring-4 ring-orange-100'
                                                        : 'border-slate-100 bg-white hover:border-orange-200'}
                                                `}
                                            >
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <Zap size={100} className="text-orange-900" />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className={`p-3 rounded-2xl ${props.serviceLevel === 'express' ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-100 text-slate-500'}`}>
                                                            <Zap size={24} className={props.serviceLevel === 'express' ? 'animate-pulse' : ''} />
                                                        </div>
                                                        {props.serviceLevel === 'express' && <CheckCircle className="text-orange-500 fill-orange-100" />}
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-800 mb-1">Express Plus</h3>
                                                    <p className="text-slate-500 text-sm mb-4">Máxima prioridad. Tu paquete en tiempo récord.</p>
                                                    <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                                                        ⚡ Entrega Hoy
                                                    </div>
                                                </div>
                                            </button>
                                        </div>

                                        {/* Total & Action */}
                                        <div className="mt-8 bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2" />

                                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                                                <div>
                                                    <p className="text-slate-400 font-medium text-sm uppercase tracking-widest mb-2">Total Estimado</p>
                                                    <div className="text-5xl font-bold mb-2 tracking-tight">{formatCurrency(props.quotePrice)}</div>
                                                    <div className="flex gap-4 text-sm text-slate-400">
                                                        <span className="flex items-center gap-1"><Navigation size={14} /> {props.distanceKm.toFixed(1)} km</span>
                                                        <span className="flex items-center gap-1"><Package size={14} /> {props.weight} kg</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => props.setShowModal(true)}
                                                    className="w-full md:w-auto bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg flex items-center justify-center gap-2"
                                                >
                                                    Solicitar Ahora <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Map Column */}
                        <div className="lg:col-span-5 h-[400px] lg:h-auto lg:sticky lg:top-8 order-first lg:order-last">
                            <div className={`h-[500px] rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-300
                                ${props.pickingLocation ? 'ring-4 ring-offset-4 ring-blue-500 shadow-blue-500/20' : 'ring-1 ring-slate-200'}
                            `}>
                                {props.pickingLocation && (
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 animate-bounce">
                                        <MapPin size={18} className="text-blue-400" />
                                        Toca el mapa para seleccionar
                                    </div>
                                )}

                                <DirectionsMap
                                    origin={props.origin}
                                    destination={props.destination}
                                    onDistanceCalculated={props.setDistanceKm}
                                    onMapClick={handleMapClick}
                                />

                                {/* Mini Quote Overlay */}
                                {props.quotePrice > 0 && props.currentStep < 3 && (
                                    <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Estimado</p>
                                            <p className="text-xl font-bold text-slate-900">{formatCurrency(props.quotePrice)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Distancia</p>
                                            <p className="text-sm font-bold text-slate-900">{props.distanceKm.toFixed(1)} km</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal */}
                <Modal isOpen={props.showModal} title="Confirmar Envío" onClose={() => props.setShowModal(false)}>
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-xl flex gap-4 items-start">
                            <ShieldCheck className="text-blue-600 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-blue-900">Seguro de Envío</h4>
                                <p className="text-sm text-blue-700/80">Todos nuestros envíos incluyen un seguro base contra daños y pérdidas.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Destinatario</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                                    value={props.recipientName}
                                    onChange={(e) => props.setRecipientName(e.target.value)}
                                    placeholder="Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
                                <input
                                    type="tel"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                                    value={props.recipientPhone}
                                    onChange={(e) => props.setRecipientPhone(e.target.value)}
                                    placeholder="55 1234 5678"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                                onClick={() => props.setShowModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all"
                                onClick={props.handleCreatePackage}
                                disabled={!props.recipientName || !props.recipientPhone}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
}
