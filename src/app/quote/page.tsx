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
import PinSelectionModal from '@/components/PinSelectionModal';
import CostBreakdownModal from '@/components/CostBreakdownModal';
import CustomSelect from '@/components/CustomSelect';
import { MapPin, Package, Zap, ChevronRight, CheckCircle, Navigation, Clock, ShieldCheck, Truck, Scale, Box, Repeat, Car, Info } from 'lucide-react';
import { calculateLogisticsCosts, Vehicle, Package as PackageType } from '@/lib/logistics';


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

    // Steps: 1 = LoadType, 2 = Route, 3 = Package, 4 = Service
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

    // Load Type
    const [loadType, setLoadType] = useState<'package' | 'full-truck' | 'van' | 'recurring' | ''>('');
    const [loadTypeDetails, setLoadTypeDetails] = useState<any>({});
    const [tempLoadType, setTempLoadType] = useState<string>(''); // For modal handling
    const [showLoadInfoModal, setShowLoadInfoModal] = useState(false);

    const [origin, setOrigin] = useState<LocationState | null>(null);
    const [destination, setDestination] = useState<LocationState | null>(null);

    // Package Details
    const [weight, setWeight] = useState<number | ''>('');
    const [dimensions, setDimensions] = useState({ length: 10, width: 10, height: 10 });
    const [description, setDescription] = useState('');
    const [packageType, setPackageType] = useState('Caja de cartón');
    const [packageDetails, setPackageDetails] = useState('');

    // Service Level
    const [serviceLevel, setServiceLevel] = useState<'standard' | 'express'>('standard');

    // Calculation State
    const [distanceKm, setDistanceKm] = useState(0);
    const [quotePrice, setQuotePrice] = useState(0);
    const [quoteDetails, setQuoteDetails] = useState<any>(null);
    const [calculated, setCalculated] = useState(false);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false); // Creating Package Modal
    const [showBreakdownModal, setShowBreakdownModal] = useState(false); // Cost Breakdown Modal

    // Pin Selection State
    const [showPinModal, setShowPinModal] = useState(false);
    const [tempLocation, setTempLocation] = useState<{ address: string, lat: number, lng: number } | null>(null);
    const [pinModalType, setPinModalType] = useState<'origin' | 'destination'>('origin');

    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');

    const [settings, setSettings] = useState<any>(null);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [declaredValue, setDeclaredValue] = useState<number>(1000);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const [sRes, vRes] = await Promise.all([
                    authenticatedFetch('/api/settings'),
                    authenticatedFetch('/api/vehicles')
                ]);
                if (sRes.ok) setSettings(await sRes.json());
                if (vRes.ok) setVehicles(await vRes.json());
            } catch (err) { console.error(err); }
        };
        fetchConfig();
    }, []);

    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    // Step Validation Logic
    const isLoadTypeValid = loadType !== '';
    const isRouteValid = !!origin && !!destination;
    const isPackageDetailsValid = (typeof weight === 'number' && weight > 0) && packageType !== '';

    const isStep1Valid = isLoadTypeValid;
    const isStep2Valid = isStep1Valid && isRouteValid;
    const isStep3Valid = isStep2Valid && isPackageDetailsValid;

    // Real-time calculation effect
    useEffect(() => {
        if (isRouteValid && typeof weight === 'number' && weight > 0 && settings) {
            const vehicleType = loadTypeDetails?.vehicleType || '';
            const selectedVehicle = vehicles.find(v => v.name === vehicleType) || vehicles[0];

            if (selectedVehicle) {
                const results = calculateLogisticsCosts(
                    { weight: Number(weight), declaredValue, distanceKm, loadType, packageType } as PackageType,
                    selectedVehicle as Vehicle,
                    settings,
                    serviceLevel
                );
                setQuoteDetails(results);
                setQuotePrice(results.priceToClient);
                setCalculated(true);
            }
        }
    }, [distanceKm, weight, dimensions, serviceLevel, isRouteValid, loadType, loadTypeDetails, settings, declaredValue, vehicles, packageType]);

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
                packageType,
                loadType,
                loadTypeDetails,
                distanceKm,
                declaredValue
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

    const handleAddressSelect = (location: LocationState, type: 'origin' | 'destination') => {
        setTempLocation(location);
        setPinModalType(type);
        setShowPinModal(true);
    };

    const handlePinConfirm = (location: LocationState) => {
        if (pinModalType === 'origin') {
            setOrigin(location);
        } else {
            setDestination(location);
        }
    };

    const handleRequestQuote = () => {
        if (!isStep3Valid) return;
        setShowBreakdownModal(true);
    };

    const handleConfirmBreakdown = () => {
        setShowBreakdownModal(false);
        setShowModal(true); // Open the recipient details modal
    };

    return (
        <APIProvider apiKey={API_KEY}>
            <QuoteContent
                setOrigin={setOrigin}
                setDestination={setDestination}
                origin={origin}
                destination={destination}
                weight={weight}
                setWeight={setWeight}
                dimensions={dimensions}
                setDimensions={setDimensions}
                description={description}
                setDescription={setDescription}
                packageType={packageType}
                setPackageType={setPackageType}
                packageDetails={packageDetails}
                setPackageDetails={setPackageDetails}
                serviceLevel={serviceLevel}
                setServiceLevel={setServiceLevel}
                loadType={loadType}
                setLoadType={setLoadType}
                loadTypeDetails={loadTypeDetails}
                setLoadTypeDetails={setLoadTypeDetails}
                showLoadInfoModal={showLoadInfoModal}
                setShowLoadInfoModal={setShowLoadInfoModal}
                tempLoadType={tempLoadType}
                setTempLoadType={setTempLoadType}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isStep1Valid={isStep1Valid}
                isStep2Valid={isStep2Valid}
                isStep3Valid={isStep3Valid}
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
                // New Props
                declaredValue={declaredValue}
                onDeclaredValueChange={setDeclaredValue}
                onAddressSelect={handleAddressSelect}
                onRequestQuote={handleRequestQuote}
                onOpenPinModal={(type: 'origin' | 'destination') => {
                    const loc = type === 'origin' ? origin : destination;
                    if (loc) {
                        setTempLocation(loc);
                        setPinModalType(type);
                        setShowPinModal(true);
                    } else {
                        // Default fallback if no address
                        setTempLocation({
                            address: 'CDMX',
                            lat: 19.4326,
                            lng: -99.1332
                        });
                        setPinModalType(type);
                        setShowPinModal(true);
                    }
                }}
            />

            <PinSelectionModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onConfirm={handlePinConfirm}
                initialLocation={tempLocation}
            />

            <CostBreakdownModal
                isOpen={showBreakdownModal}
                onClose={() => setShowBreakdownModal(false)}
                onConfirm={handleConfirmBreakdown}
                details={quoteDetails}
                totalPrice={quotePrice}
                distanceKm={distanceKm}
                weight={Number(weight) || 0}
                serviceLevel={serviceLevel}
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
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-400 to-amber-400">
                                Envío Ideal
                            </span>
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Obtén una cotización instantánea y programa tu recolección en minutos. Sin complicaciones.
                        </p>
                    </div>

                    <div className="flex flex-col gap-8 lg:gap-12 items-start max-w-4xl mx-auto">

                        {/* Main Interaction Area */}
                        <div className="w-full space-y-8">

                            {/* Modern Navigation Tabs */}
                            <div className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl shadow-sm border border-slate-200/60 sticky top-4 z-50">
                                <div className="flex relative">
                                    {[
                                        { id: 1, label: 'Tipo', icon: Box },
                                        { id: 2, label: 'Ruta', icon: Navigation },
                                        { id: 3, label: 'Paquete', icon: Package },
                                        { id: 4, label: 'Servicio', icon: Zap }
                                    ].map((step) => {
                                        const isActive = props.currentStep === step.id;
                                        const isCompleted = props.currentStep > step.id;

                                        // Validation logic for disabling next steps
                                        let isDisabled = false;
                                        if (step.id > props.currentStep) {
                                            if (step.id === 2 && !props.isStep1Valid) isDisabled = true;
                                            if (step.id === 3 && !props.isStep2Valid) isDisabled = true;
                                            if (step.id === 4 && !props.isStep3Valid) isDisabled = true;
                                        }

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
                            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-visible relative min-h-[500px] transition-all duration-500">

                                {/* Step 1: Load Type */}
                                {props.currentStep === 1 && (
                                    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-left-8 duration-500">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-800">¿Qué vas a transportar?</h2>
                                                <p className="text-slate-500">Selecciona el tipo de servicio que mejor se adapte a tus necesidades.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[
                                                { id: 'package', label: 'Paquetería (Pausado)', icon: Package, desc: 'Cajas, sobres y mercancía pequeña.', disabled: true },
                                                { id: 'full-truck', label: 'Camión Completo', icon: Truck, desc: 'Transporte dedicado de gran volumen.' },
                                                { id: 'van', label: 'Camioneta', icon: Car, desc: 'Mudanzas pequeñas y volumen medio.' },
                                                { id: 'recurring', label: 'Envíos Recurrentes', icon: Repeat, desc: 'Rutas programadas frecuentes.' }
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    disabled={type.disabled}
                                                    onClick={() => {
                                                        if (type.disabled) return;
                                                        if (type.id === 'package') {
                                                            props.setLoadType('package');
                                                            props.setLoadTypeDetails({});
                                                        } else {
                                                            props.setTempLoadType(type.id);
                                                            props.setShowLoadInfoModal(true);
                                                        }
                                                    }}
                                                    className={`group relative p-6 rounded-3xl text-left border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden
                                                        ${type.disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                                                        ${props.loadType === type.id
                                                            ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-100'
                                                            : 'border-slate-100 bg-white hover:border-blue-200'}
                                                    `}
                                                >
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className={`p-3 rounded-2xl ${props.loadType === type.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'} group-hover:scale-110 transition-transform duration-300`}>
                                                            <type.icon size={24} />
                                                        </div>
                                                        {props.loadType === type.id && <CheckCircle className="text-blue-500 fill-blue-100" />}
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-800 mb-1">{type.label}</h3>
                                                    <p className="text-slate-500 text-sm">{type.desc}</p>
                                                    {props.loadType === type.id && props.loadType !== 'package' && props.loadTypeDetails && (
                                                        <div className="mt-3 py-1 px-3 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold inline-block">
                                                            {props.loadTypeDetails.vehicleType || props.loadTypeDetails.frequency || 'Detalles configurados'}
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
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

                                {/* Step 2: Route */}
                                {props.currentStep === 2 && (
                                    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-left-8 duration-500">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-800">¿A dónde vamos?</h2>
                                                <p className="text-slate-500">Define los puntos de recolección y entrega.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Origin Input */}
                                            <div className={`group relative p-1 rounded-2xl transition-all duration-300 bg-transparent`}>
                                                <div className="bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-200 group-hover:border-[#1f4a5e] transition-all shadow-sm group-hover:shadow-lg">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                                                        <Navigation size={12} className="text-[#1f4a5e]" /> Origen
                                                    </label>
                                                    <div className="flex gap-4">
                                                        <PlaceAutocomplete
                                                            className="w-full bg-transparent border-b-2 border-slate-200 focus:border-blue-500 outline-none py-2 text-lg font-medium text-slate-800 placeholder:text-slate-300 transition-colors"
                                                            placeholder="Dirección de recolección"
                                                            onPlaceSelect={(loc: any) => props.onAddressSelect(loc, 'origin')}
                                                            defaultValue={props.origin?.address}
                                                        />
                                                        <button
                                                            onClick={() => props.onOpenPinModal('origin')}
                                                            className={`p-3 rounded-full transition-all bg-slate-100 text-slate-400 hover:bg-[#1f4a5e] hover:text-white`}
                                                            title="Ajustar ubicación en el mapa"
                                                        >
                                                            <MapPin size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Destination Input */}
                                            <div className={`group relative p-1 rounded-2xl transition-all duration-300 bg-transparent`}>
                                                <div className="bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-200 group-hover:border-[#d9bd82] transition-all shadow-sm group-hover:shadow-lg">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                                                        <MapPin size={12} className="text-[#d9bd82]" /> Destino
                                                    </label>
                                                    <div className="flex gap-4">
                                                        <PlaceAutocomplete
                                                            className="w-full bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none py-2 text-lg font-medium text-slate-800 placeholder:text-slate-300 transition-colors"
                                                            placeholder="Dirección de entrega"
                                                            onPlaceSelect={(loc: any) => props.onAddressSelect(loc, 'destination')}
                                                            defaultValue={props.destination?.address}
                                                        />
                                                        <button
                                                            onClick={() => props.onOpenPinModal('destination')}
                                                            className={`p-3 rounded-full transition-all bg-slate-100 text-slate-400 hover:bg-[#1f4a5e] hover:text-white`}
                                                            title="Ajustar ubicación en el mapa"
                                                        >
                                                            <MapPin size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {props.isStep2Valid && (
                                            <div className="flex justify-end pt-6">
                                                <button
                                                    onClick={() => props.setCurrentStep(3)}
                                                    className="group bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3"
                                                >
                                                    Continuar <ChevronRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Package */}
                                {props.currentStep === 3 && (
                                    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800">¿Qué envías?</h2>
                                            <p className="text-slate-500">Detalla tu paquete para calcular la tarifa exacta.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                            {/* Vehicle Info for Non-Package types */}
                                            {(props.loadType === 'full-truck' || props.loadType === 'van') && (
                                                <div className="md:col-span-2 bg-blue-50 border border-blue-200 p-6 rounded-2xl flex items-center gap-4">
                                                    <div className="p-3 bg-blue-500 text-white rounded-xl">
                                                        {props.loadType === 'full-truck' ? <Truck size={24} /> : <Car size={24} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-blue-900">Vehículo Seleccionado</h4>
                                                        <p className="text-blue-700">{props.loadTypeDetails?.vehicleType || 'Vehículo estándar'}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                                    {(props.loadType === 'full-truck' || props.loadType === 'van') ? 'Peso Estimado Carga' : 'Peso (Kg)'}
                                                </label>
                                                <div className="flex items-baseline gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={props.weight}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            props.setWeight(val === '' ? '' : Number(val));
                                                        }}
                                                        placeholder="0"
                                                        className="w-full bg-transparent text-3xl font-bold text-slate-800 outline-none"
                                                    />
                                                    <span className="text-slate-400 font-medium">kg</span>
                                                </div>
                                            </div>

                                            {/* Dimensions - Only for Package or Recurring */}
                                            {(props.loadType === 'package' || props.loadType === 'recurring' || !props.loadType) && (
                                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all md:col-span-2 space-y-4">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dimensiones (cm)</label>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Largo</label>
                                                            <input
                                                                type="number"
                                                                value={props.dimensions?.length || ''}
                                                                onChange={(e) => {
                                                                    props.setDimensions((prev: any) => ({ ...prev, length: Number(e.target.value) }));
                                                                    props.setPackageDetails(''); // Reset preset
                                                                }}
                                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold outline-none focus:border-blue-500 transition-all"
                                                                placeholder="10"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Ancho</label>
                                                            <input
                                                                type="number"
                                                                value={props.dimensions?.width || ''}
                                                                onChange={(e) => {
                                                                    props.setDimensions((prev: any) => ({ ...prev, width: Number(e.target.value) }));
                                                                    props.setPackageDetails('');
                                                                }}
                                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold outline-none focus:border-blue-500 transition-all"
                                                                placeholder="10"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Alto</label>
                                                            <input
                                                                type="number"
                                                                value={props.dimensions?.height || ''}
                                                                onChange={(e) => {
                                                                    props.setDimensions((prev: any) => ({ ...prev, height: Number(e.target.value) }));
                                                                    props.setPackageDetails('');
                                                                }}
                                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold outline-none focus:border-blue-500 transition-all"
                                                                placeholder="10"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-green-500 focus-within:bg-white transition-all">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Valor Declarado (Seguro)</label>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-slate-400 font-medium">$</span>
                                                    <input
                                                        type="number"
                                                        value={props.declaredValue || ''}
                                                        onChange={(e) => props.onDeclaredValueChange(Number(e.target.value))}
                                                        placeholder="1000"
                                                        className="w-full bg-transparent text-3xl font-bold text-slate-800 outline-none"
                                                    />
                                                    <span className="text-slate-400 font-medium">MXN</span>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all md:col-span-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Descripción (Opcional)</label>
                                                <textarea
                                                    value={props.description}
                                                    onChange={(e) => props.setDescription(e.target.value)}
                                                    className="w-full bg-transparent text-lg font-medium text-slate-800 outline-none resize-none h-24 placeholder:text-slate-300"
                                                    placeholder="Ej. Documentos importantes, Electrónicos..."
                                                ></textarea>
                                            </div>

                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all md:col-span-2 space-y-4">
                                                <div>
                                                    <CustomSelect
                                                        label="Tipo de Carga/Paquete"
                                                        value={props.packageType}
                                                        onChange={(val) => {
                                                            props.setPackageType(val);
                                                            props.setPackageDetails(''); // Reset details on type change
                                                        }}
                                                        options={
                                                            props.loadType === 'package' ? [
                                                                { value: 'Caja de cartón', label: 'Caja de cartón' },
                                                                { value: 'Sobre / Documentos', label: 'Sobre / Documentos' },
                                                                { value: 'Tarima', label: 'Tarima' },
                                                                { value: 'Bolsa', label: 'Bolsa' },
                                                                { value: 'Muebles', label: 'Muebles' },
                                                                { value: 'Otro', label: 'Otro' }
                                                            ] : [
                                                                { value: 'Paletizado / Tarimas', label: 'Paletizado / Tarimas' },
                                                                { value: 'Granel', label: 'Granel (Bulk)' },
                                                                { value: 'Maquinaria', label: 'Maquinaria' },
                                                                { value: 'Productos Químicos', label: 'Productos Químicos' },
                                                                { value: 'Perecederos', label: 'Perecederos / Refrigerados' },
                                                                { value: 'Muebles / Mudanza', label: 'Muebles / Mudanza' },
                                                                { value: 'Otro', label: 'Otro' }
                                                            ]
                                                        }
                                                    />
                                                </div>

                                                {/* Dynamic Sub-options based on type */}
                                                {props.packageType === 'Caja de cartón' && (
                                                    <div className="animate-in fade-in slide-in-from-top-2">
                                                        <CustomSelect
                                                            label="Tamaño de Caja (Opcional)"
                                                            value={props.packageDetails}
                                                            onChange={(val) => {
                                                                props.setPackageDetails(val);
                                                                // Set standard dimensions based on selection
                                                                if (val.includes('Chica')) props.setDimensions({ length: 20, width: 20, height: 20 });
                                                                if (val.includes('Mediana')) props.setDimensions({ length: 40, width: 30, height: 30 });
                                                                if (val.includes('Grande')) props.setDimensions({ length: 50, width: 50, height: 50 });
                                                                if (val.includes('Extra Grande')) props.setDimensions({ length: 70, width: 60, height: 50 });
                                                            }}
                                                            placeholder="Selecciona un tamaño estándar..."
                                                            options={[
                                                                { value: 'Chica (20x20x20)', label: 'Chica (20x20x20 cm)' },
                                                                { value: 'Mediana (40x30x30)', label: 'Mediana (40x30x30 cm)' },
                                                                { value: 'Grande (50x50x50)', label: 'Grande (50x50x50 cm)' },
                                                                { value: 'Extra Grande (70x60x50)', label: 'Extra Grande (70x60x50 cm)' },
                                                            ]}
                                                        />
                                                    </div>
                                                )}

                                                {props.packageType === 'Tarima' && (
                                                    <div className="animate-in fade-in slide-in-from-top-2">
                                                        <CustomSelect
                                                            label="Tipo de Tarima (Opcional)"
                                                            value={props.packageDetails}
                                                            onChange={(val) => {
                                                                props.setPackageDetails(val);
                                                                if (val.includes('Americana')) props.setDimensions({ length: 120, width: 100, height: 15 });
                                                                if (val.includes('Europea')) props.setDimensions({ length: 120, width: 80, height: 15 });
                                                            }}
                                                            placeholder="Especifica el tipo..."
                                                            options={[
                                                                { value: 'Estándar Americana', label: 'Estándar Americana (1.0x1.2m)' },
                                                                { value: 'Europea', label: 'Europea (0.8x1.2m)' },
                                                                { value: 'Plástico', label: 'Plástico' },
                                                            ]}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {props.isStep3Valid && (
                                            <div className="flex justify-end pt-6">
                                                <button
                                                    onClick={() => props.setCurrentStep(4)}
                                                    className="group bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3"
                                                >
                                                    Ver Precios <ChevronRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 4: Service */}
                                {props.currentStep === 4 && (
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
                                                        ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-100'
                                                        : 'border-slate-100 bg-white hover:border-blue-200'}
                                                `}
                                            >
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <Zap size={100} className="text-blue-600" />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className={`p-3 rounded-2xl ${props.serviceLevel === 'express' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                            <Zap size={24} />
                                                        </div>
                                                        {props.serviceLevel === 'express' && <CheckCircle className="text-blue-600 fill-blue-100" />}
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-xl font-bold text-slate-800">Express</h3>
                                                        <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Popular</span>
                                                    </div>
                                                    <p className="text-slate-500 text-sm mb-4">Máxima prioridad para tus entregas críticas.</p>
                                                    <div className="inline-block bg-blue-100 px-3 py-1 rounded-full text-xs font-bold text-blue-600">
                                                        Mismo Día / 24 hrs
                                                    </div>
                                                </div>
                                            </button>
                                        </div>

                                        {props.quotePrice > 0 && (
                                            <div className="bg-[#1f4a5e] p-8 rounded-3xl text-white shadow-2xl shadow-blue-200 relative overflow-hidden animate-in zoom-in duration-500">
                                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                                    <ShieldCheck size={120} />
                                                </div>
                                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                                    <div>
                                                        <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-1">Total Estimado</p>
                                                        <div className="flex items-baseline gap-2">
                                                            <h2 className="text-5xl font-black">{formatCurrency(props.quotePrice)}</h2>
                                                            <span className="text-blue-200 font-bold">MXN</span>
                                                        </div>
                                                        <p className="text-blue-200/60 text-xs mt-2 flex items-center gap-1">
                                                            <Clock size={12} /> Incluye IVA y seguro de mercancía.
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col gap-3 w-full md:w-auto">
                                                        <button
                                                            onClick={props.onRequestQuote}
                                                            className="bg-white text-blue-900 hover:bg-blue-50 px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
                                                        >
                                                            Solicitar Ahora
                                                        </button>
                                                        <button
                                                            onClick={() => props.setCurrentStep(3)}
                                                            className="text-blue-100 hover:text-white text-sm font-bold transition-colors"
                                                        >
                                                            Ajustar detalles
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Map Preview area */}
                        <div className="w-full lg:sticky lg:top-24 h-[400px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                            <DirectionsMap
                                origin={props.origin ? { lat: props.origin.lat, lng: props.origin.lng } : null}
                                destination={props.destination ? { lat: props.destination.lat, lng: props.destination.lng } : null}
                                onDistanceChange={props.setDistanceKm}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Modal for Recipient Contact */}
            <Modal
                isOpen={props.showModal}
                onClose={() => props.setShowModal(false)}
                title="Datos de Contacto"
            >
                <div className="space-y-6 p-2">
                    <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
                            <Info size={20} />
                        </div>
                        <p className="text-sm text-amber-800">Necesitamos los datos de quién recibe para coordinar la entrega final.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="input-group">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nombre del Destinatario</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={props.recipientName}
                                onChange={(e) => props.setRecipientName(e.target.value)}
                                placeholder="Ej. Juan Pérez"
                            />
                        </div>
                        <div className="input-group">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Teléfono de Contacto</label>
                            <input
                                type="tel"
                                className="input w-full"
                                value={props.recipientPhone}
                                onChange={(e) => props.setRecipientPhone(e.target.value)}
                                placeholder="55 1234 5678"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            className="btn btn-secondary flex-1 py-4"
                            onClick={() => props.setShowModal(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary flex-1 py-4 shadow-xl shadow-blue-100"
                            onClick={props.handleCreatePackage}
                            disabled={!props.recipientName || !props.recipientPhone || props.loading}
                        >
                            {props.loading ? 'Procesando...' : 'Confirmar Envío'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Load Type Info Modal */}
            <Modal
                isOpen={props.showLoadInfoModal}
                onClose={() => props.setShowLoadInfoModal(false)}
                title="Configura tu servicio"
            >
                <div className="space-y-6">
                    {props.tempLoadType === 'full-truck' && (
                        <div className="space-y-4">
                            <p className="text-slate-500">Selecciona el tipo de unidad que requieres para tu carga completa:</p>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'Torton', label: 'Torton (14 Tons)', desc: 'Ideal para carga pesada urbana y carretera.' },
                                    { id: 'Trailer', label: 'Tráiler (25-30 Tons)', desc: 'Máxima capacidad para rutas largas.' },
                                    { id: 'Plataforma', label: 'Plataforma', desc: 'Para materiales de construcción o maquinaria.' }
                                ].map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => {
                                            props.setLoadType('full-truck');
                                            props.setLoadTypeDetails({ vehicleType: v.id });
                                            props.setShowLoadInfoModal(false);
                                        }}
                                        className="p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 text-left transition-all"
                                    >
                                        <h4 className="font-bold text-slate-800">{v.label}</h4>
                                        <p className="text-xs text-slate-500">{v.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {props.tempLoadType === 'van' && (
                        <div className="space-y-4">
                            <p className="text-slate-500">Selecciona el tamaño de la unidad:</p>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'Nissan NPM', label: 'Camioneta 1.5 Tons', desc: 'Ágil para zonas urbanas restringidas.' },
                                    { id: 'Van 3.5', label: 'Camioneta 3.5 Tons', desc: 'Equilibrio perfecto volumen/peso.' }
                                ].map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => {
                                            props.setLoadType('van');
                                            props.setLoadTypeDetails({ vehicleType: v.id });
                                            props.setShowLoadInfoModal(false);
                                        }}
                                        className="p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 text-left transition-all"
                                    >
                                        <h4 className="font-bold text-slate-800">{v.label}</h4>
                                        <p className="text-xs text-slate-500">{v.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {props.tempLoadType === 'recurring' && (
                        <div className="space-y-4">
                            <p className="text-slate-500">Frecuencia estimada de envíos:</p>
                            <div className="grid grid-cols-1 gap-3">
                                {['Diario', 'Semanal', 'Mensual'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => {
                                            props.setLoadType('recurring');
                                            props.setLoadTypeDetails({ frequency: f });
                                            props.setShowLoadInfoModal(false);
                                        }}
                                        className="p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 text-left transition-all"
                                    >
                                        <h4 className="font-bold text-slate-800">{f}</h4>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
