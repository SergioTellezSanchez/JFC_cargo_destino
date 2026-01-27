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
import { formatCurrency, formatNumber } from '@/lib/utils';
import Modal from '@/components/Modal';
import PinSelectionModal from '@/components/PinSelectionModal';
import CostBreakdownModal from '@/components/CostBreakdownModal';
import CustomSelect from '@/components/CustomSelect';
import EditableNumberSelect from '@/components/EditableNumberSelect';
import { MapPin, Package, Zap, ChevronRight, CheckCircle, Navigation, Clock, ShieldCheck, Truck, Scale, Box, Repeat, Car, Info, Edit } from 'lucide-react';
import { calculateLogisticsCosts, VEHICLE_TYPES, VEHICLE_CATEGORIES, isVehicleSuitable, type Package as PackageType, type VehicleDefinition } from '@/lib/calculations';
import type { Vehicle } from '@/lib/firebase/schema';


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

    // Steps: 1 = Package, 2 = Route, 3 = Service
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    // Load Type / Context
    const [loadType, setLoadType] = useState('full-truck');
    const [loadTypeDetails, setLoadTypeDetails] = useState<any>({});
    const [tempLoadType, setTempLoadType] = useState<string>('');
    const [showLoadInfoModal, setShowLoadInfoModal] = useState(false);

    const [origin, setOrigin] = useState<LocationState | null>(null);
    const [destination, setDestination] = useState<LocationState | null>(null);
    const [distanceKm, setDistanceKm] = useState(0);
    const [duration, setDuration] = useState('');

    // Package Details
    const [weight, setWeight] = useState<number | ''>('');
    const [dimensions, setDimensions] = useState({ length: 1, width: 1, height: 1 });
    const [packageCount, setPackageCount] = useState<number | ''>('');
    const [description, setDescription] = useState('');
    const [packageType, setPackageType] = useState('Paletizado / Tarimas'); // Default standard
    // Special Nature Flags
    const [isChemical, setIsChemical] = useState(false);
    const [isPerishable, setIsPerishable] = useState(false);
    const [isFurniture, setIsFurniture] = useState(false);

    const [declaredValue, setDeclaredValue] = useState<number>(1000);

    // Route Selection Modes
    const [originMode, setOriginMode] = useState<'warehouse' | 'manual'>('manual');
    const [destinationMode, setDestinationMode] = useState<'warehouse' | 'manual'>('manual');

    // Service Level
    const [serviceLevel, setServiceLevel] = useState<'standard' | 'express'>('standard');

    const [selectedVehicleType, setSelectedVehicleType] = useState<string>('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [calculated, setCalculated] = useState(false);
    const [showBreakdownModal, setShowBreakdownModal] = useState(false);
    const [packageDetails, setPackageDetails] = useState<any>(null);

    // New Logistics State
    const [transportType, setTransportType] = useState<'FTL' | 'PTL' | 'LTL'>('FTL');
    const [cargoType, setCargoType] = useState<'heavy' | 'hazard' | 'packages'>('heavy');
    const [requiresLoadingSupport, setRequiresLoadingSupport] = useState(false);
    const [requiresUnloadingSupport, setRequiresUnloadingSupport] = useState(false);
    const [isStackable, setIsStackable] = useState(false);
    const [requiresStretchWrap, setRequiresStretchWrap] = useState(false);
    const [insuranceSelection, setInsuranceSelection] = useState<'jfc' | 'own'>('jfc');

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
    const [warehouses, setWarehouses] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
        const fetchConfig = async () => {
            try {
                const [sRes, vRes, wRes] = await Promise.all([
                    authenticatedFetch('/api/settings'),
                    authenticatedFetch('/api/vehicles'),
                    authenticatedFetch('/api/storage')
                ]);
                if (sRes.ok) setSettings(await sRes.json());
                if (vRes.ok) setVehicles(await vRes.json());
                if (wRes.ok) setWarehouses(await wRes.json());
            } catch (err) { console.error(err); }
        };
        fetchConfig();
    }, [user]);

    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    useEffect(() => {
        if (settings && selectedVehicleType) {
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
        }
    }, [selectedVehicleType, settings, vehicles]);

    // Update validation logic
    const isPackageDetailsValid = !!weight && Number(weight) > 0 && !!packageType;
    const isVehicleSelectedValid = !!selectedVehicleType;
    const isRouteValid = !!origin && !!destination;

    const isStep1Valid = isPackageDetailsValid;
    const isStep2Valid = isStep1Valid && isRouteValid;
    const isStep3Valid = isStep2Valid; // Service step

    // Fuel & Operation
    const [fuelPrice, setFuelPrice] = useState<number>(25);
    const [fuelEfficiency, setFuelEfficiency] = useState<number>(2);
    const [tolls, setTolls] = useState<number>(0);
    const [travelDays, setTravelDays] = useState<number>(1);

    // Fetch Real Tolls from Google Routes API
    useEffect(() => {
        if (!origin || !destination) {
            setTolls(0);
            return;
        }

        const fetchTolls = async () => {
            // Don't fetch if still typing or selecting
            if (!origin.lat || !destination.lat) return;

            try {
                const res = await authenticatedFetch('/api/tolls', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        origin: { lat: origin.lat, lng: origin.lng },
                        destination: { lat: destination.lat, lng: destination.lng },
                        vehicleType: selectedVehicleType || 'Trailer' // Default to Trailer for high estimate if not selected
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (typeof data.tolls === 'number') {
                        setTolls(data.tolls);
                    }
                    // Optionally update duration or distance from server if we wanted to be super precise, 
                    // but client-side map is usually fine for these.
                }
            } catch (error) {
                console.error('Error fetching tolls:', error);
                // Fallback? No, user explicitly requested NO APPROXIMATION. 
                // So we leave it as 0 or last known good value.
            }
        };

        // Debounce slightly to avoid spamming API while dragging pins (if implemented)
        const timeoutId = setTimeout(fetchTolls, 1000);
        return () => clearTimeout(timeoutId);

    }, [origin, destination, selectedVehicleType]);

    // Calculate tolls via Google Routes API
    useEffect(() => {
        if (origin && destination) {
            const fetchTolls = async () => {
                try {
                    const res = await fetch('/api/tolls', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            origin: { lat: origin.lat, lng: origin.lng },
                            destination: { lat: destination.lat, lng: destination.lng },
                            vehicleType: selectedVehicleType || 'standard'
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setTolls(data.tolls || 0);
                        // Optional: Sync distance if API returns it different
                        // if (data.distanceMeters) setDistanceKm(data.distanceMeters / 1000);
                    } else {
                        console.warn('Failed to fetch tolls, falling back to heuristic');
                        if (distanceKm > 0) setTolls(Math.round(distanceKm * 3.0));
                    }
                } catch (err) {
                    console.error(err);
                    // Fallback
                    if (distanceKm > 0) setTolls(Math.round(distanceKm * 3.0));
                }
            };
            // Debounce slightly or just call
            const timer = setTimeout(fetchTolls, 1000);
            return () => clearTimeout(timer);
        }
    }, [origin, destination, distanceKm]); // Re-run if route changes

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
        if (isRouteValid && !!weight && Number(weight) > 0) {
            // Priority: selected vehicle from the new list, then DB vehicles, then fallback
            let vehicleToUse = null;

            // Auto-select best vehicle if none selected
            if (!selectedVehicleType) {
                const allVehicles = [...VEHICLE_TYPES, ...vehicles];
                const suitable = allVehicles.filter(v => isVehicleSuitable(v, { weight: Number(weight), packageType } as any));
                // Sort by capacity (ascending) to find smallest suitable
                suitable.sort((a, b) => a.capacity - b.capacity);
                if (suitable.length > 0) {
                    vehicleToUse = suitable[0];
                    setSelectedVehicleType(vehicleToUse.id);
                }
            } else {
                const vehicleDef = VEHICLE_TYPES.find(v => v.id === selectedVehicleType);
                const dbVehicle = vehicles.find(v => v.id === selectedVehicleType || v.name === selectedVehicleType);
                vehicleToUse = vehicleDef || dbVehicle;
            }

            if (!vehicleToUse) {
                vehicleToUse = {
                    value: 2500000,
                    usefulLifeKm: 800000,
                    suspensionType: 'Neumática',
                    capacity: 25000,
                    id: 'generic',
                    name: 'Generico',
                    description: 'Generico',
                    category: 'Heavy',
                    fuelEfficiency: 2,
                    fuelType: 'diesel'
                };
            }

            // Ensure settings are available or use defaults to prevent crash
            const safeSettings = settings || {
                basePricePerKm: 25,
                basePrice: 1000,
                insuranceRate: 1.5,
                profitMargin: 1.4,
                imponderablesRate: 3.0
            };

            const results = calculateLogisticsCosts(
                {
                    weight: Number(weight),
                    declaredValue,
                    distanceKm,
                    loadType,
                    transportType,
                    cargoType,
                    requiresLoadingSupport,
                    requiresUnloadingSupport,
                    isStackable,
                    requiresStretchWrap,
                    insuranceSelection,
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
                safeSettings,
                serviceLevel
            );

            // Console log for debugging (will show in browser console)
            console.log('Calculation Results:', results);

            setQuoteDetails(results);
            setQuotePrice(results.priceToClient);
            setCalculated(true);
        }
    }, [distanceKm, weight, dimensions, serviceLevel, isRouteValid, selectedVehicleType, settings, declaredValue, vehicles, packageType, fuelPrice, fuelEfficiency, tolls, driverSalary, driverCommission, assistantSalary, assistantCommission, food, lodging, travelDays, unforeseenPercent, otherExpenses, transportType, cargoType, requiresLoadingSupport, requiresUnloadingSupport, isStackable, requiresStretchWrap, insuranceSelection]);

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
                packageCount: packageCount || 1,
                price: quotePrice,
                description,
                status: 'PENDING',
                userId: user.uid,
                recipientName,
                recipientPhone,
                serviceLevel,
                packageType,
                loadType,
                transportType,
                cargoType,
                requiresLoadingSupport,
                requiresUnloadingSupport,
                isStackable,
                requiresStretchWrap,
                insuranceSelection,
                // Nature Flags
                isChemical,
                isPerishable,
                isFurniture,

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
        if (!isStep2Valid) return; // Adjusted for new step count
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
                warehouses={warehouses}
                weight={weight}
                setWeight={setWeight}
                dimensions={dimensions}
                setDimensions={setDimensions}
                packageCount={packageCount}
                setPackageCount={setPackageCount}
                description={description}
                setDescription={setDescription}
                packageType={packageType}
                setPackageType={setPackageType}
                // Special Nature
                isChemical={isChemical} setIsChemical={setIsChemical}
                isPerishable={isPerishable} setIsPerishable={setIsPerishable}
                isFurniture={isFurniture} setIsFurniture={setIsFurniture}

                packageDetails={packageDetails}
                setPackageDetails={setPackageDetails}
                onAddressSelect={handleAddressSelect}
                vehicles={vehicles}
                serviceLevel={serviceLevel}
                setServiceLevel={setServiceLevel}
                loadType={loadType}
                setLoadType={setLoadType}
                transportType={transportType}
                setTransportType={setTransportType}
                cargoType={cargoType}
                setCargoType={setCargoType}
                requiresLoadingSupport={requiresLoadingSupport}
                setRequiresLoadingSupport={setRequiresLoadingSupport}
                requiresUnloadingSupport={requiresUnloadingSupport}
                setRequiresUnloadingSupport={setRequiresUnloadingSupport}
                isStackable={isStackable}
                setIsStackable={setIsStackable}
                requiresStretchWrap={requiresStretchWrap}
                setRequiresStretchWrap={setRequiresStretchWrap}
                insuranceSelection={insuranceSelection}
                setInsuranceSelection={setInsuranceSelection}
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
                duration={duration}
                setDuration={setDuration}

                quoteDetails={quoteDetails}
                quotePrice={quotePrice}
                handleCreatePackage={handleCreatePackage}
                onRequestQuote={handleRequestQuote}
                showModal={showModal}
                setShowModal={setShowModal}
                recipientName={recipientName}
                originMode={originMode}
                setOriginMode={setOriginMode}
                destinationMode={destinationMode}
                setDestinationMode={setDestinationMode}
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
                                        { id: 2, label: 'Ruta', icon: Navigation },
                                        { id: 3, label: 'Servicio', icon: Zap }
                                    ].map((step) => {
                                        const isActive = props.currentStep === step.id;
                                        const isCompleted = props.currentStep > step.id;

                                        // Validation logic for disabling next steps
                                        let isDisabled = false;
                                        if (step.id > props.currentStep) {
                                            if (step.id === 2 && !props.isStep1Valid) isDisabled = true;
                                            if (step.id === 3 && !props.isStep2Valid) isDisabled = true;
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
                                            <p className="text-slate-500">Cuéntanos sobre tu carga para asignarte la unidad perfecta.</p>
                                        </div>

                                        {/* Section 1: Main Product Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* 1. Transport Type */}
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Tipo de Transporte</label>
                                                <select
                                                    value={props.transportType}
                                                    onChange={(e) => props.setTransportType(e.target.value as any)}
                                                    className="w-full bg-transparent font-bold text-slate-700 outline-none p-1 border-none focus:ring-0 text-lg"
                                                >
                                                    <option value="FTL">FTL (Full Truck Load)</option>
                                                    <option value="PTL">PTL (Partial Truck Load)</option>
                                                    <option value="LTL">LTL (Less than Truck Load)</option>
                                                </select>
                                            </div>

                                            {/* 2. Weight Range */}
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Peso Aproximado</label>
                                                <select
                                                    value={props.weight || ''}
                                                    onChange={(e) => props.setWeight(Number(e.target.value))}
                                                    className="w-full bg-transparent font-bold text-slate-700 outline-none p-1 border-none focus:ring-0 text-lg"
                                                >
                                                    <option value="" disabled>-- Selecciona --</option>
                                                    <option value="50">Menos de 50 kg</option>
                                                    <option value="500">50 - 500 kg (Light)</option>
                                                    <option value="1500">500 kg - 1.5 Ton (Van)</option>
                                                    <option value="3500">1.5 - 3.5 Ton (3.5)</option>
                                                    <option value="10000">3.5 - 10 Ton (Rabon)</option>
                                                    <option value="14000">14 Ton (Torton)</option>
                                                    <option value="24000">24 Ton (Trailer)</option>
                                                </select>
                                            </div>

                                            {/* 3. Cargo Type (Merged with Nature) */}
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all md:col-span-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Tipo de Carga</label>
                                                <select
                                                    value={props.cargoType}
                                                    onChange={(e) => props.setCargoType(e.target.value as any)}
                                                    className="w-full bg-transparent font-bold text-slate-700 outline-none p-1 border-none focus:ring-0 text-lg"
                                                >
                                                    <option value="packages">Paquetería / Diversos (Carga General)</option>
                                                    <option value="hazardous">Químicos / Hazmat</option>
                                                    <option value="perishable">Perecederos / Refrig.</option>
                                                    <option value="furniture">Muebles / Mudanza</option>
                                                    <option value="machinery">Maquinaria</option>
                                                    <option value="heavy">Carga Pesada / Otros</option>
                                                </select>
                                            </div>

                                            {/* 4. Presentation */}
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Presentación de Carga</label>
                                                <select
                                                    value={props.packageType}
                                                    onChange={(e) => props.setPackageType(e.target.value)}
                                                    className="w-full bg-transparent font-bold text-slate-700 outline-none p-1 border-none focus:ring-0 text-lg"
                                                >
                                                    <option value="General">Carga General (Cajas/Bultos)</option>
                                                    <option value="Paletizado / Tarimas">Paletizado / Tarimas</option>
                                                    <option value="Granel">Granel (Bulk)</option>
                                                    <option value="Maquinaria">Maquinaria</option>
                                                </select>
                                            </div>

                                            {/* 5. Quantity (Count) */}
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Cantidad (Bultos/Tarimas)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={props.packageCount || ''}
                                                    onChange={(e) => props.setPackageCount(Number(e.target.value))}
                                                    placeholder="1"
                                                    className="w-full bg-transparent font-bold text-slate-700 outline-none p-1 border-none focus:ring-0 text-lg placeholder:font-normal"
                                                />
                                            </div>

                                            {/* 6. Dimensions */}
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all md:col-span-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Dimensiones Máximas (Metros)</label>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Length */}
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Largo</label>
                                                        <EditableNumberSelect
                                                            value={props.dimensions.length}
                                                            onChange={(val) => props.setDimensions({ ...props.dimensions, length: val })}
                                                            options={[0.3, ...Array.from({ length: 20 }, (_, i) => i + 1)]}
                                                            max={20}
                                                        />
                                                    </div>
                                                    {/* Width */}
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ancho</label>
                                                        <EditableNumberSelect
                                                            value={props.dimensions.width}
                                                            onChange={(val) => props.setDimensions({ ...props.dimensions, width: val })}
                                                            options={[0.3, ...Array.from({ length: 5 }, (_, i) => i + 1)]}
                                                            max={5}
                                                        />
                                                    </div>
                                                    {/* Height */}
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Alto</label>
                                                        <EditableNumberSelect
                                                            value={props.dimensions.height}
                                                            onChange={(val) => props.setDimensions({ ...props.dimensions, height: val })}
                                                            options={[0.3, ...Array.from({ length: 5 }, (_, i) => i + 1)]}
                                                            max={5}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 2: Handling & Additional Services */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                                            {/* Apoyo Carga/Descarga */}
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Servicios de Maniobra</h3>
                                                <div className="space-y-3">
                                                    <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-blue-400 transition-all shadow-sm">
                                                        <input type="checkbox" checked={props.requiresLoadingSupport} onChange={(e) => props.setRequiresLoadingSupport(e.target.checked)} className="w-5 h-5 rounded text-blue-600" />
                                                        <div>
                                                            <span className="font-bold text-slate-700 block">Apoyo en Carga</span>
                                                            <span className="text-xs text-slate-400">Personal para subir mercancía</span>
                                                        </div>
                                                    </label>
                                                    <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-blue-400 transition-all shadow-sm">
                                                        <input type="checkbox" checked={props.requiresUnloadingSupport} onChange={(e) => props.setRequiresUnloadingSupport(e.target.checked)} className="w-5 h-5 rounded text-blue-600" />
                                                        <div>
                                                            <span className="font-bold text-slate-700 block">Apoyo en Descarga</span>
                                                            <span className="text-xs text-slate-400">Personal para bajar mercancía</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Condiciones de Manejo */}
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Condiciones de Manejo</h3>
                                                <div className="space-y-3">
                                                    <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-blue-400 transition-all shadow-sm">
                                                        <input type="checkbox" checked={props.isStackable} onChange={(e) => props.setIsStackable(e.target.checked)} className="w-5 h-5 rounded text-blue-600" />
                                                        <div>
                                                            <span className="font-bold text-slate-700 block">Producto Estibable</span>
                                                            <span className="text-xs text-slate-400">Se puede apilar</span>
                                                        </div>
                                                    </label>
                                                    <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-blue-400 transition-all shadow-sm">
                                                        <input type="checkbox" checked={props.requiresStretchWrap} onChange={(e) => props.setRequiresStretchWrap(e.target.checked)} className="w-5 h-5 rounded text-blue-600" />
                                                        <div>
                                                            <span className="font-bold text-slate-700 block">Playo / Empaque</span>
                                                            <span className="text-xs text-slate-400">Requiere protección extra</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 3: Value Protection (Insurance) */}
                                        <div className="pt-4 border-t border-slate-100">
                                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Protección de Valor</h3>
                                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                                <div>
                                                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 block">Tipo de Seguro</label>
                                                    <div className="flex bg-white rounded-xl p-1 border border-blue-100 shadow-sm">
                                                        <button
                                                            onClick={() => props.setInsuranceSelection('jfc')}
                                                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${props.insuranceSelection === 'jfc' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                                                        >
                                                            Seguro JFC
                                                        </button>
                                                        <button
                                                            onClick={() => props.setInsuranceSelection('own')}
                                                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${props.insuranceSelection === 'own' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                                                        >
                                                            Seguro Propio
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Valor Declarado de Mercancía</label>
                                                    <div className="flex items-baseline gap-2 bg-white p-3 rounded-xl border border-blue-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-sm">
                                                        <span className="text-slate-400 font-medium">$</span>
                                                        <input
                                                            type="number"
                                                            value={props.declaredValue || ''}
                                                            onChange={(e) => props.setDeclaredValue(Number(e.target.value))}
                                                            placeholder="0.00"
                                                            className="w-full bg-transparent text-xl font-bold text-slate-800 outline-none"
                                                        />
                                                        <span className="text-slate-400 font-medium">MXN</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="pt-4">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Descripción Detallada</label>
                                            <textarea
                                                value={props.description}
                                                onChange={(e) => props.setDescription(e.target.value)}
                                                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24 placeholder:text-slate-300 transition-all font-medium text-slate-700"
                                                placeholder="Ej. Tubería de acero al carbón, estibada en tarimas, requiere cuidado especial..."
                                            ></textarea>
                                        </div>

                                        <div className="flex justify-end pt-6">
                                            <button
                                                disabled={!props.isStep1Valid}
                                                onClick={() => props.setCurrentStep(2)}
                                                className={`group bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3
                                                    ${!props.isStep1Valid ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                                `}
                                            >
                                                Continuar a Ruta <ChevronRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Route (Formerly Step 3) */}
                                {props.currentStep === 2 && (
                                    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-800">¿A dónde vamos?</h2>
                                                <p className="text-slate-500">Define los puntos de recolección y entrega para la unidad seleccionada.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            {/* Origin Section */}
                                            <div className="group relative p-1 rounded-2xl transition-all duration-300 bg-transparent">
                                                <div className="bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#1f4a5e] transition-all shadow-sm hover:shadow-lg">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-2">
                                                            <Navigation size={12} className="text-[#1f4a5e]" /> Origen (Carga)
                                                        </label>
                                                        {/* Tabs */}
                                                        <div className="flex bg-slate-200/50 p-1 rounded-lg">
                                                            <button
                                                                onClick={() => {
                                                                    props.setOriginMode('warehouse');
                                                                    props.setOrigin(null); // Reset when switching
                                                                }}
                                                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${props.originMode === 'warehouse' ? 'bg-white text-[#1f4a5e] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                            >
                                                                Mis Almacenes
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    props.setOriginMode('manual');
                                                                    props.setOrigin(null);
                                                                }}
                                                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${props.originMode === 'manual' ? 'bg-white text-[#1f4a5e] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                            >
                                                                Nueva Dirección
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Content based on Mode */}
                                                    {props.origin ? (
                                                        // Selected State (Common for both)
                                                        <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-3 bg-[#1f4a5e] text-white rounded-full shadow-md">
                                                                    <MapPin size={24} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-800 text-lg leading-tight">{props.origin.address.split(',')[0]}</p>
                                                                    <p className="text-sm text-slate-500">{props.origin.address}</p>
                                                                    <div className="flex gap-2 mt-1">
                                                                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                                            {props.origin.lat.toFixed(4)}, {props.origin.lng.toFixed(4)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => props.onOpenPinModal('origin')}
                                                                    className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-[#1f4a5e] transition-colors"
                                                                    title="Ajustar Pin"
                                                                >
                                                                    <MapPin size={20} />
                                                                </button>
                                                                <button
                                                                    onClick={() => props.setOrigin(null)}
                                                                    className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors"
                                                                    title="Cambiar ubicación"
                                                                >
                                                                    <Edit size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Input State
                                                        <div className="flex gap-2 items-center w-full">
                                                            {props.originMode === 'warehouse' ? (
                                                                <select
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 focus:ring-2 focus:ring-[#1f4a5e] outline-none"
                                                                    onChange={(e) => {
                                                                        const w = props.warehouses.find((wh: any) => wh.id === e.target.value);
                                                                        if (w) {
                                                                            const addrStr = typeof w.address === 'object'
                                                                                ? `${w.address.street || ''} ${w.address.city || ''}`
                                                                                : w.address;
                                                                            props.setOrigin({ address: addrStr, lat: w.lat || (w.location?.latitude || w.location?._lat), lng: w.lng || (w.location?.longitude || w.location?._long) });
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="">-- Seleccionar de mis almacenes --</option>
                                                                    {props.warehouses && props.warehouses.map((w: any) => (
                                                                        <option key={w.id} value={w.id}>
                                                                            {w.name} - {
                                                                                typeof w.address === 'object'
                                                                                    ? `${w.address.street || ''} ${w.address.city || ''}`
                                                                                    : w.address
                                                                            }
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <div className="w-full">
                                                                    <PlaceAutocomplete
                                                                        className="w-full bg-transparent border-b-2 border-slate-200 focus:border-blue-500 outline-none py-2 text-lg font-medium text-slate-800 placeholder:text-slate-300 transition-colors"
                                                                        placeholder="Escribe una dirección..."
                                                                        onPlaceSelect={(loc: any) => props.onAddressSelect(loc, 'origin')}
                                                                    />
                                                                </div>
                                                            )}
                                                            {/* Pin Button always visible in input mode for manual adjustments if needed, though mostly useful after selection */}
                                                            <button
                                                                onClick={() => props.onOpenPinModal('origin')}
                                                                className="p-3 rounded-full transition-all bg-slate-100 text-slate-400 hover:bg-[#1f4a5e] hover:text-white shrink-0"
                                                                title="Usar mapa directamente"
                                                            >
                                                                <MapPin size={20} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Destination Section */}
                                            <div className="group relative p-1 rounded-2xl transition-all duration-300 bg-transparent">
                                                <div className="bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#d9bd82] transition-all shadow-sm hover:shadow-lg">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-2">
                                                            <MapPin size={12} className="text-[#d9bd82]" /> Destino (Entrega)
                                                        </label>
                                                        {/* Tabs */}
                                                        <div className="flex bg-slate-200/50 p-1 rounded-lg">
                                                            <button
                                                                onClick={() => {
                                                                    props.setDestinationMode('warehouse');
                                                                    props.setDestination(null);
                                                                }}
                                                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${props.destinationMode === 'warehouse' ? 'bg-white text-[#d9bd82] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                            >
                                                                Mis Almacenes
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    props.setDestinationMode('manual');
                                                                    props.setDestination(null);
                                                                }}
                                                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${props.destinationMode === 'manual' ? 'bg-white text-[#d9bd82] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                            >
                                                                Nueva Dirección
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Content based on Mode */}
                                                    {props.destination ? (
                                                        // Selected State
                                                        <div className="flex items-center justify-between bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-3 bg-[#d9bd82] text-white rounded-full shadow-md">
                                                                    <MapPin size={24} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-800 text-lg leading-tight">{props.destination.address.split(',')[0]}</p>
                                                                    <p className="text-sm text-slate-500">{props.destination.address}</p>
                                                                    <div className="flex gap-2 mt-1">
                                                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                                                            {props.destination.lat.toFixed(4)}, {props.destination.lng.toFixed(4)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => props.onOpenPinModal('destination')}
                                                                    className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-[#d9bd82] transition-colors"
                                                                    title="Ajustar Pin"
                                                                >
                                                                    <MapPin size={20} />
                                                                </button>
                                                                <button
                                                                    onClick={() => props.setDestination(null)}
                                                                    className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors"
                                                                    title="Cambiar ubicación"
                                                                >
                                                                    <Edit size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Input State
                                                        <div className="flex gap-2 items-center w-full">
                                                            {props.destinationMode === 'warehouse' ? (
                                                                <select
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 focus:ring-2 focus:ring-[#d9bd82] outline-none"
                                                                    onChange={(e) => {
                                                                        const w = props.warehouses.find((wh: any) => wh.id === e.target.value);
                                                                        if (w) {
                                                                            const addrStr = typeof w.address === 'object'
                                                                                ? `${w.address.street || ''} ${w.address.city || ''}`
                                                                                : w.address;
                                                                            props.setDestination({ address: addrStr, lat: w.lat || (w.location?.latitude || w.location?._lat), lng: w.lng || (w.location?.longitude || w.location?._long) });
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="">-- Seleccionar de mis almacenes --</option>
                                                                    {props.warehouses && props.warehouses.map((w: any) => (
                                                                        <option key={w.id} value={w.id}>
                                                                            {w.name} - {
                                                                                typeof w.address === 'object'
                                                                                    ? `${w.address.street || ''} ${w.address.city || ''}`
                                                                                    : w.address
                                                                            }
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <div className="w-full">
                                                                    <PlaceAutocomplete
                                                                        className="w-full bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none py-2 text-lg font-medium text-slate-800 placeholder:text-slate-300 transition-colors"
                                                                        placeholder="Escribe una dirección..."
                                                                        onPlaceSelect={(loc: any) => props.onAddressSelect(loc, 'destination')}
                                                                    />
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => props.onOpenPinModal('destination')}
                                                                className="p-3 rounded-full transition-all bg-slate-100 text-slate-400 hover:bg-[#1f4a5e] hover:text-white shrink-0"
                                                                title="Usar mapa directamente"
                                                            >
                                                                <MapPin size={20} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
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
                                                Ver Precios y Servicio <ChevronRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Service */}
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
                                                                    <p className="font-bold">{formatNumber(props.distanceKm)} km</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-blue-200/60 text-xs uppercase font-bold">Costo Op. por Km</p>
                                                                    <p className="font-bold">{formatCurrency(props.quoteDetails?.operationalCostPerKm || 0)}</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/10">
                                                                <h4 className="text-xs font-bold text-blue-200 uppercase tracking-widest flex items-center gap-2">
                                                                    <Info size={14} /> Desglose Logístico
                                                                </h4>
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-blue-100/70">
                                                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                                                        <span>Flete Base:</span>
                                                                        <span className="font-bold text-white">{formatCurrency(props.quoteDetails?.billableFreight || 0)}</span>
                                                                    </div>
                                                                    {props.quoteDetails?.billableFees > 0 && (
                                                                        <div className="flex justify-between border-b border-white/5 pb-1">
                                                                            <span>Maniobras / Servicios:</span>
                                                                            <span className="font-bold text-white">{formatCurrency(props.quoteDetails?.billableFees || 0)}</span>
                                                                        </div>
                                                                    )}
                                                                    {props.quoteDetails?.billableTolls > 0 && (
                                                                        <div className="flex justify-between border-b border-white/5 pb-1">
                                                                            <span>Casetas:</span>
                                                                            <span className="font-bold text-white">{formatCurrency(props.quoteDetails?.billableTolls || 0)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                                                        <span>Seguro ({props.quoteDetails?.insuranceRate?.toFixed(1)}%):</span>
                                                                        <span className="font-bold text-white">{formatCurrency(props.quoteDetails?.insurance || 0)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between pt-1 col-span-2 text-blue-200 font-bold border-t border-white/20 mt-1">
                                                                        <span>IVA Total (16%):</span>
                                                                        <span>{formatCurrency(props.quoteDetails?.iva || 0)}</span>
                                                                    </div>
                                                                </div>
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
                                                                    props.setCurrentStep(2);
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
                        {props.currentStep >= 2 && (
                            <div className="w-full lg:sticky lg:top-24 h-[400px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative">
                                <DirectionsMap
                                    origin={props.origin ? { lat: props.origin.lat, lng: props.origin.lng } : null}
                                    destination={props.destination ? { lat: props.destination.lat, lng: props.destination.lng } : null}
                                    onDistanceChange={props.setDistanceKm}
                                    onDurationChange={props.setDuration}
                                    showTraffic={true}
                                />

                                {/* Data Overlay - Top Right */}
                                {(props.distanceKm > 0 || props.tolls > 0) && (
                                    <div className="absolute top-4 right-4 md:w-auto md:min-w-[340px] bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-100 z-10 animate-in slide-in-from-top-4 duration-700">
                                        <div className="flex justify-between items-center gap-6">
                                            {/* Distance */}
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Distancia aprox.</p>
                                                <p className="text-xl md:text-2xl font-black text-slate-800 flex items-baseline gap-1">
                                                    {formatNumber(Math.round(props.distanceKm))}
                                                    <span className="text-sm font-bold text-slate-400">km</span>
                                                </p>
                                            </div>

                                            {/* Time (Duration) */}
                                            {props.duration && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tiempo est.</p>
                                                    <p className="text-xl md:text-2xl font-black text-slate-800 flex items-baseline gap-1">
                                                        {props.duration.replace('hours', 'h').replace('mins', 'm').replace('min', 'm')}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="h-10 w-px bg-slate-200"></div>

                                            {/* Tolls */}
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Casetas aprox.</p>
                                                <p className="text-xl md:text-2xl font-black text-slate-800 flex items-baseline gap-1 justify-end">
                                                    <span>$</span>{Math.round(props.tolls).toLocaleString('es-MX')}
                                                    <span className="text-sm font-bold text-slate-400">MXN</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
        </div >
    );
}
