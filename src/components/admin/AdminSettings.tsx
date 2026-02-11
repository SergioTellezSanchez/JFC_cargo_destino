'use client';

import { useState } from 'react';
import { Settings, ChevronDown, Check, Save, Loader2, DollarSign, Activity, Percent, RotateCcw } from 'lucide-react';
import { PricingSettings } from '@/lib/firebase/schema';
import { DEFAULT_SETTINGS } from '@/lib/calculations';
import GeneralSettings from './settings/GeneralSettings';
import OperationalSettings from './settings/OperationalSettings';
import VehicleSettings from './settings/VehicleSettings';
import MarginSettings from './settings/MarginSettings';

interface AdminSettingsProps {
    settings: PricingSettings;
    loading: boolean;
    updateSetting: (section: keyof PricingSettings, key: string | null, value: unknown) => void;
    saveSettings: () => void;
}

export default function AdminSettings({ settings, loading, updateSetting, saveSettings }: AdminSettingsProps) {
    const [accordionOpen, setAccordionOpen] = useState({
        general: true,
        operational: false,
        vehicles: false,
        margins: false
    });

    const toggleAccordion = (key: keyof typeof accordionOpen) => {
        setAccordionOpen(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleReset = () => {
        if (!confirm('¿Estás seguro de restaurar los valores por defecto? Esto sobrescribirá toda la configuración actual.')) return;
        Object.keys(DEFAULT_SETTINGS).forEach(key => {
            updateSetting(key as any, null, (DEFAULT_SETTINGS as any)[key]);
        });
    };

    return (
        <div className="space-y-6">
            {/* Header / Save Action */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[var(--primary)] text-white rounded-xl shadow-lg shadow-indigo-200">
                        <Settings size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Configuración Global</h2>
                        <p className="text-sm text-slate-500 font-medium">Gestiona tarifas, costos y parámetros del sistema.</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={handleReset} disabled={loading} className="btn btn-ghost text-slate-500 hover:bg-slate-100 w-full md:w-auto gap-2">
                        <RotateCcw size={18} />
                        Restaurar Defaults
                    </button>
                    <button onClick={saveSettings} disabled={loading} className="btn btn-primary shadow-xl shadow-indigo-200 w-full md:w-auto gap-2 font-bold">
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                        Guardar Cambios
                    </button>
                </div>
            </div>

            {/* 1. CONFIGURACIÓN GENERAL */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden transition-all duration-200">
                <div onClick={() => toggleAccordion('general')}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none border-b border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${accordionOpen.general ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-slate-100 text-slate-500'}`}>
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Configuración General</h3>
                            <p className="text-xs text-slate-400 font-medium">Combustibles, maniobras y factores base</p>
                        </div>
                    </div>
                    <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${accordionOpen.general ? 'rotate-180' : ''}`} />
                </div>
                {accordionOpen.general && (
                    <GeneralSettings settings={settings} updateSetting={updateSetting} />
                )}
            </div>

            {/* 2. COSTOS OPERATIVOS */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden transition-all duration-200">
                <div onClick={() => toggleAccordion('operational')}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none border-b border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${accordionOpen.operational ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-slate-100 text-slate-500'}`}>
                            <Activity size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Costos Operativos</h3>
                            <p className="text-xs text-slate-400 font-medium">Salarios, GPS y Viáticos</p>
                        </div>
                    </div>
                    <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${accordionOpen.operational ? 'rotate-180' : ''}`} />
                </div>
                {accordionOpen.operational && (
                    <OperationalSettings settings={settings} updateSetting={updateSetting} />
                )}
            </div>

            {/* 3. CONFIGURACIÓN DE VEHÍCULOS */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden transition-all duration-200">
                <div onClick={() => toggleAccordion('vehicles')}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none border-b border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${accordionOpen.vehicles ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-slate-100 text-slate-500'}`}>
                            <Check size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Vehículos y Mantenimiento</h3>
                            <p className="text-xs text-slate-400 font-medium">Llantas, depreciación y dimensiones por unidad</p>
                        </div>
                    </div>
                    <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${accordionOpen.vehicles ? 'rotate-180' : ''}`} />
                </div>
                {accordionOpen.vehicles && (
                    <VehicleSettings settings={settings} updateSetting={updateSetting} />
                )}
            </div>

            {/* 4. MARGEN Y UTILIDAD */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden transition-all duration-200">
                <div onClick={() => toggleAccordion('margins')}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none border-b border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${accordionOpen.margins ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-slate-100 text-slate-500'}`}>
                            <Percent size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Margen y Utilidad</h3>
                            <p className="text-xs text-slate-400 font-medium">Ganancia global</p>
                        </div>
                    </div>
                    <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${accordionOpen.margins ? 'rotate-180' : ''}`} />
                </div>
                {accordionOpen.margins && (
                    <MarginSettings settings={settings} updateSetting={updateSetting} />
                )}
            </div>
        </div>
    );
}
