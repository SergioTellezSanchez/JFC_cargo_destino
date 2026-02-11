'use client';

import { Warehouse, AlertCircle, Package as PackageIcon } from 'lucide-react';
import { PricingSettings } from '@/lib/firebase/schema';

interface GeneralSettingsProps {
    settings: PricingSettings;
    updateSetting: (section: keyof PricingSettings, key: string | null, value: unknown) => void;
}

export default function GeneralSettings({ settings, updateSetting }: GeneralSettingsProps) {
    // Helper to safely get rate values
    const getRate = (dict: any, key: string) => {
        return dict?.[key] ?? 1;
    };

    return (
        <div className="p-6 border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-200">
            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Col 1: Service Type */}
                <div>
                    <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                        <Warehouse size={14} className="text-blue-500" /> Tipo de Servicio
                    </div>
                    <div className="space-y-1">
                        {[
                            { k: 'FTL', l: 'FTL (Completo)' },
                            { k: 'PTL', l: 'PTL (Parcial)' },
                            { k: 'LTL', l: 'LTL (Consolidado)' }
                        ].map((item) => (
                            <div key={item.k} className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-500">{item.l}</span>
                                <div className="relative w-20">
                                    <input
                                        type="number"
                                        step="0.05"
                                        className="input input-xs input-bordered w-full text-right px-1 font-mono h-5 text-[10px]"
                                        value={getRate(settings.transportRates, item.k)}
                                        onChange={(e) => updateSetting('transportRates', item.k, Number(e.target.value))}
                                    />
                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400">x</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Col 2: Cargo Risk */}
                <div className="lg:border-l lg:border-slate-100 lg:pl-6">
                    <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                        <AlertCircle size={14} className="text-orange-500" /> Riesgo Carga
                    </div>
                    <div className="space-y-1">
                        {[
                            { k: 'hazardous', l: 'Peligroso' },
                            { k: 'perishable', l: 'Perecederos' },
                            { k: 'machinery', l: 'Maquinaria' },
                            { k: 'fragile', l: 'Frágil' }
                        ].map((item) => (
                            <div key={item.k} className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-500">{item.l}</span>
                                <div className="relative w-20">
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="input input-xs input-bordered w-full text-right px-1 font-mono h-5 text-[10px]"
                                        value={getRate(settings.cargoRates, item.k)}
                                        onChange={(e) => updateSetting('cargoRates', item.k, Number(e.target.value))}
                                    />
                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400">x</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Col 3: Presentation */}
                <div className="lg:border-l lg:border-slate-100 lg:pl-6">
                    <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                        <PackageIcon size={14} className="text-emerald-500" /> Presentación
                    </div>
                    <div className="space-y-1">
                        {[
                            { k: 'Granel', l: 'Granel' },
                            { k: 'Paletizado', l: 'Paletizado' },
                            { k: 'General', l: 'General' }
                        ].map((item) => (
                            <div key={item.k} className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-500">{item.l}</span>
                                <div className="relative w-20">
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="input input-xs input-bordered w-full text-right px-1 font-mono h-5 text-[10px]"
                                        value={getRate(settings.presentationRates, item.k)}
                                        onChange={(e) => updateSetting('presentationRates', item.k, Number(e.target.value))}
                                    />
                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400">x</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
