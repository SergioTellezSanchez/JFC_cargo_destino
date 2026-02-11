'use client';

import { PricingSettings } from '@/lib/firebase/schema';

interface MarginSettingsProps {
    settings: PricingSettings;
    updateSetting: (section: keyof PricingSettings, key: string | null, value: unknown) => void;
}

export default function MarginSettings({ settings, updateSetting }: MarginSettingsProps) {
    return (
        <div className="p-6 border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-200">

            {/* Split Margins Configuration */}
            <h4 className="font-bold text-sm text-slate-800 mb-4 uppercase tracking-wider">Configuración Desglosada (Ida / Regreso)</h4>

            {/* JFC Split */}
            <div className="mb-6">
                <span className="text-xs font-bold text-emerald-600 block mb-3">Utilidad JFC</span>
                <div className="flex gap-4">
                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-xs">Ida</span></label>
                        <div className="relative">
                            <input type="number" step="1" className="input input-sm input-bordered w-full pr-8 font-mono"
                                value={(settings.financialFactors?.profitMarginJFCOutbound || 0)} // Stored as % e.g. 20
                                onChange={(e) => updateSetting('financialFactors', 'profitMarginJFCOutbound', Number(e.target.value))} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                        </div>
                    </div>
                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-xs">Regreso</span></label>
                        <div className="relative">
                            <input type="number" step="1" className="input input-sm input-bordered w-full pr-8 font-mono"
                                value={(settings.financialFactors?.profitMarginJFCReturn || 0)}
                                onChange={(e) => updateSetting('financialFactors', 'profitMarginJFCReturn', Number(e.target.value))} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Carrier Split */}
            <div>
                <span className="text-xs font-bold text-blue-600 block mb-3">Margen Transportista</span>
                <div className="flex gap-4">
                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-xs">Ida</span></label>
                        <div className="relative">
                            <input type="number" step="1" className="input input-sm input-bordered w-full pr-8 font-mono"
                                value={(settings.financialFactors?.profitMarginCarrierOutbound || 0)}
                                onChange={(e) => updateSetting('financialFactors', 'profitMarginCarrierOutbound', Number(e.target.value))} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                        </div>
                    </div>
                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-xs">Regreso</span></label>
                        <div className="relative">
                            <input type="number" step="1" className="input input-sm input-bordered w-full pr-8 font-mono"
                                value={(settings.financialFactors?.profitMarginCarrierReturn || 0)}
                                onChange={(e) => updateSetting('financialFactors', 'profitMarginCarrierReturn', Number(e.target.value))} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
