'use client';

import { PricingSettings } from '@/lib/firebase/schema';
import { DollarSign, Users } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';


interface OperationalSettingsProps {
    settings: PricingSettings;
    updateSetting: (section: keyof PricingSettings, key: string | null, value: unknown) => void;
}

export default function OperationalSettings({ settings, updateSetting }: OperationalSettingsProps) {
    const { language } = useLanguage();
    const t = useTranslation(language);

    return (
        <div className="p-6 border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-200">
            {/* Row 1: Base Costs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-100">
                {/* Maniobras Base */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                        <Users size={16} className="text-blue-500" /> {t('baseManeuvers')}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label py-0 mb-1"><span className="label-text text-xs font-bold text-slate-500">{t('loadingFee')}</span></label>
                            <label className="input input-bordered input-sm flex items-center gap-2">
                                $ <input type="number" className="grow text-right font-mono font-bold"
                                    value={settings.maneuverFees?.loading || 0}
                                    onChange={(e) => updateSetting('maneuverFees', 'loading', Number(e.target.value))} />
                            </label>
                        </div>
                        <div className="form-control">
                            <label className="label py-0 mb-1"><span className="label-text text-xs font-bold text-slate-500">{t('unloadingFee')}</span></label>
                            <label className="input input-bordered input-sm flex items-center gap-2">
                                $ <input type="number" className="grow text-right font-mono font-bold"
                                    value={settings.maneuverFees?.unloading || 0}
                                    onChange={(e) => updateSetting('maneuverFees', 'unloading', Number(e.target.value))} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Tarifas Base */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                        <DollarSign size={16} className="text-[var(--primary)]" /> {t('baseTariffs')}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label py-0 mb-1"><span className="label-text text-xs font-bold text-slate-500">{t('imponderablesPercent')}</span></label>
                            <div className="relative">
                                <input type="number" step="1" className="input input-sm input-bordered w-full pr-8 text-right font-mono font-bold"
                                    value={settings.financialFactors?.imponderablesToUse || 3}
                                    onChange={(e) => updateSetting('financialFactors', 'imponderablesToUse', Number(e.target.value))} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold">%</span>
                            </div>
                        </div>
                        <div className="form-control">
                            <label className="label py-0 mb-1"><span className="label-text text-xs font-bold text-slate-500">$/Ton/Km</span></label>
                            <div className="relative">
                                <input type="number" step="0.1" className="input input-sm input-bordered w-full pl-6 text-right font-mono font-bold"
                                    value={settings.tonKmRate || 0}
                                    onChange={(e) => updateSetting('tonKmRate', null, Number(e.target.value))} />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SUB-SECTION: GPS */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">{t('gpsSection')}</h4>
                    <div className="form-control mb-4">
                        <label className="label"><span className="label-text font-medium text-slate-600">{t('gpsMonthlyRent')}</span></label>
                        <label className="input input-bordered flex items-center gap-2">
                            $ <input type="number" className="grow text-right font-mono font-bold"
                                value={settings.financialFactors?.gpsMonthlyRent || 0}
                                onChange={(e) => updateSetting('financialFactors', 'gpsMonthlyRent', Number(e.target.value))} />
                            <span className="text-xs text-slate-400">MXN</span>
                        </label>
                        <div className="label"><span className="label-text-alt text-slate-400">{t('gpsProrateNote')}</span></div>
                    </div>
                </div>

                {/* SUB-SECTION: Operador */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">{t('operatorSection')}</h4>

                    {/* Payment Switch */}
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                        <button type="button"
                            onClick={() => updateSetting('financialFactors', 'driverPaymentType', 'per_day')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${settings.financialFactors?.driverPaymentType !== 'percent' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>
                            {t('perDayMode')}
                        </button>
                        <button type="button"
                            onClick={() => updateSetting('financialFactors', 'driverPaymentType', 'percent')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${settings.financialFactors?.driverPaymentType === 'percent' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>
                            {t('perTripPercent')}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {settings.financialFactors?.driverPaymentType === 'percent' ? (
                            <div className="form-control">
                                <label className="label py-0"><span className="label-text text-xs font-bold text-slate-500">{t('tripPercentage')}</span></label>
                                <div className="relative">
                                    <input type="number" step="0.5" className="input input-sm input-bordered w-full pr-8 text-right bg-indigo-50"
                                        value={settings.financialFactors?.driverPercent || 0}
                                        onChange={(e) => updateSetting('financialFactors', 'driverPercent', Number(e.target.value))} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold">%</span>
                                </div>
                            </div>
                        ) : (
                            <div className="form-control">
                                <label className="label py-0"><span className="label-text text-xs font-bold text-slate-500">{t('dailySalary')}</span></label>
                                <div className="relative">
                                    <input type="number" className="input input-sm input-bordered w-full pl-6 text-right"
                                        value={settings.financialFactors?.driverDailySalary || 0}
                                        onChange={(e) => updateSetting('financialFactors', 'driverDailySalary', Number(e.target.value))} />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                                </div>
                            </div>
                        )}

                        <div className="form-control">
                            <label className="label py-0"><span className="label-text text-xs font-bold text-slate-500">{t('driverEfficiency')}</span></label>
                            <div className="relative" title={t('driverEfficiency')}>
                                <input type="number" className="input input-sm input-bordered w-full pr-20 text-right font-mono"
                                    value={settings.financialFactors?.driverKmPerDay || 600}
                                    onChange={(e) => updateSetting('financialFactors', 'driverKmPerDay', Number(e.target.value))} />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label py-0"><span className="label-text text-xs font-bold text-slate-500">{t('perDiemPerDay')}</span></label>
                            <div className="relative">
                                <input type="number" className="input input-sm input-bordered w-full pl-6 text-right"
                                    value={settings.financialFactors?.driverViaticosPerDay || 0}
                                    onChange={(e) => updateSetting('financialFactors', 'driverViaticosPerDay', Number(e.target.value))} />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
