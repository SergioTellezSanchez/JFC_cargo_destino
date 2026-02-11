'use client';

import { useState } from 'react';
import { Truck, Info, Box, Check, Users, Calendar, Shield, CreditCard } from 'lucide-react';
import { PricingSettings } from '@/lib/firebase/schema';
import { calculateLogisticsCosts, VEHICLE_TYPES } from '@/lib/calculations';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';

interface AdminSimulatorProps {
    settings: PricingSettings;
}

export default function AdminSimulator({ settings }: AdminSimulatorProps) {
    const { language } = useLanguage();
    const t = useTranslation(language);

    /**
     * Component State
     * @property sim - Single source of truth for simulator state
     * 
     * ARCHITECTURAL NOTE:
     * We use `translate="no"` in layout.tsx to prevent browser extensions (Google Translate)
     * from mutating the DOM and breaking React's text node bindings for numbers.
     */
    const [sim, setSim] = useState({
        distanceOutbound: 500,
        distanceReturn: 500, // Split Distance
        vehicleId: 'van',
        transport: 'FTL',
        risk: 'general',
        qty: 1,
        loadingSupport: true,
        unloadingSupport: true,
        stackable: false,
        wrap: false,
        tollsOutbound: 0,
        tollsReturn: 0,
        declaredValue: 0,
        insuranceSelection: 'jfc',


    });

    /**
     * Quote Calculator Hook
     * Connected directly to sim.dist as per user request (no debounce/deferred).
     */
    const { result, isCalculating, error } = useQuoteCalculator({
        weight: VEHICLE_TYPES.find(v => v.id === sim.vehicleId)?.capacity || 1000,
        distanceOutbound: sim.distanceOutbound,
        distanceReturn: sim.distanceReturn,
        settings: settings,
        manualVehicleId: sim.vehicleId,
        transportType: sim.transport as any,
        cargoType: sim.risk as any,
        volume: 0,
        requiresLoadingSupport: sim.loadingSupport,
        requiresUnloadingSupport: sim.unloadingSupport,
        insuranceSelection: sim.insuranceSelection as any,
        value: sim.declaredValue,
        tollsOutbound: sim.tollsOutbound,
        tollsReturn: sim.tollsReturn,


    });

    return (
        <div className="mt-8">
            <div className="card bg-[var(--card-bg)] border-2 border-[var(--primary)]/20 shadow-2xl relative overflow-visible mt-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--primary)]"></div>
                <div className="p-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                                <Info size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--foreground)]">{t('liveSimulator')}</h3>
                                <p className="text-sm text-[var(--secondary)]">{t('liveSimulatorDescription')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Controls Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                        {/* COLUMN 1: Core Logistics (Distance, Vehicle, Type) - Spans 4 cols */}
                        <div className="md:col-span-4 space-y-5">
                            {/* Distance Controls */}
                            <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border)] shadow-sm space-y-4">
                                {/* Outbound */}
                                <div>
                                    <label className="text-xs font-bold text-[var(--secondary)] mb-1 block flex justify-between items-center">
                                        <span>{t('distance')} ({t('outbound')})</span>
                                        <div className="flex items-center gap-1">
                                            <input type="number" min="0" max="5000" step="1"
                                                className="input input-xs input-bordered w-20 text-right font-mono text-[var(--primary)] pr-1"
                                                value={sim.distanceOutbound}
                                                onChange={(e) => setSim(prev => ({ ...prev, distanceOutbound: Math.max(0, Number(e.target.value)) }))} />
                                            <span className="text-[var(--primary)] font-mono text-xs">km</span>
                                        </div>
                                    </label>
                                    <input type="range" min="0" max="3000" step="1"
                                        className="range range-xs range-primary w-full"
                                        value={sim.distanceOutbound}
                                        onChange={(e) => setSim(prev => ({ ...prev, distanceOutbound: Number(e.target.value) }))} />
                                </div>

                                {/* Return */}
                                <div>
                                    <label className="text-xs font-bold text-[var(--secondary)] mb-1 block flex justify-between items-center">
                                        <span>{t('distance')} ({t('return')})</span>
                                        <div className="flex items-center gap-1">
                                            <input type="number" min="0" max="5000" step="1"
                                                className="input input-xs input-bordered w-20 text-right font-mono text-[var(--primary)] pr-1"
                                                value={sim.distanceReturn}
                                                onChange={(e) => setSim(prev => ({ ...prev, distanceReturn: Math.max(0, Number(e.target.value)) }))} />
                                            <span className="text-[var(--primary)] font-mono text-xs">km</span>
                                        </div>
                                    </label>
                                    <input type="range" min="0" max="3000" step="1"
                                        className="range range-xs range-secondary w-full"
                                        value={sim.distanceReturn}
                                        onChange={(e) => setSim(prev => ({ ...prev, distanceReturn: Number(e.target.value) }))} />
                                </div>

                                <div className="flex justify-end pt-2 border-t border-slate-100">
                                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-500 font-bold flex items-center gap-1">
                                        <Calendar size={10} />
                                        {Math.max(1, Math.ceil((sim.distanceOutbound + sim.distanceReturn) / (settings.financialFactors?.driverKmPerDay || 600)))} {t('days')}
                                    </span>
                                </div>
                            </div>

                            {/* Vehicle & Capacity */}
                            <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
                                <label className="text-xs font-bold text-[var(--secondary)] mb-2 block">{t('vehicle')}</label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Truck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            className="select select-bordered select-sm w-full pl-10 font-medium"
                                            value={sim.vehicleId}
                                            onChange={(e) => setSim({ ...sim, vehicleId: e.target.value })}
                                        >
                                            {VEHICLE_TYPES.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="font-bold text-slate-700">{t('capacity')}:</span>
                                        <span>{VEHICLE_TYPES.find(v => v.id === sim.vehicleId)?.capacity.toLocaleString()} kg</span>
                                    </div>
                                </div>
                            </div>

                            {/* Transport Type */}
                            <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
                                <label className="text-xs font-bold text-[var(--secondary)] mb-2 block">{t('type')}</label>
                                <select className="select select-bordered select-sm w-full font-medium"
                                    value={sim.transport} onChange={(e) => setSim({ ...sim, transport: e.target.value })}>
                                    <option value="FTL">{t('ftl')}</option>
                                    <option value="PTL">{t('ptl')}</option>
                                    <option value="LTL">{t('ltl')}</option>
                                </select>
                            </div>
                        </div>

                        {/* COLUMN 2: Configuration (Tolls, Insurance, Risk) - Spans 4 cols */}
                        <div className="md:col-span-4 space-y-5">
                            {/* Insurance & Value Group */}
                            <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border)] shadow-sm h-full flex flex-col">
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-[var(--secondary)] mb-2 block flex items-center gap-2">
                                        <Shield size={14} /> {t('insurance')}
                                    </label>

                                    {/* Insurance Toggle */}
                                    <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                                        <button type="button" onClick={() => setSim({ ...sim, insuranceSelection: 'jfc' })}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sim.insuranceSelection === 'jfc' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                            {t('jfcInsurance')} ({settings?.insuranceRate || 0}%)
                                        </button>
                                        <button type="button" onClick={() => setSim({ ...sim, insuranceSelection: 'own' })}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sim.insuranceSelection === 'own' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                            {t('ownInsurance')}
                                        </button>
                                    </div>

                                    {/* Declared Value - Only visible when JFC insurance is active */}
                                    {sim.insuranceSelection === 'jfc' && (
                                        <>
                                            <label className="text-xs font-semibold text-[var(--secondary)] mb-1 block pl-1">
                                                {t('declaredValue')}
                                            </label>
                                            <div className="relative">
                                                <input type="number" min="0" className="input input-sm input-bordered w-full pl-8 text-right font-mono"
                                                    value={sim.declaredValue}
                                                    onChange={(e) => setSim({ ...sim, declaredValue: Number(e.target.value) })} />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">$</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="border-t border-slate-100 pt-4 mt-auto">
                                    <label className="text-xs font-bold text-[var(--secondary)] mb-2 block">{t('estimatedTolls')} - Ida</label>
                                    <div className="relative mb-2">
                                        <input type="number" min="0" className="input input-sm input-bordered w-full pl-8 text-right font-mono"
                                            value={sim.tollsOutbound} onChange={(e) => setSim({ ...sim, tollsOutbound: Number(e.target.value) })} />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">$</span>
                                    </div>
                                    <label className="text-xs font-bold text-[var(--secondary)] mb-2 block">{t('estimatedTolls')} - Regreso</label>
                                    <div className="relative">
                                        <input type="number" min="0" className="input input-sm input-bordered w-full pl-8 text-right font-mono"
                                            value={sim.tollsReturn} onChange={(e) => setSim({ ...sim, tollsReturn: Number(e.target.value) })} />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">$</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 3: Operational Extras - Spans 4 cols */}
                        <div className="md:col-span-4 space-y-4">
                            <label className="text-xs font-bold text-[var(--secondary)] block uppercase tracking-wider mb-2">{t('operationalServices')}</label>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { key: 'loadingSupport', label: t('simLoading'), icon: <Users size={16} />, desc: t('loadingPersonnel') },
                                    { key: 'unloadingSupport', label: t('simUnloading'), icon: <Users size={16} />, desc: t('unloadingPersonnel') },
                                    { key: 'stackable', label: t('stackable'), icon: <Box size={16} />, desc: t('canBeStacked') },
                                    { key: 'wrap', label: t('stretchWrap'), icon: <Box size={16} />, desc: t('requiresProtection') }
                                ].map((opt) => (
                                    <div key={opt.key}
                                        onClick={() => setSim({ ...sim, [opt.key]: !(sim as any)[opt.key] })}
                                        className={`
                                                cursor-pointer p-3 rounded-xl border transition-all duration-200 flex items-center justify-between select-none
                                                ${(sim as any)[opt.key]
                                                ? 'bg-[var(--primary)]/5 border-[var(--primary)] shadow-sm'
                                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                                            `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${(sim as any)[opt.key] ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-slate-100 text-slate-400'}`}>
                                                {opt.icon}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-bold ${(sim as any)[opt.key] ? 'text-[var(--primary)]' : 'text-slate-600'}`}>{opt.label}</span>
                                                <span className="text-[10px] text-slate-400">{opt.desc}</span>
                                            </div>
                                        </div>
                                        <div className={`
                                                w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                                ${(sim as any)[opt.key] ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-slate-300'}
                                            `}>
                                            {(sim as any)[opt.key] && <Check size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>


                    {/* FINANCIAL RESULT */}
                    <div className="mt-8 pt-6 border-t border-[var(--border)]">
                        {/* Always render, just show loading state if needed */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                            {/* Loading Overlay */}
                            {isCalculating && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl transition-opacity duration-200">
                                    <div className="bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-slate-200">
                                        <span className="loading loading-spinner loading-xs text-[var(--primary)]"></span>
                                        <span className="text-xs font-bold text-slate-600">Calculando...</span>
                                    </div>
                                </div>
                            )}

                            {/* Left: Detailed Costs Table */}
                            <div className="space-y-6">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                                            <tr>
                                                <th className="py-3 px-4 text-left">{t('concept')}</th>
                                                <th className="py-3 px-4 text-right">{t('outbound')}</th>
                                                <th className="py-3 px-4 text-right">{t('return')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {[
                                                { l: t('simFuel'), k: 'fuel' },
                                                { l: t('simTires'), k: 'tires' },
                                                { l: t('simDepreciation'), k: 'depreciation' },
                                                { l: t('simGps'), k: 'gps' },
                                                { l: t('simOperator'), k: 'driverBase' },
                                                { l: t('simPerDiem'), k: 'driverViaticos' },
                                                { l: t('simTolls'), k: 'tolls' },
                                                { l: t('simManeuvers'), k: 'maneuvers' }
                                            ].map((row) => {
                                                const outVal = result?.breakdown?.outbound?.[row.k as keyof typeof result.breakdown.outbound];
                                                const retVal = result?.breakdown?.returnTrip?.[row.k as keyof typeof result.breakdown.returnTrip];
                                                return (
                                                    <tr key={row.k} className="hover:bg-white transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-slate-700">{row.l}</td>
                                                        <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                                                            {(outVal || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                                                            {(retVal || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            <tr className="bg-indigo-50 font-bold border-t border-indigo-100/50">
                                                <td className="py-3 px-4 text-indigo-900">{t('totalOperational')}</td>
                                                <td className="py-3 px-4 text-right text-indigo-700">
                                                    {(result?.breakdown?.outbound?.operationalTotal || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </td>
                                                <td className="py-3 px-4 text-right text-indigo-700">
                                                    {(result?.breakdown?.returnTrip?.operationalTotal || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right: Financial Summary */}
                            <div className="space-y-4">
                                <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden z-0">
                                    {/* Decorative sphere - moved to negative z-index or handled carefully */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 blur-2xl pointer-events-none"></div>

                                    <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1 relative z-10">{t('clientPriceTotal')}</p>
                                    <p className="text-4xl font-black font-mono tracking-tight text-white mb-2 relative z-10">
                                        {result?.priceToClient !== undefined
                                            ? result.priceToClient.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
                                            : '$0.00'}
                                    </p>
                                    <p className="text-xs text-slate-300 flex items-center gap-2 relative z-10">
                                        <Info size={12} /> {t('includesVATAndMargins')}
                                    </p>
                                    {(result as any)?.minimumApplied && (
                                        <p className="text-[10px] text-amber-400/80 flex items-center gap-1.5 mt-1.5 relative z-10">
                                            <Shield size={10} /> Precio mínimo aplicado ({((result as any)?.vehicleMinimum || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} + IVA)
                                        </p>
                                    )}
                                </div>

                                {/* Financial Breakdown Table: Split by Outbound / Return */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                                            <tr>
                                                <th className="py-2.5 px-4 text-left">{t('concept')}</th>
                                                <th className="py-2.5 px-4 text-right">{t('outbound')}</th>
                                                <th className="py-2.5 px-4 text-right">{t('return')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {/* Global Operational Total */}
                                            <tr className="hover:bg-slate-50 transition-colors">
                                                <td className="py-2.5 px-4 font-medium text-slate-700">{t('totalOperational')}</td>
                                                <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                                                    {(result?.breakdown?.outbound?.operationalTotal || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                                                    {(result?.breakdown?.returnTrip?.operationalTotal || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </td>
                                            </tr>
                                            {/* Unforeseen Expenses */}
                                            <tr className="hover:bg-orange-50/50 transition-colors text-orange-600">
                                                <td className="py-2.5 px-4 font-medium">{t('unforeseenExpenses')}</td>
                                                <td className="py-2.5 px-4 text-right font-mono">
                                                    {(result?.breakdown?.outbound?.imponderables || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono opacity-70">
                                                    {(result?.breakdown?.returnTrip?.imponderables || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </td>
                                            </tr>
                                            {/* Carrier Margin */}
                                            <tr className="bg-blue-50/50 hover:bg-blue-50 transition-colors text-blue-600 font-bold">
                                                <td className="py-2.5 px-4">{t('carrierMargin')}</td>
                                                <td className="py-2.5 px-4 text-right font-mono">
                                                    {(result?.breakdown?.outbound?.carrierMargin || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono opacity-70">
                                                    {(result?.breakdown?.returnTrip?.carrierMargin || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </td>
                                            </tr>
                                            {/* JFC Utility */}
                                            <tr className="bg-emerald-50/50 hover:bg-emerald-50 transition-colors text-emerald-600 font-bold">
                                                <td className="py-2.5 px-4">{t('jfcUtility')}</td>
                                                <td className="py-2.5 px-4 text-right font-mono">
                                                    {(result?.breakdown?.outbound?.jfcUtility || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono opacity-70">
                                                    {(result?.breakdown?.returnTrip?.jfcUtility || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

