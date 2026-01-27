'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Truck, DollarSign, Shield, Package, Settings, Sliders } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { PricingSettings } from '@/lib/firebase/schema';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [settings, setSettings] = useState<PricingSettings>({
        insuranceRate: 1.5,
        profitMargin: 1.4,
        basePrice: 1000,
        kilometerRate: 25,
        imponderablesRate: 3.0,
        cargoRates: { hazardous: 1.5, perishable: 1.3, fragile: 1.2, machinery: 1.4 },
        maneuverFees: { loading: 500, unloading: 500 },
        packagingFees: { stretchWrap: 200, stackable: 0 },
        serviceMultipliers: { express: 1.4, roundTrip: 1.8, weekend: 1.2 }
    } as any);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await authenticatedFetch('/api/settings');
            if (!res.ok) throw new Error('Failed to load settings');
            const data = await res.json();
            // Merge defaults in case new fields are missing from DB
            setSettings(prev => ({
                ...prev,
                ...data,
                // Ensure nested objects exist
                cargoRates: { ...prev.cargoRates, ...(data.cargoRates || {}) },
                maneuverFees: { ...prev.maneuverFees, ...(data.maneuverFees || {}) },
                packagingFees: { ...prev.packagingFees, ...(data.packagingFees || {}) },
                serviceMultipliers: { ...prev.serviceMultipliers, ...(data.serviceMultipliers || {}) },
            }));
        } catch (err) {
            console.error(err);
            setError('Could not load configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await authenticatedFetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (!res.ok) throw new Error('Failed to save settings');
            setSuccess('Configuration updated successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    // Helper to update state deeply
    const update = (path: string, val: number) => {
        const value = Number(val);
        setSettings(prev => {
            const parts = path.split('.');
            if (parts.length === 1) return { ...prev, [parts[0]]: value };

            // Handle 2 levels for now (e.g. cargoRates.hazardous)
            const [parent, child] = parts;
            return {
                ...prev,
                [parent]: {
                    ...((prev as any)[parent] || {}),
                    [child]: value
                }
            };
        });
    };

    if (loading) return <div className="p-10 text-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div></div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Configuración Global</h1>
                    <p className="text-slate-500 mt-1">Parámetros de cálculo para cotizaciones y costos.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
                >
                    {saving ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white rounded-full border-t-transparent"></span> : <Save size={20} />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3"><AlertCircle /> {error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-4 rounded-xl flex items-center gap-3"><CheckCircle /> {success}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. BASE PRICING */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><DollarSign size={20} /></div>
                        Tarifas Base
                    </h3>
                    <div className="space-y-4">
                        <InputNumber label="Precio Base por KM (MXN)" value={settings.kilometerRate || 0} onChange={v => update('kilometerRate', v)} prefix="$" />
                        <InputNumber label="Costo Mínimo de Viaje (Base)" value={settings.basePrice || 0} onChange={v => update('basePrice', v)} prefix="$" />
                        <div className="grid grid-cols-2 gap-4">
                            <InputNumber label="Margen Comercial" value={settings.profitMargin || 0} onChange={v => update('profitMargin', v)} step={0.1} />
                            <InputNumber label="Tasa de Seguro (%)" value={settings.insuranceRate || 0} onChange={v => update('insuranceRate', v)} step={0.1} suffix="%" />
                            <InputNumber label="Imponderables (%)" value={settings.imponderablesRate || 0} onChange={v => update('imponderablesRate', v)} step={0.1} suffix="%" />
                        </div>
                    </div>
                </div>

                {/* 2. RISK MULTIPLIERS */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Shield size={20} /></div>
                        Multiplicadores por Riesgo
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <InputNumber label="Químicos / Peligroso" value={settings.cargoRates?.hazardous || 0} onChange={v => update('cargoRates.hazardous', v)} step={0.1} />
                        <InputNumber label="Perecederos" value={settings.cargoRates?.perishable || 0} onChange={v => update('cargoRates.perishable', v)} step={0.1} />
                        <InputNumber label="Frágil" value={settings.cargoRates?.fragile || 0} onChange={v => update('cargoRates.fragile', v)} step={0.1} />
                        <InputNumber label="Maquinaria / Pesado" value={settings.cargoRates?.machinery || 0} onChange={v => update('cargoRates.machinery', v)} step={0.1} />
                    </div>
                    <p className="text-xs text-slate-400 mt-4 bg-slate-50 p-3 rounded">
                        * Estos factores multiplican la tarifa base. Ej: 1.5 significa +50% de costo.
                    </p>
                </div>

                {/* 3. MANEUVER FEES */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Package size={20} /></div>
                        Tarifas Fijas (Maniobras)
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InputNumber label="Carga Manual" value={settings.maneuverFees?.loading || 0} onChange={v => update('maneuverFees.loading', v)} prefix="$" />
                            <InputNumber label="Descarga Manual" value={settings.maneuverFees?.unloading || 0} onChange={v => update('maneuverFees.unloading', v)} prefix="$" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputNumber label="Emplayado Total" value={settings.packagingFees?.stretchWrap || 0} onChange={v => update('packagingFees.stretchWrap', v)} prefix="$" />
                            <InputNumber label="Estibable (Descuento/Cargo)" value={settings.packagingFees?.stackable || 0} onChange={v => update('packagingFees.stackable', v)} prefix="$" />
                        </div>
                    </div>
                </div>

                {/* 4. SERVICE MULTIPLIERS */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600"><Sliders size={20} /></div>
                        Niveles de Servicio
                    </h3>
                    <div className="space-y-4">
                        <InputNumber label="Servicio Express (Urgente)" value={settings.serviceMultipliers?.express || 0} onChange={v => update('serviceMultipliers.express', v)} step={0.1} />

                        <div className="grid grid-cols-2 gap-4">
                            <InputNumber label="Viaje Redondo (Round Trip)" value={settings.serviceMultipliers?.roundTrip || 0} onChange={v => update('serviceMultipliers.roundTrip', v)} step={0.1} />
                            <InputNumber label="Fin de Semana / Festivo" value={settings.serviceMultipliers?.weekend || 0} onChange={v => update('serviceMultipliers.weekend', v)} step={0.1} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InputNumber({ label, value, onChange, prefix, suffix, step = 1 }: { label: string, value: number, onChange: (v: number) => void, prefix?: string, suffix?: string, step?: number }) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
            <div className="relative">
                {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{prefix}</span>}
                <input
                    type="number"
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value))}
                    step={step}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:text-sm ${prefix ? 'pl-8' : 'pl-3'} ${suffix ? 'pr-8' : 'pr-3'}`}
                />
                {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{suffix}</span>}
            </div>
        </div>
    );
}
