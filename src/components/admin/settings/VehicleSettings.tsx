'use client';

import { Info, Database } from 'lucide-react';
import { PricingSettings } from '@/lib/firebase/schema';
import { VEHICLE_TYPES } from '@/lib/calculations';

interface VehicleSettingsProps {
    settings: PricingSettings;
    updateSetting: (section: keyof PricingSettings, key: string | null, value: unknown) => void;
}

export default function VehicleSettings({ settings, updateSetting }: VehicleSettingsProps) {
    return (
        <div className="p-6 border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-200">
            {/* Global Fuel Prices */}
            <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-sm uppercase tracking-wider">
                    <Database size={16} className="text-red-500" /> Precios de Combustible ($/L)
                </div>
                <div className="grid grid-cols-3 gap-4 max-w-3xl">
                    <div className="form-control">
                        <label className="label py-0 mb-1"><span className="label-text text-xs font-bold text-slate-500">Diesel</span></label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                            <input type="number" step="0.1" className="input input-sm input-bordered w-full pl-6 text-right font-mono font-bold"
                                value={settings.fuelPrices?.diesel || 0}
                                onChange={(e) => updateSetting('fuelPrices', 'diesel', Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="form-control">
                        <label className="label py-0 mb-1"><span className="label-text text-xs font-bold text-slate-500">Magna (Regular)</span></label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                            <input type="number" step="0.1" className="input input-sm input-bordered w-full pl-6 text-right font-mono font-bold"
                                value={settings.fuelPrices?.gasoline87 || 0}
                                onChange={(e) => updateSetting('fuelPrices', 'gasoline87', Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="form-control">
                        <label className="label py-0 mb-1"><span className="label-text text-xs font-bold text-slate-500">Premium</span></label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                            <input type="number" step="0.1" className="input input-sm input-bordered w-full pl-6 text-right font-mono font-bold"
                                value={settings.fuelPrices?.gasoline91 || 0}
                                onChange={(e) => updateSetting('fuelPrices', 'gasoline91', Number(e.target.value))} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {VEHICLE_TYPES.map((v) => {
                    // Adapter: v.id is the key, v.name is the label
                    // We map valid IDs from calculations to the settings UI
                    return (
                        <div key={v.id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors shadow-sm flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/60">
                                <span className="text-base font-bold text-indigo-900">{v.name}</span>
                                <Info size={16} className="text-indigo-300" />
                            </div>

                            {/* Pricing Inputs */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 ml-1">Precio Mínimo</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                        <input type="text" className="input input-sm input-bordered w-full pl-6 text-right font-mono font-bold text-slate-700 bg-white"
                                            placeholder={String(settings.basePrice || 1500)}
                                            value={(settings.vehicleDimensions as any)?.[v.id]?.minPrice?.toLocaleString('en-US') ?? ''}
                                            onChange={(e) => {
                                                const val = Number(e.target.value.replace(/,/g, ''));
                                                if (isNaN(val)) return;
                                                const current = (settings.vehicleDimensions as any)?.[v.id] || {};
                                                updateSetting('vehicleDimensions', v.id, { ...current, minPrice: val });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 ml-1">Tarifa / Km</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                        <input type="text" readOnly className="w-full text-right font-mono font-bold text-indigo-600 bg-indigo-50 border-none rounded focus:ring-0 pl-6 pr-2 py-1 h-8 text-sm"
                                            value={(settings.vehicleDimensions as any)?.[v.id]?.pricePerKm || 0} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 mb-4 shadow-sm">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 border-b border-slate-50 pb-1">Costos Específicos</div>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="form-control">
                                        <label className="label py-0"><span className="label-text text-[9px] font-bold text-slate-500">Núm. Llantas</span></label>
                                        <input type="text" className="input input-xs input-bordered w-full text-center"
                                            placeholder={String(v.id === 'trailer' ? 18 : 6)}
                                            value={(settings.vehicleDimensions as any)?.[v.id]?.tireCount?.toLocaleString('en-US') ?? ''}
                                            onChange={(e) => {
                                                const val = Number(e.target.value.replace(/,/g, ''));
                                                if (isNaN(val)) return;
                                                const current = (settings.vehicleDimensions as any)?.[v.id] || {};
                                                updateSetting('vehicleDimensions', v.id, { ...current, tireCount: val });
                                            }} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label py-0"><span className="label-text text-[9px] font-bold text-slate-500">Costo Llanta</span></label>
                                        <input type="text" className="input input-xs input-bordered w-full text-right"
                                            placeholder="$ 5,000"
                                            value={(settings.vehicleDimensions as any)?.[v.id]?.tirePrice?.toLocaleString('en-US') ?? ''}
                                            onChange={(e) => {
                                                const val = Number(e.target.value.replace(/,/g, ''));
                                                if (isNaN(val)) return;
                                                const current = (settings.vehicleDimensions as any)?.[v.id] || {};
                                                updateSetting('vehicleDimensions', v.id, { ...current, tirePrice: val });
                                            }} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label py-0"><span className="label-text text-[9px] font-bold text-slate-500">Vida Llantas (Km)</span></label>
                                        <input type="text" className="input input-xs input-bordered w-full text-right"
                                            placeholder="100,000"
                                            value={(settings.vehicleDimensions as any)?.[v.id]?.tireLifeKm?.toLocaleString('en-US') ?? ''}
                                            onChange={(e) => {
                                                const val = Number(e.target.value.replace(/,/g, ''));
                                                if (isNaN(val)) return;
                                                const current = (settings.vehicleDimensions as any)?.[v.id] || {};
                                                updateSetting('vehicleDimensions', v.id, { ...current, tireLifeKm: val });
                                            }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="form-control">
                                        <label className="label py-0"><span className="label-text text-[9px] font-bold text-slate-500">Valor Vehículo</span></label>
                                        <input type="text" className="input input-xs input-bordered w-full text-right"
                                            placeholder="$ 1M"
                                            value={(settings.vehicleDimensions as any)?.[v.id]?.vehicleValue?.toLocaleString('en-US') ?? ''}
                                            onChange={(e) => {
                                                const val = Number(e.target.value.replace(/,/g, ''));
                                                if (isNaN(val)) return;
                                                const current = (settings.vehicleDimensions as any)?.[v.id] || {};
                                                updateSetting('vehicleDimensions', v.id, { ...current, vehicleValue: val });
                                            }} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label py-0"><span className="label-text text-[9px] font-bold text-slate-500">Vida Útil (Km)</span></label>
                                        <input type="text" className="input input-xs input-bordered w-full text-right"
                                            placeholder="800,000"
                                            value={(settings.vehicleDimensions as any)?.[v.id]?.vehicleUsefulLifeKm?.toLocaleString('en-US') ?? ''}
                                            onChange={(e) => {
                                                const val = Number(e.target.value.replace(/,/g, ''));
                                                if (isNaN(val)) return;
                                                const current = (settings.vehicleDimensions as any)?.[v.id] || {};
                                                updateSetting('vehicleDimensions', v.id, { ...current, vehicleUsefulLifeKm: val });
                                            }} />
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
                                            <input type="number" step="0.01" className="input input-sm input-bordered w-full text-right font-mono text-xs bg-white pt-4 px-2 h-10"
                                                placeholder="0.00"
                                                value={(settings.vehicleDimensions as any)?.[v.id]?.[d] || ''}
                                                onChange={(e) => {
                                                    const current = (settings.vehicleDimensions as any)?.[v.id] || {};
                                                    updateSetting('vehicleDimensions', v.id, { ...current, [d]: Number(e.target.value) });
                                                }} />
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
                                            <th className="font-medium pb-2 text-center text-[10px]">Km/L</th>
                                            <th className="font-medium pb-2 text-right pr-1">$/Km</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[
                                            { id: 'diesel', label: 'Diesel', priceRef: settings.fuelPrices?.diesel || 0 },
                                            { id: 'gasoline87', label: 'Magna', priceRef: settings.fuelPrices?.gasoline87 || 0 },
                                            { id: 'gasoline91', label: 'Premium', priceRef: settings.fuelPrices?.gasoline91 || 0 }
                                        ].map((fuel) => {
                                            const vConfig = (settings.vehicleDimensions as any)?.[v.id] || {};
                                            const fuelConfig = vConfig.fuelConfig?.[fuel.id] || { enabled: false, efficiency: 0 };

                                            // Calculate cost per km safely
                                            const efficiency = fuelConfig.efficiency > 0 ? fuelConfig.efficiency : 1;
                                            const costPerKm = (fuelConfig.enabled && fuel.priceRef > 0)
                                                ? (fuel.priceRef / efficiency)
                                                : 0;

                                            return (
                                                <tr key={fuel.id} className={`transition-colors ${fuelConfig.enabled ? 'bg-indigo-50/50' : ''}`}>
                                                    <td className="py-2.5 font-medium text-slate-600 pl-1">{fuel.label}</td>
                                                    <td className="py-2.5 text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-xs checkbox-primary rounded-[3px]"
                                                            checked={!!fuelConfig.enabled}
                                                            onChange={(e) => {
                                                                const isChecked = e.target.checked;
                                                                const currentConfig = (settings.vehicleDimensions as any)?.[v.id] || {};
                                                                const currentFuels = currentConfig.fuelConfig || {};
                                                                const newFuels = { ...currentFuels }; // clone

                                                                let newPricePerKm = currentConfig.pricePerKm;

                                                                if (isChecked) {
                                                                    // Disable others, enable this one (Radio behavior)
                                                                    ['diesel', 'gasoline87', 'gasoline91'].forEach(fid => {
                                                                        const f = newFuels[fid] || { efficiency: 0, enabled: false };
                                                                        newFuels[fid] = { ...f, enabled: fid === fuel.id };
                                                                    });

                                                                    // Recalculate estimated price/km
                                                                    if (fuelConfig.efficiency > 0 && fuel.priceRef > 0) {
                                                                        const fuelC = fuel.priceRef / fuelConfig.efficiency;
                                                                        const tCount = currentConfig.tireCount || 6;
                                                                        const tPrice = currentConfig.tirePrice || 5000;
                                                                        const tLife = currentConfig.tireLifeKm || 100000;
                                                                        const tireC = (tCount * tPrice) / tLife;
                                                                        const vVal = currentConfig.vehicleValue || 1000000;
                                                                        const vLife = currentConfig.vehicleUsefulLifeKm || 500000;
                                                                        const depC = vVal / vLife;
                                                                        const opTotal = fuelC + tireC + depC;
                                                                        const margin = (settings.financialFactors?.profitMarginJFCOutbound || 10) / 100;
                                                                        newPricePerKm = Number((opTotal * (1 + margin)).toFixed(2));
                                                                    }
                                                                } else {
                                                                    // Just disable this one
                                                                    const f = newFuels[fuel.id] || { efficiency: 0, enabled: false };
                                                                    newFuels[fuel.id] = { ...f, enabled: false };
                                                                }

                                                                updateSetting('vehicleDimensions', v.id, { ...currentConfig, pricePerKm: newPricePerKm, fuelConfig: newFuels });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-2.5 text-center">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            className="input input-xs input-bordered !w-[80px] px-1 text-center bg-white font-bold text-slate-700"
                                                            value={fuelConfig.efficiency ?? ''}
                                                            placeholder={String(v.fuelEfficiency || '-')}
                                                            onChange={(e) => {
                                                                const val = Number(e.target.value);
                                                                const currentConfig = (settings.vehicleDimensions as any)?.[v.id] || {};
                                                                const currentFuels = currentConfig.fuelConfig || {};

                                                                const updatedFuel = { ...fuelConfig, efficiency: val };
                                                                const newFuels = { ...currentFuels, [fuel.id]: updatedFuel };

                                                                let newPricePerKm = currentConfig.pricePerKm;
                                                                if (updatedFuel.enabled && val > 0 && fuel.priceRef > 0) {
                                                                    const fuelC = fuel.priceRef / val;
                                                                    const tCount = currentConfig.tireCount || 6;
                                                                    const tPrice = currentConfig.tirePrice || 5000;
                                                                    const tLife = currentConfig.tireLifeKm || 100000;
                                                                    const tireC = (tCount * tPrice) / tLife;
                                                                    const vVal = currentConfig.vehicleValue || 1000000;
                                                                    const vLife = currentConfig.vehicleUsefulLifeKm || 500000;
                                                                    const depC = vVal / vLife;
                                                                    const opTotal = fuelC + tireC + depC;
                                                                    const margin = (settings.financialFactors?.profitMarginJFCOutbound || 10) / 100;
                                                                    newPricePerKm = Number((opTotal * (1 + margin)).toFixed(2));
                                                                }

                                                                updateSetting('vehicleDimensions', v.id, { ...currentConfig, pricePerKm: newPricePerKm, fuelConfig: newFuels });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-2.5 text-right font-mono font-bold text-slate-700 pr-1">
                                                        {costPerKm > 0
                                                            ? `$${costPerKm.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                            : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
