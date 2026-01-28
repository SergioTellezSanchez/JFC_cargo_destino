'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Truck, Save, DollarSign, Package as PackageIcon, Users, Warehouse, Plus, LayoutGrid, Database, Lock, AlertCircle, Info, HelpCircle, Box, Check } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/UserContext';
import { UserRole, PricingSettings } from '@/lib/firebase/schema';
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

    const updateSetting = (section: keyof PricingSettings, key: string | null, value: number) => {
        if (!settings) return;
        setSettings(prev => {
            if (!prev) return null;
            const updated = { ...prev };

            if (key) {
                // Handle nested object updates (e.g. weightRates['50'])
                // @ts-ignore
                updated[section] = {
                    // @ts-ignore
                    ...updated[section],
                    [key]: value
                };
            } else {
                // Handle top-level updates (e.g. basePrice)
                // @ts-ignore
                updated[section] = value;
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
                            <div className="space-y-8">
                                {/* 1. Global & Margins */}
                                {/* 1. Global Parameters (Compact) */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Margins */}
                                    <div className="card bg-white border border-slate-200 shadow-sm h-full">
                                        <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                                            <DollarSign size={18} className="text-slate-500" />
                                            <h3 className="font-bold text-slate-700 text-sm">Tarifas y Márgenes Base</h3>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            {/* Margen */}
                                            <div className="form-control w-full">
                                                <label className="label py-0 mb-1">
                                                    <span className="label-text text-[10px] font-bold text-slate-600">Margen Global</span>
                                                </label>
                                                <input type="number" step="0.05" className="input input-xs input-bordered w-full text-right font-mono"
                                                    value={settings.profitMargin || 0}
                                                    onChange={(e) => updateSetting('profitMargin', null, Number(e.target.value))} />
                                            </div>

                                            {/* Km Rate */}
                                            <div className="form-control w-full">
                                                <label className="label py-0 mb-1">
                                                    <span className="label-text text-[10px] font-bold text-slate-600">Tarifa por Km ($)</span>
                                                </label>
                                                <input type="number" step="1" className="input input-xs input-bordered w-full text-right font-mono"
                                                    value={settings.kilometerRate || 0}
                                                    onChange={(e) => updateSetting('kilometerRate', null, Number(e.target.value))} />
                                            </div>

                                            {/* Ton/Km Rate */}
                                            <div className="form-control w-full">
                                                <label className="label py-0 mb-1">
                                                    <span className="label-text text-[10px] font-bold text-slate-600">Tarifa Ton/Km ($)</span>
                                                </label>
                                                <input type="number" step="0.1" className="input input-xs input-bordered w-full text-right font-mono"
                                                    value={settings.tonKmRate || 0}
                                                    onChange={(e) => updateSetting('tonKmRate', null, Number(e.target.value))} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fuel Prices */}
                                    <div className="card bg-white border border-slate-200 shadow-sm h-full">
                                        <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-red-50/50">
                                            <div className="p-1 bg-red-100 rounded text-red-600"><AlertCircle size={14} /></div>
                                            <h3 className="font-bold text-slate-700 text-sm">Combustibles ($/L)</h3>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                                            <div className="form-control">
                                                <label className="label py-0 mb-1"><span className="label-text text-[10px] font-bold">Diesel</span></label>
                                                <input type="number" step="0.1" className="input input-xs input-bordered w-full text-right font-mono"
                                                    value={settings.fuelPrices?.diesel || 0}
                                                    onChange={(e) => updateSetting('fuelPrices', 'diesel', Number(e.target.value))} />
                                            </div>
                                            <div className="form-control">
                                                <label className="label py-0 mb-1"><span className="label-text text-[10px] font-bold">Magna (87)</span></label>
                                                <input type="number" step="0.1" className="input input-xs input-bordered w-full text-right font-mono"
                                                    value={settings.fuelPrices?.gasoline87 || 0}
                                                    onChange={(e) => updateSetting('fuelPrices', 'gasoline87', Number(e.target.value))} />
                                            </div>
                                            <div className="form-control">
                                                <label className="label py-0 mb-1"><span className="label-text text-[10px] font-bold">Premium (91)</span></label>
                                                <input type="number" step="0.1" className="input input-xs input-bordered w-full text-right font-mono"
                                                    value={settings.fuelPrices?.gasoline91 || 0}
                                                    onChange={(e) => updateSetting('fuelPrices', 'gasoline91', Number(e.target.value))} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Maneuvers (Base Costs) */}
                                    <div className="card bg-white border border-slate-200 shadow-sm h-full">
                                        <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-blue-50/50">
                                            <div className="p-1 bg-blue-100 rounded text-blue-600"><Users size={14} /></div>
                                            <h3 className="font-bold text-slate-700 text-sm">Maniobras Base</h3>
                                        </div>
                                        <div className="p-4 grid grid-cols-2 gap-2">
                                            <div className="form-control">
                                                <label className="label py-0 mb-1"><span className="label-text text-[10px] font-bold">Carga</span></label>
                                                <input type="number" className="input input-xs input-bordered w-full text-right font-mono"
                                                    value={settings.maneuverFees?.loading || 0}
                                                    onChange={(e) => updateSetting('maneuverFees', 'loading', Number(e.target.value))} />
                                            </div>
                                            <div className="form-control">
                                                <label className="label py-0 mb-1"><span className="label-text text-[10px] font-bold">Descarga</span></label>
                                                <input type="number" className="input input-xs input-bordered w-full text-right font-mono"
                                                    value={settings.maneuverFees?.unloading || 0}
                                                    onChange={(e) => updateSetting('maneuverFees', 'unloading', Number(e.target.value))} />
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[
                                                { k: '50', l: 'Paq. (<50kg)' }, { k: '500', l: 'Ligero (500kg)' },
                                                { k: '1500', l: 'Van (1.5T)' }, { k: '3500', l: '3.5 Ton' },
                                                { k: '10000', l: 'Rabón (10T)' }, { k: '14000', l: 'Torton (14T)' },
                                                { k: '24000', l: 'Tráiler (24T)' }
                                            ].map((item) => (
                                                <div key={item.k} className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative hover:border-indigo-200 transition-colors">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="text-sm font-bold text-indigo-800">{item.l}</span>
                                                        <div className="relative group">
                                                            <Info size={14} className="text-indigo-300 cursor-help" />
                                                            <div className="absolute right-0 bottom-full mb-1 w-56 p-2 bg-slate-800 text-white text-xs rounded hidden group-hover:block z-50 shadow-xl pointer-events-none">
                                                                Configura tarifa base, dimensiones y rendimiento para {item.l}.
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Base Price */}
                                                    <div className="form-control mb-3">
                                                        <label className="label py-0 mb-1"><span className="label-text text-[10px] font-bold text-slate-500 uppercase">Tarifa Base</span></label>
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

                                                    <div className="grid grid-cols-2 gap-3">
                                                        {/* Efficiency */}
                                                        <div className="form-control">
                                                            <label className="label py-0 mb-1"><span className="label-text text-[10px] font-bold text-slate-500 uppercase">Rendimiento (km/l)</span></label>
                                                            <input type="number" step="0.1" className="input input-xs input-bordered w-full text-center font-mono bg-white h-7"
                                                                value={(settings.vehicleDimensions as any)?.[item.k]?.efficiency || ''}
                                                                onChange={(e) => {
                                                                    const current = (settings.vehicleDimensions as any)?.[item.k] || { length: 0, width: 0, height: 0, efficiency: 0 };
                                                                    updateSetting('vehicleDimensions', item.k, { ...current, efficiency: Number(e.target.value) });
                                                                }}
                                                            />
                                                        </div>
                                                        {/* Fuel Type */}
                                                        <div className="form-control">
                                                            <label className="label py-0 mb-1"><span className="label-text text-[10px] font-bold text-slate-500 uppercase">Combustible</span></label>
                                                            <select className="select select-xs select-bordered w-full text-center font-mono bg-white h-7 leading-tight min-h-0"
                                                                value={(settings.vehicleDimensions as any)?.[item.k]?.fuelType || 'diesel'}
                                                                onChange={(e) => {
                                                                    const current = (settings.vehicleDimensions as any)?.[item.k] || { length: 0, width: 0, height: 0, efficiency: 0 };
                                                                    updateSetting('vehicleDimensions', item.k, { ...current, fuelType: e.target.value });
                                                                }}
                                                            >
                                                                <option value="diesel">Diesel</option>
                                                                <option value="gasoline87">Magna</option>
                                                                <option value="gasoline91">Premium</option>
                                                            </select>
                                                        </div>
                                                        {/* Dimensions */}
                                                        <div className="col-span-2 grid grid-cols-3 gap-1 pt-1 border-t border-slate-200 mt-1">
                                                            {['length', 'width', 'height'].map((d) => (
                                                                <div key={d} className="form-control relative tooltip" data-tip={d === 'length' ? 'Largo (m)' : d === 'width' ? 'Ancho (m)' : 'Alto (m)'}>
                                                                    <label className="label py-0 mb-0 justify-center"><span className="label-text text-[9px] text-slate-400 capitalize">{d.substring(0, 3)}.</span></label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        className="input input-xs input-bordered w-full text-center px-1 font-mono text-[10px] bg-white h-6"
                                                                        value={(settings.vehicleDimensions as any)?.[item.k]?.[d] || ''}
                                                                        onChange={(e) => {
                                                                            const current = (settings.vehicleDimensions as any)?.[item.k] || { length: 0, width: 0, height: 0, efficiency: 0 };
                                                                            updateSetting('vehicleDimensions', item.k, { ...current, [d]: Number(e.target.value) });
                                                                        }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Multipliers */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="card bg-white border border-blue-100 shadow-sm overflow-visible">
                                        <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex items-center gap-2">
                                            <Warehouse size={18} className="text-blue-600" />
                                            <h3 className="font-bold text-blue-900 m-0">Tipo de Servicio</h3>
                                        </div>
                                        <div className="p-6 space-y-3">
                                            {[
                                                { k: 'FTL', l: 'FTL (Completo)', desc: 'Servicio exclusivo (Full Truck Load). Se cobra el 100% de la tarifa base.' },
                                                { k: 'PTL', l: 'PTL (Parcial)', desc: 'Servicio parcial (Partial Truck Load). Factor de ajuste para cargas que no llenan la unidad completa.' },
                                                { k: 'LTL', l: 'LTL (Consolidado)', desc: 'Carga consolidada (Less than Truck Load). Factor para cargas pequeñas compartidas.' }
                                            ].map((item) => (
                                                <div key={item.k} className="flex items-center justify-between group">
                                                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                                        {item.l}
                                                        <div className="relative group/tooltip">
                                                            <HelpCircle size={12} className="text-blue-300 cursor-help" />
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-800 text-white text-xs rounded hidden group-hover/tooltip:block z-50 pointer-events-none shadow-lg">
                                                                {item.desc}
                                                            </div>
                                                        </div>
                                                    </span>
                                                    <div className="relative w-24">
                                                        <input type="number" step="0.05" className="input input-sm input-bordered w-full text-right pr-6"
                                                            value={(settings.transportRates as Record<string, number>)?.[item.k] || 1}
                                                            onChange={(e) => updateSetting('transportRates', item.k, Number(e.target.value))} />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">x</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="card bg-white border border-orange-100 shadow-sm overflow-visible">
                                        <div className="bg-orange-50/50 p-4 border-b border-orange-100 flex items-center gap-2">
                                            <AlertCircle size={18} className="text-orange-600" />
                                            <h3 className="font-bold text-orange-900 m-0">Riesgo Carga</h3>
                                        </div>
                                        <div className="p-6 grid grid-cols-2 gap-3">
                                            {[
                                                { k: 'hazardous', l: 'Peligroso', desc: 'Factor de incremento por manejo de materiales peligrosos (Hazardous Materials).' },
                                                { k: 'perishable', l: 'Perecederos', desc: 'Factor de incremento por manejo de cadena de frío o productos perecederos.' },
                                                { k: 'machinery', l: 'Maquinaria', desc: 'Factor de incremento por manejo de maquinaria pesada o sobredimensionada.' },
                                                { k: 'fragile', l: 'Frágil', desc: 'Factor de incremento por manejo delicado (vidrio, electrónica, etc).' }
                                            ].map((item) => (
                                                <div key={item.k} className="input-group">
                                                    <span className="text-xs font-bold text-orange-800 block mb-1 flex items-center gap-1">
                                                        {item.l}
                                                        <div className="relative group/tooltip">
                                                            <HelpCircle size={10} className="text-orange-300 cursor-help" />
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-800 text-white text-xs rounded hidden group-hover/tooltip:block z-50 pointer-events-none shadow-lg">
                                                                {item.desc}
                                                            </div>
                                                        </div>
                                                    </span>
                                                    <div className="relative">
                                                        <input type="number" step="0.1" className="input input-sm input-bordered w-full text-right pr-6"
                                                            value={(settings.cargoRates as Record<string, number>)?.[item.k] || 1}
                                                            onChange={(e) => updateSetting('cargoRates', item.k, Number(e.target.value))} />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">x</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Presentation */}
                                <div className="card bg-white border border-emerald-100 shadow-sm overflow-visible">
                                    <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex items-center gap-2">
                                        <PackageIcon size={18} className="text-emerald-600" />
                                        <h3 className="font-bold text-emerald-900 m-0">Presentación</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            {['Granel', 'Paletizado', 'General'].map((k) => (
                                                <div key={k}>
                                                    <span className="text-xs font-bold text-emerald-800 block mb-1 flex items-center gap-1">
                                                        {k}
                                                        <div className="relative group">
                                                            <HelpCircle size={10} className="text-emerald-300 cursor-help" />
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded hidden group-hover:block z-50 pointer-events-none shadow-lg">
                                                                Factor de ajuste para carga entregada como {k}.
                                                            </div>
                                                        </div>
                                                    </span>
                                                    <div className="relative">
                                                        <input type="number" step="0.1" className="input input-bordered w-full text-right pr-8"
                                                            value={settings.presentationRates?.[k] || 1}
                                                            onChange={(e) => updateSetting('presentationRates', k, Number(e.target.value))} />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">x</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* LIVE SIMULATOR (Integrated) */}
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
                                                <label className="text-xs font-bold text-[var(--secondary)] mb-1 block">Peso</label>
                                                <select className="select select-bordered select-xs w-full"
                                                    value={sim.weight} onChange={(e) => setSim({ ...sim, weight: Number(e.target.value) })}>
                                                    <option value="40">Paquete (40kg)</option>
                                                    <option value="500">Pick-up (500kg)</option>
                                                    <option value="1500">Van (1.5T)</option>
                                                    <option value="3500">3.5 Ton</option>
                                                    <option value="10000">Rabón (10T)</option>
                                                    <option value="24000">Tráiler (24T)</option>
                                                </select>
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
                                                    <label className="text-xs font-bold text-[var(--secondary)] mb-1 block">Cantidad</label>
                                                    <div className="relative">
                                                        <input type="number" min="1" className="input input-xs input-bordered w-full pr-8"
                                                            value={sim.qty} onChange={(e) => setSim({ ...sim, qty: Number(e.target.value) })} />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">#</span>
                                                    </div>
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
                                                        {simResult?.breakdown?.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-sm group hover:bg-[var(--primary)]/5 p-1 rounded transition-colors">
                                                                <span className="text-slate-600">{item.label}</span>
                                                                <span className="font-mono font-medium text-[var(--foreground)]">
                                                                    ${item.price.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {(!simResult?.breakdown || simResult?.breakdown?.length === 0) && (
                                                            <div className="text-xs text-slate-400 italic text-center py-2">Sin conceptos calculados</div>
                                                        )}
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
                            </div>
                        </form>
                    </div>
                )
                }


            </div >
        </div >
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={<div className="container p-8 text-center">Cargando...</div>}>
            <AdminContent />
        </Suspense>
    );
}
