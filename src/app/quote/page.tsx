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
import { MapPin, Package, Zap, ChevronRight, CheckCircle, Navigation, Clock, ShieldCheck, Truck, Scale, Box, Repeat, Car, Info, Edit } from 'lucide-react';
import { calculateLogisticsCosts, Vehicle, Package as PackageType, VEHICLE_TYPES, VEHICLE_CATEGORIES, isVehicleSuitable } from '@/lib/logistics';


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

    // Steps: 1 = Package, 2 = Vehicle, 3 = Route, 4 = Service
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

    // Load Type / Context
    const [loadType, setLoadType] = useState('full-truck');
    const [loadTypeDetails, setLoadTypeDetails] = useState<any>({});
    const [tempLoadType, setTempLoadType] = useState<string>('');
    const [showLoadInfoModal, setShowLoadInfoModal] = useState(false);

    const [origin, setOrigin] = useState<LocationState | null>(null);
    const [destination, setDestination] = useState<LocationState | null>(null);

    // Package Details
    const [weight, setWeight] = useState<number | ''>('');
    const [dimensions, setDimensions] = useState({ length: 1, width: 1, height: 1 });
    const [description, setDescription] = useState('');
    const [packageType, setPackageType] = useState('Caja de cartón');
    const [declaredValue, setDeclaredValue] = useState<number>(1000);

    // Service Level
    const [serviceLevel, setServiceLevel] = useState<'standard' | 'express'>('standard');

    // Calculation & Selection State
    const [selectedVehicleType, setSelectedVehicleType] = useState<string>('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [calculated, setCalculated] = useState(false);
    const [showBreakdownModal, setShowBreakdownModal] = useState(false);
    const [packageDetails, setPackageDetails] = useState<any>(null);

    const [distanceKm, setDistanceKm] = useState(0);
    const [quotePrice, setQuotePrice] = useState(0);
    const [quoteDetails, setQuoteDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false); // Creating Package Modal

    // Pin Selection State
    const [showPinModal, setShowPinModal] = useState(false);
    const [tempLocation, setTempLocation] = useState<{ address: string, lat: number, lng: number } | null>(null);
    const [pinModalType, setPinModalType] = useState<'origin' | 'destination'>('origin');

    const [settings, setSettings] = useState<any>(null);
    const [vehicles, setVehicles] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
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
    }, [user]);

    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    useEffect(() => {
        if (settings && selectedVehicleType) {
            import('@/lib/logistics').then(({ VEHICLE_TYPES }) => {
                const vehicleDef = VEHICLE_TYPES.find(v => v.id === selectedVehicleType);
                const dbVehicle = vehicles.find(v => v.id === selectedVehicleType || v.name === selectedVehicleType);
                const v = vehicleDef || dbVehicle;

                if (v) {
                    if (v.fuelEfficiency) setFuelEfficiency(v.fuelEfficiency);
                    if (v.fuelType && settings.fuelPrices) {
                        const price = (settings.fuelPrices as any)[v.fuelType];
                        if (price) setFuelPrice(price);
                    }
                }
            });
        }
    }, [selectedVehicleType, settings, vehicles]);

    // Update validation logic
    const isPackageDetailsValid = !!weight && Number(weight) > 0 && !!packageType;
    const isVehicleSelectedValid = !!selectedVehicleType;
    const isRouteValid = !!origin && !!destination;

    const isStep1Valid = isPackageDetailsValid;
    const isStep2Valid = isStep1Valid && isVehicleSelectedValid;
    const isStep3Valid = isStep2Valid && isRouteValid;
    const isStep4Valid = isStep3Valid;

    // Fuel & Operation
    const [fuelPrice, setFuelPrice] = useState<number>(25);
    const [fuelEfficiency, setFuelEfficiency] = useState<number>(2);
    const [tolls, setTolls] = useState<number>(0);
    const [travelDays, setTravelDays] = useState<number>(1);

    // Personnel
    const [driverSalary, setDriverSalary] = useState<number>(0);
    const [driverCommission, setDriverCommission] = useState<number>(0);
    const [assistantSalary, setAssistantSalary] = useState<number>(0);
    const [assistantCommission, setAssistantCommission] = useState<number>(0);

    // Extras
    const [food, setFood] = useState<number>(0);
    const [lodging, setLodging] = useState<number>(0);
    const [unforeseenPercent, setUnforeseenPercent] = useState<number>(5);
    const [otherExpenses, setOtherExpenses] = useState<number>(0);

    // Admin
    const [seller, setSeller] = useState('');
    const [clientName, setClientName] = useState('');
    const [folio, setFolio] = useState('');

    // Real-time calculation effect
    useEffect(() => {
        if (isRouteValid && !!weight && Number(weight) > 0 && settings) {
            // Priority: selected vehicle from the new list, then DB vehicles, then fallback
            import('@/lib/logistics').then(({ VEHICLE_TYPES }) => {
                const vehicleDef = VEHICLE_TYPES.find(v => v.id === selectedVehicleType);
                const dbVehicle = vehicles.find(v => v.id === selectedVehicleType || v.name === selectedVehicleType);

                const vehicleToUse = vehicleDef || dbVehicle || {
                    costPerKm: 18.5,
                    value: 2500000,
                    usefulLifeKm: 800000,
                    suspensionType: 'Neumática',
                    capacity: 25000
                };

                const results = calculateLogisticsCosts(
                    {
                        weight: Number(weight),
                        declaredValue,
                        distanceKm,
                        loadType,
                        packageType,
                        fuelPrice,
                        fuelEfficiency,
                        tolls,
                        driverSalary,
                        driverCommission,
                        assistantSalary,
                        assistantCommission,
                        food,
                        lodging,
                        travelDays,
                        unforeseenPercent,
                        otherExpenses,
                        seller,
                        clientName,
                        folio
                    } as PackageType,
                    vehicleToUse as Vehicle,
                    settings,
                    serviceLevel
                );
                setQuoteDetails(results);
                setQuotePrice(results.priceToClient);
                setCalculated(true);
            });
        }
    }, [distanceKm, weight, dimensions, serviceLevel, isRouteValid, selectedVehicleType, settings, declaredValue, vehicles, packageType, fuelPrice, fuelEfficiency, tolls, driverSalary, driverCommission, assistantSalary, assistantCommission, food, lodging, travelDays, unforeseenPercent, otherExpenses]);

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
                declaredValue,
                // Advanced Operational Fields
                fuelPrice,
                fuelEfficiency,
                tolls,
                travelDays,
                driverSalary,
                driverCommission,
                assistantSalary,
                assistantCommission,
                food,
                lodging,
                unforeseenPercent,
                otherExpenses,
                seller,
                clientName,
                folio,
                quoteDetails // Include the full breakdown for history
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
                onAddressSelect={handleAddressSelect}
                vehicles={vehicles}
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
                selectedVehicleType={selectedVehicleType}
                setSelectedVehicleType={setSelectedVehicleType}
                distanceKm={distanceKm}
                setDistanceKm={setDistanceKm}
                quoteDetails={quoteDetails}
                quotePrice={quotePrice}
                handleCreatePackage={handleCreatePackage}
                onRequestQuote={handleRequestQuote}
                showModal={showModal}
                setShowModal={setShowModal}
                recipientName={recipientName}
                setRecipientName={setRecipientName}
                recipientPhone={recipientPhone}
                setRecipientPhone={setRecipientPhone}
                declaredValue={declaredValue}
                setDeclaredValue={setDeclaredValue}
                // Advanced State Props
                fuelPrice={fuelPrice} setFuelPrice={setFuelPrice}
                fuelEfficiency={fuelEfficiency} setFuelEfficiency={setFuelEfficiency}
                tolls={tolls} setTolls={setTolls}
                travelDays={travelDays} setTravelDays={setTravelDays}
                driverSalary={driverSalary} setDriverSalary={setDriverSalary}
                driverCommission={driverCommission} setDriverCommission={setDriverCommission}
                assistantSalary={assistantSalary} setAssistantSalary={setAssistantSalary}
                assistantCommission={assistantCommission} setAssistantCommission={setAssistantCommission}
                food={food} setFood={setFood}
                lodging={lodging} setLodging={setLodging}
                unforeseenPercent={unforeseenPercent} setUnforeseenPercent={setUnforeseenPercent}
                otherExpenses={otherExpenses} setOtherExpenses={setOtherExpenses}
                seller={seller} setSeller={setSeller}
                clientName={clientName} setClientName={setClientName}
                folio={folio} setFolio={setFolio}
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
                                        { id: 1, label: 'Paquete', icon: Box },
                                        { id: 2, label: 'Unidad', icon: Truck },
                                        { id: 3, label: 'Ruta', icon: Navigation },
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
                                                className={`flex-1 relative flex items-center justify-center gap-2 py-3 px-3 md:px-4 rounded-xl text-sm font-semibold transition-all duration-300
                                                    ${isActive ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                                                    ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                                                `}
                                            >
                                                <step.icon size={18} className={isActive ? 'text-blue-500' : isCompleted ? 'text-green-500' : 'text-slate-400'} />
                                                <span className="hidden sm:inline">{step.label}</span>
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

                                {/* Step 1: Package Details */}
                                {props.currentStep === 1 && (
                                    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800">¿Qué vas a enviar?</h2>
                                            <p className="text-slate-500">Define las características de tu carga para proponerte las mejores unidades.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Peso Estimado Carga</label>
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

                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-green-500 focus-within:bg-white transition-all">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Valor Declarado (Seguro)</label>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-slate-400 font-medium">$</span>
                                                    <input
                                                        type="number"
                                                        value={props.declaredValue || ''}
                                                        onChange={(e) => props.setDeclaredValue(Number(e.target.value))}
                                                        placeholder="1000"
                                                        className="w-full bg-transparent text-3xl font-bold text-slate-800 outline-none"
                                                    />
                                                    <span className="text-slate-400 font-medium">MXN</span>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all md:col-span-2 space-y-4">
                                                <div>
                                                    <CustomSelect
                                                        label="Naturaleza del Producto"
                                                        value={props.packageType}
                                                        onChange={(val) => props.setPackageType(val)}
                                                        options={[
                                                            { value: 'Paletizado / Tarimas', label: 'Paletizado / Tarimas' },
                                                            { value: 'Granel', label: 'Granel (Bulk)' },
                                                            { value: 'Maquinaria', label: 'Maquinaria' },
                                                            { value: 'Productos Químicos', label: 'Productos Químicos' },
                                                            { value: 'Perecederos', label: 'Perecederos / Refrigerados' },
                                                            { value: 'Muebles / Mudanza', label: 'Muebles / Mudanza' },
                                                            { value: 'Otro', label: 'Otro' }
                                                        ]}
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all md:col-span-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Descripción de la Mercancía</label>
                                                <textarea
                                                    value={props.description}
                                                    onChange={(e) => props.setDescription(e.target.value)}
                                                    className="w-full bg-transparent text-lg font-medium text-slate-800 outline-none resize-none h-24 placeholder:text-slate-300"
                                                    placeholder="Ej. Tubería de acero, Grasa industrial, etc..."
                                                ></textarea>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-6">
                                            <button
                                                disabled={!props.isStep1Valid}
                                                onClick={() => props.setCurrentStep(2)}
                                                className={`group bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3
                                                    ${!props.isStep1Valid ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                                `}
                                            >
                                                Seleccionar Unidad <ChevronRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Vehicle Selection */}
                                {props.currentStep === 2 && (
                                    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800">Selecciona tu Unidad</h2>
                                            <p className="text-slate-500">Unidades propuestas según el peso ({props.weight} kg) y tipo de carga.</p>
                                        </div>

                                        <div className="space-y-10">
                                            {Object.values(VEHICLE_CATEGORIES).map((category) => {
                                                const allVehicles = [...VEHICLE_TYPES, ...props.vehicles];
                                                const categoryVehicles = allVehicles.filter(v => v.category === category);
                                                return (
                                                    <div key={category} className="space-y-4">
                                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                                            <div className="h-px bg-slate-200 flex-1" />
                                                            {category}
                                                            <div className="h-px bg-slate-200 flex-1" />
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {categoryVehicles.map((vehicle) => {
                                                                const isSuitable = isVehicleSuitable(vehicle, { weight: Number(props.weight), packageType: props.packageType } as any);
                                                                const isSelected = props.selectedVehicleType === vehicle.id;

                                                                return (
                                                                    <button
                                                                        key={vehicle.id}
                                                                        disabled={!isSuitable}
                                                                        onClick={() => props.setSelectedVehicleType(vehicle.id)}
                                                                        className={`relative p-5 rounded-2xl text-left border-2 transition-all duration-300 group
                                                                            ${isSelected
                                                                                ? 'border-blue-500 bg-blue-50/50 shadow-md ring-4 ring-blue-100'
                                                                                : isSuitable
                                                                                    ? 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-lg'
                                                                                    : 'border-slate-50 bg-slate-50/30 opacity-60 grayscale cursor-not-allowed'}
                                                                        `}
                                                                    >
                                                                        <div className="flex justify-between items-start mb-3">
                                                                            <div className={`p-2.5 rounded-xl transition-colors ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100'}`}>
                                                                                <Truck size={20} />
                                                                            </div>
                                                                            {isSelected && <CheckCircle size={20} className="text-blue-500" />}
                                                                            {!isSuitable && !isSelected && (
                                                                                <div className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                                                                                    No recomendado
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <h4 className="font-bold text-slate-800 mb-1">{vehicle.name}</h4>
                                                                        <p className="text-xs text-slate-500 leading-relaxed mb-3">{vehicle.description}</p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {vehicle.uses?.map((use: string) => (
                                                                                <span key={use} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-medium">#{use}</span>
                                                                            ))}
                                                                        </div>
                                                                        <div className="mt-3 pt-3 border-t border-slate-100/50 flex justify-between items-center">
                                                                            <span className="text-[10px] font-bold text-blue-600">Capacidad: {(vehicle.capacity / 1000).toFixed(1)}T</span>
                                                                            {vehicle.dimensions && (
                                                                                <span className="text-[10px] text-slate-400">{vehicle.dimensions.l}x{vehicle.dimensions.w}m</span>
                                                                            )}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex justify-between pt-6">
                                            <button
                                                onClick={() => props.setCurrentStep(1)}
                                                className="px-6 py-4 text-slate-500 font-bold hover:text-slate-800 transition-colors"
                                            >
                                                Atrás
                                            </button>
                                            <button
                                                disabled={!props.isStep2Valid}
                                                onClick={() => props.setCurrentStep(3)}
                                                className={`group bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3
                                                    ${!props.isStep2Valid ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                                `}
                                            >
                                                Continuar a Ruta <ChevronRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Route */}
                                {props.currentStep === 3 && (
                                    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-left-8 duration-500">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-800">¿A dónde vamos?</h2>
                                                <p className="text-slate-500">Define los puntos de recolección y entrega para la unidad seleccionada.</p>
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

                                        {/* Advanced Operational Details Section (Moved inside Step 3 for flow) */}
                                        <div className="space-y-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <Info size={18} className="text-blue-500" /> Detalle Operativo (Avanzado)
                                            </h3>

                                            {/* Admin Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Folio</label>
                                                    <input type="text" value={props.folio} onChange={(e) => props.setFolio(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="0000" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Cliente</label>
                                                    <input type="text" value={props.clientName} onChange={(e) => props.setClientName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Nombre del cliente" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Vendedor</label>
                                                    <input type="text" value={props.seller} onChange={(e) => props.setSeller(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Nombre vendedor" />
                                                </div>
                                            </div>

                                            {/* Fuel & Efficiency */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Precio Combustible</label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-400 text-sm">$</span>
                                                        <input type="number" value={props.fuelPrice} onChange={(e) => props.setFuelPrice(Number(e.target.value))} className="w-full font-bold text-slate-700 outline-none" />
                                                    </div>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Rendimiento (km/L)</label>
                                                    <input type="number" value={props.fuelEfficiency} onChange={(e) => props.setFuelEfficiency(Number(e.target.value))} className="w-full font-bold text-slate-700 outline-none" />
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Días de Viaje</label>
                                                    <input type="number" value={props.travelDays} onChange={(e) => props.setTravelDays(Number(e.target.value))} className="w-full font-bold text-slate-700 outline-none" />
                                                </div>
                                            </div>

                                            {/* Personnel */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-4">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase border-b pb-2">Chofer</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Sueldo Diario</label>
                                                            <input type="number" value={props.driverSalary} onChange={(e) => props.setDriverSalary(Number(e.target.value))} className="w-full bg-white border rounded p-1 text-sm outline-none" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Comisión</label>
                                                            <input type="number" value={props.driverCommission} onChange={(e) => props.setDriverCommission(Number(e.target.value))} className="w-full bg-white border rounded p-1 text-sm outline-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase border-b pb-2">Ayudante</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Sueldo Diario</label>
                                                            <input type="number" value={props.assistantSalary} onChange={(e) => props.setAssistantSalary(Number(e.target.value))} className="w-full bg-white border rounded p-1 text-sm outline-none" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Comisión</label>
                                                            <input type="number" value={props.assistantCommission} onChange={(e) => props.setAssistantCommission(Number(e.target.value))} className="w-full bg-white border rounded p-1 text-sm outline-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expenses */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Casetas</label>
                                                    <input type="number" value={props.tolls} onChange={(e) => props.setTolls(Number(e.target.value))} className="w-full text-sm font-bold outline-none" />
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Comidas</label>
                                                    <input type="number" value={props.food} onChange={(e) => props.setFood(Number(e.target.value))} className="w-full text-sm font-bold outline-none" />
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Hospedaje</label>
                                                    <input type="number" value={props.lodging} onChange={(e) => props.setLodging(Number(e.target.value))} className="w-full text-sm font-bold outline-none" />
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Imponderables (%)</label>
                                                    <input type="number" value={props.unforeseenPercent} onChange={(e) => props.setUnforeseenPercent(Number(e.target.value))} className="w-full text-sm font-bold outline-none" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between pt-6">
                                            <button
                                                onClick={() => props.setCurrentStep(2)}
                                                className="px-6 py-4 text-slate-500 font-bold hover:text-slate-800 transition-colors"
                                            >
                                                Atrás
                                            </button>
                                            <button
                                                disabled={!props.isStep3Valid}
                                                onClick={() => props.setCurrentStep(4)}
                                                className={`group bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3
                                                    ${!props.isStep3Valid ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                                `}
                                            >
                                                Ver Precios y Servicio <ChevronRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                            </button>
                                        </div>
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
                                            <div className="bg-[#1f4a5e] p-8 lg:p-10 rounded-3xl text-white shadow-2xl shadow-blue-200 relative overflow-hidden animate-in zoom-in duration-500 border-4 border-white/10">
                                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                                    <ShieldCheck size={140} />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-8">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                    <Scale size={16} /> Total Estimado
                                                                </p>
                                                                <div className="flex items-baseline gap-3">
                                                                    <h2 className="text-6xl font-black tracking-tight">{formatCurrency(props.quotePrice)}</h2>
                                                                    <span className="text-blue-200 text-xl font-bold">MXN</span>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                                                <div>
                                                                    <p className="text-blue-200/60 text-xs uppercase font-bold">Distancia</p>
                                                                    <p className="font-bold">{props.distanceKm.toFixed(1)} km</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-blue-200/60 text-xs uppercase font-bold">Seguro Incl.</p>
                                                                    <p className="font-bold">{formatCurrency(props.quoteDetails?.insurance || 0)}</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
                                                                <h4 className="text-xs font-bold text-blue-200 uppercase tracking-widest flex items-center gap-2">
                                                                    <Info size={14} /> ¿Cómo se calcula?
                                                                </h4>
                                                                <ul className="text-[10px] text-blue-100/70 space-y-1 list-disc pl-4">
                                                                    <li><strong>Costo Fijo:</strong> Tarifa base por gestión y despacho.</li>
                                                                    <li><strong>Costo Operativo:</strong> (Combustible + Depreciación de unidad) x {props.distanceKm.toFixed(0)} km.</li>
                                                                    <li><strong>Margen Logístico:</strong> Factor de utilidad operativa y gastos administrativos.</li>
                                                                    <li><strong>Seguro:</strong> Calculado sobre el {props.quoteDetails?.insuranceRate || '1.5'}% del valor declarado.</li>
                                                                </ul>
                                                            </div>

                                                            <p className="text-blue-200/60 text-xs flex items-center gap-2 py-1">
                                                                <Clock size={14} /> Tarifa final incluye impuestos y cargos operativos.
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-col gap-4 w-full md:w-auto min-w-[240px]">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    props.onRequestQuote();
                                                                }}
                                                                className="bg-white text-blue-900 hover:bg-blue-50 px-10 py-5 rounded-2xl font-black text-xl shadow-lg hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 w-full"
                                                            >
                                                                Solicitar Ahora <ChevronRight size={24} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    props.setCurrentStep(3);
                                                                }}
                                                                className="text-blue-100 hover:text-white text-sm font-bold transition-colors py-2 flex items-center justify-center gap-2"
                                                            >
                                                                <Edit size={14} /> Ajustar detalles del envío
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div> {/* End of Cards Container */}
                        </div> {/* End of Main Interaction Area */}

                        {/* Map Preview area */}
                        {props.currentStep !== 1 && (
                            <div className="w-full lg:sticky lg:top-24 h-[400px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                                <DirectionsMap
                                    origin={props.origin ? { lat: props.origin.lat, lng: props.origin.lng } : null}
                                    destination={props.destination ? { lat: props.destination.lat, lng: props.destination.lng } : null}
                                    onDistanceChange={props.setDistanceKm}
                                />
                            </div>
                        )}
                    </div> {/* End of Main layout container */}
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
