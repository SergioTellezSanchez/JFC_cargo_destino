'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Truck, Save, DollarSign, Package as PackageIcon, Users, Warehouse, Plus, LayoutGrid, Database, Lock, AlertCircle, Info, HelpCircle, Box, Check } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/UserContext';
import { UserRole, PricingSettings, FuelPrices } from '@/lib/firebase/schema';
import WorldClock from '@/components/WorldClock';
import { authenticatedFetch } from '@/lib/api';
import { calculateLogisticsCosts, VEHICLE_TYPES } from '@/lib/calculations';
import WarehouseManagement from '@/components/management/WarehouseManagement';
import UserRoleManagement from '@/components/management/UserRoleManagement';
import PackageManagement from '@/components/management/PackageManagement';
import VehicleManagement from '@/components/management/VehicleManagement';
import DriverManagement from '@/components/management/DriverManagement';

function AdminContent() {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const { user, isAdmin, loading: authLoading } = useUser();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('packages');
    const [settings, setSettings] = useState<PricingSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // Simulator State
    const [sim, setSim] = useState({
        dist: 500,
        weight: 1500,
        transport: 'FTL',
        risk: 'general',
        pres: 'General',
        qty: 1,
        loadingSupport: true,
        unloadingSupport: true,
        stackable: false,
        wrap: false,
        tolls: 0,
        declaredValue: 0,
        insuranceSelection: 'jfc'
    });
    const [simResult, setSimResult] = useState<{ base: number; total: number; subtotal: number; breakdown: any[] } | null>(null);

    // Initial Load
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['packages', 'vehicles', 'drivers', 'warehouses', 'settings'].includes(tab)) {
            setActiveTab(tab);
        }

        if (!authLoading) {
            if (user) {
                fetchSettings();
            } else {
                setLoading(false);
            }
        }
    }, [searchParams, authLoading, user]);

    // Live Simulator Effect
    useEffect(() => {
        if (!settings) return;
        try {
            const result = calculateLogisticsCosts({
                weight: sim.weight,
                distanceKm: sim.dist,
                transportType: sim.transport as any,
                cargoType: sim.risk as any,
                packageType: sim.pres,
                packageCount: sim.qty,
                requiresLoadingSupport: sim.loadingSupport,
                requiresUnloadingSupport: sim.unloadingSupport,
                isStackable: sim.stackable,
                requiresStretchWrap: sim.wrap,
                tolls: sim.tolls,
                declaredValue: sim.declaredValue,
                insuranceSelection: sim.insuranceSelection as any
            }, VEHICLE_TYPES[0], settings);

            setSimResult({
                base: result.billableFreight,
                subtotal: result.subtotal, // Price before tax
                total: result.priceToClient, // Grand total
                breakdown: result.billableLineItems || []
            });
        } catch (e) {
            console.error(e);
        }
    }, [sim, settings]);


    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        window.history.pushState(null, '', `/admin?tab=${tabId}`);
    };

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await authenticatedFetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = <K extends keyof PricingSettings>(
        section: K,
        key: string | null,
        value: unknown
    ) => {
        if (!settings) return;
        setSettings(prev => {
            if (!prev) return null;
            const updated = { ...prev };

            if (key) {
                // Handle nested object updates (e.g. weightRates['50'])
                // We assert that the section is a Record-like object
                const currentSection = updated[section] as Record<string, unknown> | undefined;
                updated[section] = {
                    ...(currentSection || {}),
                    [key]: value
                } as PricingSettings[K];
            } else {
                // Handle top-level updates (e.g. basePrice)
                updated[section] = value as PricingSettings[K];
            }
            return updated;
        });
    };

    const saveSettings = async () => {
        if (!settings) return;
        try {
            const res = await authenticatedFetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) alert('Configuración guardada correctamente');
        } catch (err) { alert('Error al guardar configuración'); }
    };

    if (authLoading || (user && loading)) return <div className="container p-8 text-center">Cargando administrador...</div>;

    // Access Control
    if (!user) {
        return (
            <div className="container min-h-[90vh] flex items-center justify-center p-8">
                <div className="card max-w-[400px] w-full p-12 text-center mx-auto">
                    <div className="flex justify-center mb-6">
                        <Lock size={48} className="text-[var(--primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Acceso Restringido</h2>
                    <p className="text-[var(--secondary)] mb-8">Debes iniciar sesión para acceder al panel administrativo.</p>
                    <button className="btn btn-primary w-full" onClick={() => router.push('/login')}>Ir al Login</button>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="container min-h-[90vh] flex items-center justify-center p-8">
                <div className="card max-w-[500px] w-full p-12 text-center mx-auto border-2 border-[var(--error-bg)]">
                    <div className="flex justify-center mb-6">
                        <AlertCircle size={48} className="text-[var(--error)]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-[var(--error)]">Sin Privilegios</h2>
                    <p className="text-[var(--secondary)] mb-4">
                        Tu cuenta <strong>({user.email})</strong> no tiene permisos de administrador.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <WorldClock />

            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-gradient text-3xl font-bold">{t('adminDashboard')}</h1>
                    <span className="badge badge-primary text-xs uppercase">{user?.role || 'ADMIN'}</span>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-[var(--card-bg)] p-1 rounded-xl border border-[var(--border)] overflow-x-auto flex-nowrap scrollbar-hide">
                    {[
                        { id: 'packages', label: t('packages'), icon: <PackageIcon size={18} /> },
                        { id: 'vehicles', label: t('vehicles'), icon: <Truck size={18} /> },
                        { id: 'drivers', label: t('drivers'), icon: <Users size={18} /> },
                        { id: 'warehouses', label: t('warehouses'), icon: <Warehouse size={18} /> },
                        { id: 'users', label: 'Gestión de Usuarios', icon: <Users size={18} /> },
                        { id: 'settings', label: 'Configuración', icon: <LayoutGrid size={18} /> },
                    ].filter(t => t.id !== 'users' || user?.role === UserRole.SUPER_ADMIN).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`
                                flex items-center gap-2 px-5 py-2.5 rounded-lg border-none cursor-pointer transition-all duration-200 whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'bg-[var(--primary)] text-white font-semibold'
                                    : 'bg-transparent text-[var(--secondary)] hover:bg-[var(--secondary-bg)]'}
                            `}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className={`
                min-h-[400px] transition-all
                ${activeTab === 'settings' ? 'bg-transparent border-none p-0' : 'card bg-[var(--card-bg)] border border-[var(--border)] p-1'}
            `}>
                {activeTab === 'packages' && <PackageManagement isAdminView={true} />}
                {activeTab === 'vehicles' && <VehicleManagement isAdminView={true} />}
                {activeTab === 'drivers' && <DriverManagement isAdminView={true} />}
                {activeTab === 'warehouses' && <WarehouseManagement isAdminView={true} />}
                {activeTab === 'users' && user?.role === UserRole.SUPER_ADMIN && (
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-[var(--foreground)] text-white p-2 rounded-lg">
                                <Users size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold m-0">Gestión de Usuarios y Roles</h2>
                                <p className="text-[var(--secondary)] text-sm">Controla quién tiene acceso a las funciones administrativas.</p>
                            </div>
                        </div>
                        <UserRoleManagement />
                    </div>
                )}

                {activeTab === 'settings' && settings && (
                    <div className="max-w-5xl mx-auto space-y-8">

                        {/* HEADER */}
                        <div className="flex items-center gap-3">
                            <div className="bg-[var(--primary)] text-white p-3 rounded-xl shadow-lg shadow-indigo-500/20">
                                <DollarSign size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">Parámetros Globales</h2>
                                <p className="text-slate-500 font-medium">Configura los valores base para la operación.</p>
                            </div>
                            <div className="ml-auto">
                                <button onClick={saveSettings} className="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                                    <Save size={18} /> Guardar Configuración
                                </button>
                            </div>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                const res = await authenticatedFetch('/api/settings', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(settings)
                                });
                                if (res.ok) alert('Configuración guardada correctamente');
                            } catch (err) { alert('Error al guardar configuración'); }
                        }}>
                            <div className="space-y-12 pb-10">
                                {/* 1. Global & Margins */}
                                {/* 1. Global Parameters (Merged & Compact) */}
                                <div className="card bg-white border border-slate-200 shadow-sm overflow-visible">
                                    <div className="bg-slate-50/50 p-3 border-b border-slate-100 flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-100 rounded text-slate-600"><LayoutGrid size={16} /></div>
                                        <h3 className="font-bold text-slate-700 text-sm">Configuración General</h3>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                                        {/* Col 1: Tarifas Base */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                                                <DollarSign size={14} className="text-[var(--primary)]" /> Tarifas Base
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="form-control w-full">
                                                    <label className="label py-0 mb-1"><span className="label-text text-[9px] font-bold text-slate-500">Margen</span></label>
                                                    <input type="number" step="0.05" className="input input-xs input-bordered w-full text-right font-mono px-1"
                                                        value={settings.profitMargin || 0}
                                                        onChange={(e) => {
                                                            const newMargin = Number(e.target.value);
                                                            setSettings(prev => {
                                                                if (!prev) return null;
                                                                const updated = { ...prev, profitMargin: newMargin };
                                                                if (updated.vehicleDimensions) {
                                                                    Object.keys(updated.vehicleDimensions).forEach(key => {
                                                                        const v = updated.vehicleDimensions![key];
                                                                        if (v.fuelConfig) {
                                                                            const activeFuelId = Object.keys(v.fuelConfig).find(fid => v.fuelConfig![fid].enabled);
                                                                            if (activeFuelId) {
                                                                                const fuelPrice = updated.fuelPrices?.[activeFuelId as keyof FuelPrices] || 0;
                                                                                const efficiency = v.fuelConfig[activeFuelId].efficiency;
                                                                                if (efficiency > 0 && fuelPrice > 0) {
                                                                                    const costPerKm = fuelPrice / efficiency;
                                                                                    v.pricePerKm = Number((costPerKm * newMargin).toFixed(2));
                                                                                }
                                                                            }
                                                                        }
                                                                    });
                                                                }
                                                                return updated;
                                                            });
                                                        }} />
                                                </div>
                                                <div className="form-control w-full">
                                                    <label className="label py-0 mb-1"><span className="label-text text-[9px] font-bold text-slate-500">Imponderables (%)</span></label>
                                                    <input type="number" step="1" className="input input-xs input-bordered w-full text-right font-mono px-1"
                                                        value={settings.imponderablesRate || 0}
                                                        onChange={(e) => updateSetting('imponderablesRate', null, Number(e.target.value))} />
                                                </div>
                                                <div className="form-control w-full">
                                                    <label className="label py-0 mb-1"><span className="label-text text-[9px] font-bold text-slate-500">$/Ton/Km</span></label>
                                                    <input type="number" step="0.1" className="input input-xs input-bordered w-full text-right font-mono px-1"
                                                        value={settings.tonKmRate || 0}
                                                        onChange={(e) => updateSetting('tonKmRate', null, Number(e.target.value))} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Col 2: Combustibles */}
                                        <div className="space-y-3 pt-4 lg:pt-0 lg:pl-4">
                                            <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                                                <Database size={14} className="text-red-500" /> Combustibles ($/L)
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="form-control">
                                                    <label className="label py-0 mb-1"><span className="label-text text-[9px] font-bold text-slate-500">Diesel</span></label>
                                                    <input type="number" step="0.1" className="input input-xs input-bordered w-full text-right font-mono"
                                                        value={settings.fuelPrices?.diesel || 0}
                                                        onChange={(e) => updateSetting('fuelPrices', 'diesel', Number(e.target.value))} />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label py-0 mb-1"><span className="label-text text-[9px] font-bold text-slate-500">Regular</span></label>
                                                    <input type="number" step="0.1" className="input input-xs input-bordered w-full text-right font-mono"
                                                        value={settings.fuelPrices?.gasoline87 || 0}
                                                        onChange={(e) => updateSetting('fuelPrices', 'gasoline87', Number(e.target.value))} />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label py-0 mb-1"><span className="label-text text-[9px] font-bold text-slate-500">Premium</span></label>
                                                    <input type="number" step="0.1" className="input input-xs input-bordered w-full text-right font-mono"
                                                        value={settings.fuelPrices?.gasoline91 || 0}
                                                        onChange={(e) => updateSetting('fuelPrices', 'gasoline91', Number(e.target.value))} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Col 3: Maniobras */}
                                        <div className="space-y-3 pt-4 lg:pt-0 lg:pl-4">
                                            <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                                                <Users size={14} className="text-blue-500" /> Maniobras Base
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="form-control">
                                                    <label className="label py-0 mb-1"><span className="label-text text-[9px] font-bold text-slate-500">Carga</span></label>
                                                    <input type="number" className="input input-xs input-bordered w-full text-right font-mono"
                                                        value={settings.maneuverFees?.loading || 0}
                                                        onChange={(e) => updateSetting('maneuverFees', 'loading', Number(e.target.value))} />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label py-0 mb-1"><span className="label-text text-[9px] font-bold text-slate-500">Descarga</span></label>
                                                    <input type="number" className="input input-xs input-bordered w-full text-right font-mono"
                                                        value={settings.maneuverFees?.unloading || 0}
                                                        onChange={(e) => updateSetting('maneuverFees', 'unloading', Number(e.target.value))} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2: Service, Risk, Presentation (3 Cols) */}
                                    <div className="pt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6">

                                        {/* Col 1: Tipo de Servicio */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                                                <Warehouse size={14} className="text-blue-500" /> Tipo de Servicio
                                            </div>
                                            <div className="space-y-1">
                                                {[
                                                    { k: 'FTL', l: 'FTL (Completo)', desc: 'Servicio exclusivo (Full Truck Load). Se cobra el 100% de la tarifa base.' },
                                                    { k: 'PTL', l: 'PTL (Parcial)', desc: 'Servicio parcial (Partial Truck Load). Factor de ajuste para cargas que no llenan la unidad completa.' },
                                                    { k: 'LTL', l: 'LTL (Consolidado)', desc: 'Carga consolidada (Less than Truck Load). Factor para cargas pequeñas compartidas.' }
                                                ].map((item) => (
                                                    <div key={item.k} className="flex items-center justify-between" title={item.desc}>
                                                        <span className="text-[9px] font-bold text-slate-500 cursor-help decoration-dotted underline decoration-slate-300 underline-offset-2 whitespace-nowrap">{item.l}</span>
                                                        <div className="relative w-20">
                                                            <input type="number" step="0.05" className="input input-xs input-bordered w-full text-right px-1 font-mono h-5 text-[10px]"
                                                                value={(settings.transportRates as Record<string, number>)?.[item.k] || 1}
                                                                onChange={(e) => updateSetting('transportRates', item.k, Number(e.target.value))} />
                                                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400">x</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Col 2: Riesgo Carga */}
                                        <div className="lg:border-l lg:border-slate-100 lg:pl-6">
                                            <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                                                <AlertCircle size={14} className="text-orange-500" /> Riesgo Carga
                                            </div>
                                            <div className="space-y-1">
                                                {[
                                                    { k: 'hazardous', l: 'Peligroso', desc: 'Materiales Peligrosos (HazMat). Incremento por riesgo de manejo.' },
                                                    { k: 'perishable', l: 'Perecederos', desc: 'Perecederos / Cadena de frío. Incremento por requerimientos especiales (Reefer).' },
                                                    { k: 'machinery', l: 'Maquinaria', desc: 'Maquinaria Pesada / Sobredimensionada. Incremento por maniobras especiales.' },
                                                    { k: 'fragile', l: 'Frágil', desc: 'Carga Frágil / Delicada (Vidrio, Electrónica). Incremento por seguro y manejo.' }
                                                ].map((item) => (
                                                    <div key={item.k} className="flex items-center justify-between" title={item.desc}>
                                                        <span className="text-[9px] font-bold text-slate-500 cursor-help decoration-dotted underline decoration-slate-300 underline-offset-2 whitespace-nowrap">{item.l}</span>
                                                        <div className="relative w-20">
                                                            <input type="number" step="0.1" className="input input-xs input-bordered w-full text-right px-1 font-mono h-5 text-[10px]"
                                                                value={(settings.cargoRates as Record<string, number>)?.[item.k] || 1}
                                                                onChange={(e) => updateSetting('cargoRates', item.k, Number(e.target.value))} />
                                                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400">x</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Col 3: Presentación */}
                                        <div className="lg:border-l lg:border-slate-100 lg:pl-6">
                                            <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                                                <PackageIcon size={14} className="text-emerald-500" /> Presentación
                                            </div>
                                            <div className="space-y-1">
                                                {[
                                                    { k: 'Granel', l: 'Granel', desc: 'Carga a granel (sin empaque). Factor de ajuste por manejo.' },
                                                    { k: 'Paletizado', l: 'Paletizado', desc: 'Carga en tarimas (Pallets). Factor estándar.' },
                                                    { k: 'General', l: 'General', desc: 'Carga suelta o cajas. Factor base.' }
                                                ].map((item) => (
                                                    <div key={item.k} className="flex items-center justify-between" title={item.desc}>
                                                        <span className="text-[9px] font-bold text-slate-500 cursor-help decoration-dotted underline decoration-slate-300 underline-offset-2 whitespace-nowrap">{item.l}</span>
                                                        <div className="relative w-20">
                                                            <input type="number" step="0.1" className="input input-xs input-bordered w-full text-right px-1 font-mono h-5 text-[10px]"
                                                                value={settings.presentationRates?.[item.k] || 1}
                                                                onChange={(e) => updateSetting('presentationRates', item.k, Number(e.target.value))} />
                                                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400">x</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* 2. Vehicle Configuration */}
                            <div className="card bg-white border border-indigo-100 shadow-sm overflow-visible">
                                <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex items-center gap-2">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                        <Truck size={20} />
                                    </div>
                                    <h3 className="font-bold text-indigo-900 text-lg">Configuración de Vehículos</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {[
                                            { k: '500', l: 'Ligero (500kg)' },
                                            { k: '1500', l: 'Van (1.5T)' }, { k: '3500', l: '3.5 Ton' },
                                            { k: '10000', l: 'Rabón (10T)' }, { k: '14000', l: 'Torton (14T)' },
                                            { k: '24000', l: 'Tráiler (24T)' }
                                        ].map((item) => (
                                            <div key={item.k} className="p-5 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors shadow-sm flex flex-col h-full">
                                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/60">
                                                    <span className="text-base font-bold text-indigo-900">{item.l}</span>
                                                    <Info size={16} className="text-indigo-300" />
                                                </div>

                                                {/* Pricing Inputs */}
                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 ml-1">Banderazo</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                                            <input
                                                                type="number"
                                                                className="input input-sm input-bordered w-full pl-6 text-right font-mono font-bold text-slate-700 bg-white"
                                                                value={settings.weightRates?.[item.k] || 0}
                                                                onChange={(e) => updateSetting('weightRates', item.k, Number(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 ml-1">Tarifa / Km</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                                            <input
                                                                type="text"
                                                                readOnly
                                                                className="w-full text-right font-mono font-bold text-indigo-600 bg-indigo-50 border-none rounded focus:ring-0 pl-6 pr-2 py-1 h-8 text-sm"
                                                                value={(settings.vehicleDimensions as any)?.[item.k]?.pricePerKm || 0}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Dimensions Section */}
                                                <div className="mb-4">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2 ml-1">Dimensiones (Metros)</label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {['length', 'width', 'height'].map((d) => (
                                                            <div key={d} className="text-center relative">
                                                                <span className="absolute top-1 left-2 text-[8px] text-slate-400 font-bold uppercase z-10">{d.substring(0, 3)}</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="input input-sm input-bordered w-full text-right font-mono text-xs bg-white pt-4 px-2 h-10"
                                                                    placeholder="0.00"
                                                                    value={(settings.vehicleDimensions as any)?.[item.k]?.[d] || ''}
                                                                    onChange={(e) => {
                                                                        const current = (settings.vehicleDimensions as any)?.[item.k] || {};
                                                                        updateSetting('vehicleDimensions', item.k, { ...current, [d]: Number(e.target.value) });
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* FUEL CONFIG SECTION */}
                                                <div className="mt-auto bg-white p-3 rounded-lg border border-slate-200 shadow-inner">
                                                    <div className="flex items-center gap-1 mb-2 text-slate-400">
                                                        <Database size={12} />
                                                        <span className="text-[10px] font-bold uppercase">Configuración Combustible</span>
                                                    </div>
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="text-left text-slate-400 border-b border-slate-100">
                                                                <th className="font-medium pb-2 pl-1">Tipo</th>
                                                                <th className="font-medium pb-2 text-center">Uso</th>
                                                                <th className="font-medium pb-2 text-center">Km/L</th>
                                                                <th className="font-medium pb-2 text-right pr-1">$/Km</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {[
                                                                { id: 'diesel', label: 'Diesel', priceRef: settings.fuelPrices?.diesel || 0 },
                                                                { id: 'gasoline87', label: 'Magna', priceRef: settings.fuelPrices?.gasoline87 || 0 },
                                                                { id: 'gasoline91', label: 'Premium', priceRef: settings.fuelPrices?.gasoline91 || 0 }
                                                            ].map((fuel) => {
                                                                const vConfig = (settings.vehicleDimensions as any)?.[item.k] || {};
                                                                const fuelConfig = vConfig.fuelConfig?.[fuel.id] || { enabled: false, efficiency: 0 };
                                                                const costPerKm = (fuelConfig.efficiency > 0 && fuel.priceRef > 0) ? (fuel.priceRef / fuelConfig.efficiency) : 0;
                                                                const isActive = fuelConfig.enabled;

                                                                return (
                                                                    <tr key={fuel.id} className={`transition-colors ${isActive ? 'bg-indigo-50/50' : ''}`}>
                                                                        <td className="py-2.5 font-medium text-slate-600 pl-1">{fuel.label}</td>
                                                                        <td className="py-2.5 text-center">
                                                                            <input type="checkbox" className="checkbox checkbox-xs checkbox-primary rounded-[3px]"
                                                                                checked={fuelConfig.enabled}
                                                                                onChange={(e) => {
                                                                                    const isChecked = e.target.checked;
                                                                                    const currentConfig = (settings.vehicleDimensions as any)?.[item.k] || {};
                                                                                    const currentFuels = currentConfig.fuelConfig || {};

                                                                                    const newFuels = { ...currentFuels };
                                                                                    let newPricePerKm = currentConfig.pricePerKm;

                                                                                    if (isChecked) {
                                                                                        // Uncheck all others
                                                                                        ['diesel', 'gasoline87', 'gasoline91'].forEach(fid => {
                                                                                            const f = newFuels[fid] || { efficiency: 0, enabled: false };
                                                                                            newFuels[fid] = { ...f, enabled: fid === fuel.id };
                                                                                        });

                                                                                        // Auto-calc Rate when enabling
                                                                                        if (fuelConfig.efficiency > 0 && fuel.priceRef > 0) {
                                                                                            const cost = fuel.priceRef / fuelConfig.efficiency;
                                                                                            newPricePerKm = Number((cost * settings.profitMargin).toFixed(2));
                                                                                        }

                                                                                    } else {
                                                                                        // Simply uncheck this one
                                                                                        const f = newFuels[fuel.id] || { efficiency: 0, enabled: false };
                                                                                        newFuels[fuel.id] = { ...f, enabled: false };
                                                                                    }

                                                                                    updateSetting('vehicleDimensions', item.k, {
                                                                                        ...currentConfig,
                                                                                        pricePerKm: newPricePerKm,
                                                                                        fuelConfig: newFuels
                                                                                    });
                                                                                }} />
                                                                        </td>
                                                                        <td className="py-2.5 text-center">
                                                                            <input type="number" step="0.1"
                                                                                className={`input input-xs input-bordered !w-[60px] px-1 text-center bg-white font-bold text-slate-700`}
                                                                                value={fuelConfig.efficiency || ''}
                                                                                placeholder="-"
                                                                                onChange={(e) => {
                                                                                    const val = Number(e.target.value);
                                                                                    const currentConfig = (settings.vehicleDimensions as any)?.[item.k] || {};
                                                                                    const currentFuels = currentConfig.fuelConfig || {};

                                                                                    // Auto-calc if this fuel is active
                                                                                    let newPricePerKm = currentConfig.pricePerKm;
                                                                                    if (fuelConfig.enabled && val > 0 && fuel.priceRef > 0) {
                                                                                        const cost = fuel.priceRef / val;
                                                                                        newPricePerKm = Number((cost * settings.profitMargin).toFixed(2));
                                                                                    }

                                                                                    updateSetting('vehicleDimensions', item.k, {
                                                                                        ...currentConfig,
                                                                                        pricePerKm: newPricePerKm,
                                                                                        fuelConfig: {
                                                                                            ...currentFuels,
                                                                                            [fuel.id]: { ...fuelConfig, efficiency: val }
                                                                                        }
                                                                                    });
                                                                                }} />
                                                                        </td>
                                                                        <td className="py-2.5 text-right font-mono font-bold text-slate-700 pr-1">
                                                                            {costPerKm > 0 ? `$${costPerKm.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>                            {/* LIVE SIMULATOR (Integrated) */}
                            <div className="card bg-[var(--card-bg)] border-2 border-[var(--primary)]/20 shadow-2xl relative overflow-visible mt-8">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--primary)]"></div>
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                                                <Info size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-[var(--foreground)]">Simulador en Vivo</h3>
                                                <p className="text-sm text-[var(--secondary)]">Previsualiza el costo final mientras ajustas los parámetros.</p>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                                        <div>
                                            <label className="text-xs font-bold text-[var(--secondary)] mb-1 block">Distancia</label>
                                            <input type="range" min="50" max="3000" step="50"
                                                className="range range-xs range-primary w-full"
                                                value={sim.dist} onChange={(e) => setSim({ ...sim, dist: Number(e.target.value) })} />
                                            <div className="text-right text-xs font-bold font-mono mt-1">{sim.dist} km</div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--secondary)] mb-1 block">Peso (kg)</label>
                                            <div className="relative">
                                                <input type="number" min="1" className="input input-xs input-bordered w-full pr-8"
                                                    value={sim.weight} onChange={(e) => setSim({ ...sim, weight: Number(e.target.value) })} />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">kg</span>
                                            </div>
                                            {/* Auto-Selected Vehicle Display */}
                                            <div className="mt-1 flex items-center gap-1.5 p-1.5 bg-indigo-50 border border-indigo-100 rounded text-[10px] text-indigo-700 font-bold">
                                                <Truck size={12} />
                                                {(() => {
                                                    const weight = sim.weight;
                                                    let label = 'Ligero (500kg)';
                                                    if (weight > 500) label = 'Van (1.5T)';
                                                    if (weight > 1500) label = '3.5 Ton';
                                                    if (weight > 3500) label = 'Rabón (10T)';
                                                    if (weight > 10000) label = 'Torton (14T)';
                                                    if (weight > 14000) label = 'Tráiler (24T)';
                                                    return label;
                                                })()}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--secondary)] mb-1 block">Tipo</label>
                                            <select className="select select-bordered select-xs w-full"
                                                value={sim.transport} onChange={(e) => setSim({ ...sim, transport: e.target.value })}>
                                                <option value="FTL">FTL</option>
                                                <option value="PTL">PTL</option>
                                                <option value="LTL">LTL</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--secondary)] mb-1 block">Riesgo</label>
                                            <select className="select select-bordered select-xs w-full"
                                                value={sim.risk} onChange={(e) => setSim({ ...sim, risk: e.target.value })}>
                                                <option value="general">General</option>
                                                <option value="hazardous">Peligroso</option>
                                                <option value="perishable">Perecedero</option>
                                                <option value="fragile">Frágil</option>
                                                <option value="machinery">Maquinaria</option>
                                            </select>
                                        </div>

                                        <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-[var(--border)] mt-2">
                                            <div>
                                                <label className="text-xs font-bold text-[var(--secondary)] mb-1 block">Presentación</label>
                                                <select className="select select-bordered select-xs w-full"
                                                    value={sim.pres} onChange={(e) => setSim({ ...sim, pres: e.target.value })}>
                                                    <option value="General">General/Cajas</option>
                                                    <option value="Paletizado">Paletizado</option>
                                                    <option value="Granel">Granel</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-[var(--secondary)] mb-1 block">Peajes Estimados</label>
                                                <div className="relative">
                                                    <input type="number" min="0" className="input input-xs input-bordered w-full pl-6 text-right"
                                                        value={sim.tolls} onChange={(e) => setSim({ ...sim, tolls: Number(e.target.value) })} />
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-[var(--secondary)] mb-1 block">Valor Declarado</label>
                                                <div className="relative">
                                                    <input type="number" min="0" className="input input-xs input-bordered w-full pl-6 text-right"
                                                        value={sim.declaredValue} onChange={(e) => setSim({ ...sim, declaredValue: Number(e.target.value) })} />
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Insurance Toggle */}
                                        <div className="col-span-2 md:col-span-4 pt-2">
                                            <div className="flex gap-2 bg-[var(--background)] p-1 rounded-lg border border-[var(--border)] w-fit">
                                                <button type="button" onClick={() => setSim({ ...sim, insuranceSelection: 'jfc' })}
                                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${sim.insuranceSelection === 'jfc' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--secondary)] hover:bg-slate-100'}`}>
                                                    Seguro JFC ({(settings?.insuranceRate || 0)}%)
                                                </button>
                                                <button type="button" onClick={() => setSim({ ...sim, insuranceSelection: 'own' })}
                                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${sim.insuranceSelection === 'own' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--secondary)] hover:bg-slate-100'}`}>
                                                    Seguro Propio
                                                </button>
                                            </div>
                                        </div>

                                        <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                                            {[
                                                { key: 'loadingSupport', label: 'Carga', icon: <Users size={14} />, desc: 'Personal de carga' },
                                                { key: 'unloadingSupport', label: 'Descarga', icon: <Users size={14} />, desc: 'Personal de descarga' },
                                                { key: 'stackable', label: 'Estibable', icon: <PackageIcon size={14} />, desc: 'Se puede apilar' },
                                                { key: 'wrap', label: 'Emplayado', icon: <Box size={14} />, desc: 'Requiere protección' }
                                            ].map((opt) => (
                                                <div key={opt.key}
                                                    onClick={() => setSim({ ...sim, [opt.key]: !(sim as any)[opt.key] })}
                                                    className={`
                                                            cursor-pointer p-2 rounded-lg border transition-all duration-200 flex items-center gap-2 select-none
                                                            ${(sim as any)[opt.key]
                                                            ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] shadow-sm ring-1 ring-[var(--primary)]'
                                                            : 'bg-[var(--background)] border-[var(--border)] text-[var(--secondary)] hover:bg-slate-50'}
                                                        `}
                                                >
                                                    <div className={`
                                                            w-4 h-4 rounded border flex items-center justify-center transition-colors
                                                            ${(sim as any)[opt.key] ? 'bg-[var(--primary)] border-transparent' : 'border-slate-300'}
                                                        `}>
                                                        {(sim as any)[opt.key] && <Check size={10} className="text-white" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold uppercase leading-none">{opt.label}</span>
                                                        <span className="text-[9px] opacity-70 leading-none mt-0.5">{opt.desc}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* RESULT BLOCK (Moved to bottom) */}
                                    {/* RESULT BLOCK (Re-designed) */}
                                    <div className="mt-8 pt-6 border-t border-[var(--border)]">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                            {/* Breakdown List */}
                                            <div className="bg-[var(--background)] rounded-xl border border-[var(--border)] p-4 shadow-sm">
                                                <div className="text-xs font-bold text-[var(--secondary)] mb-3 pb-2 border-b border-[var(--border)]">Desglose Detallado</div>
                                                <div className="space-y-2">
                                                    {(() => {
                                                        const items = (simResult as any)?.billableLineItems || (simResult as any)?.breakdown || [];
                                                        if (items.length === 0) {
                                                            return <div className="text-xs text-slate-400 italic text-center py-2">Sin conceptos calculados</div>;
                                                        }
                                                        return items.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center text-sm group hover:bg-[var(--primary)]/5 p-1 rounded transition-colors">
                                                                <span className="text-slate-600">{item.label}</span>
                                                                <span className="font-mono font-medium text-[var(--foreground)]">
                                                                    ${(item.price ?? item.value ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                                                </span>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Totals & KPI */}
                                            <div className="flex flex-col gap-4">
                                                <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                                                    <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Total Estimado (MXN)</p>
                                                    <p className="text-4xl font-black font-mono tracking-tight text-white mb-2">
                                                        ${simResult?.total.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                                                    </p>
                                                    <p className="text-xs text-slate-300 flex items-center gap-2">
                                                        <Info size={12} /> Incluye IVA y márgenes
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Costo Kilométrico</p>
                                                        <p className="font-mono font-bold text-slate-700">
                                                            ${sim.dist > 0 ? ((simResult?.total || 0) / sim.dist).toLocaleString('es-MX', { maximumFractionDigits: 2 }) : '0.00'} <span className="text-[10px] font-normal text-slate-400">/km</span>
                                                        </p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Ref. Base</p>
                                                        <p className="font-mono font-bold text-slate-700">
                                                            ${(sim.dist * (settings?.kilometerRate || 0)).toLocaleString('es-MX')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </form>
                    </div>
                )
                }
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={<div className="container p-8 text-center">Cargando...</div>}>
            <AdminContent />
        </Suspense>
    );
}
