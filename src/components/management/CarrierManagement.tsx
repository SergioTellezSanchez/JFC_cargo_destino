'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Truck, Users, Search, ChevronDown, ChevronUp, MapPin, Globe } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export default function CarrierManagement() {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const [carriers, setCarriers] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCarrier, setExpandedCarrier] = useState<string | null>(null);

    // Hardcoded initial carriers combined with dynamic data discovery
    const [knownCarriers, setKnownCarriers] = useState<string[]>([
        'JFC Cargo Central',
        'Logística Express MX',
        'Transportes del Norte',
        'Mudanzas Rápidas S.A.',
        'Flotilla Continental',
        'Aliado Estratégico Bajío'
    ]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [dRes, vRes] = await Promise.all([
                    authenticatedFetch('/api/drivers'),
                    authenticatedFetch('/api/vehicles')
                ]);

                let fetchedDrivers = [];
                let fetchedVehicles = [];

                if (dRes.ok) fetchedDrivers = await dRes.json();
                if (vRes.ok) fetchedVehicles = await vRes.json();

                setDrivers(fetchedDrivers);
                setVehicles(fetchedVehicles);

                // Discover other companies from data
                const companies = new Set(knownCarriers);
                fetchedDrivers.forEach((d: any) => { if (d.company) companies.add(d.company); });
                fetchedVehicles.forEach((v: any) => { if (v.company) companies.add(v.company); });

                setKnownCarriers(Array.from(companies));

            } catch (error) {
                console.error("Error fetching carrier data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredCarriers = knownCarriers.filter(c =>
        c.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCarrierStats = (companyName: string) => {
        const companyDrivers = drivers.filter(d => d.company === companyName);
        const companyVehicles = vehicles.filter(v => v.company === companyName);
        return { drivers: companyDrivers, vehicles: companyVehicles };
    };

    if (loading) return <div className="p-10 text-center text-slate-400">{t('loading')}</div>;

    return (
        <div className="space-y-6">
            {/* Header / Search */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Building2 className="text-[var(--primary)]" />
                            {t('carriers')}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">{t('management')}</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className="input w-full pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Carriers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCarriers.map(company => {
                    const { drivers: cDrivers, vehicles: cVehicles } = getCarrierStats(company);
                    const isExpanded = expandedCarrier === company;

                    return (
                        <div key={company} className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${isExpanded ? 'col-span-1 md:col-span-2 xl:col-span-3 border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div
                                className="p-6 cursor-pointer"
                                onClick={() => setExpandedCarrier(isExpanded ? null : company)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-[var(--primary)]">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">{company}</h3>
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <Globe size={12} />
                                                <span>{t('certified')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-slate-400 hover:text-[var(--primary)]">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                            <Truck size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-slate-800">{cVehicles.length}</div>
                                            <div className="text-xs text-slate-500">{t('units')}</div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-slate-800">{cDrivers.length}</div>
                                            <div className="text-xs text-slate-500">{t('drivers')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="border-t border-slate-100 p-6 bg-slate-50/50 rounded-b-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Drivers List */}
                                        <div>
                                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                <Users size={16} /> {t('assigned')} ({t('drivers')})
                                            </h4>
                                            {cDrivers.length > 0 ? (
                                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                                    {cDrivers.map(d => (
                                                        <div key={d.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                                                {d.photoUrl ? <img src={d.photoUrl} className="w-full h-full object-cover" /> : <Users size={14} className="text-slate-400" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-semibold text-sm truncate">{d.name}</div>
                                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <MapPin size={10} /> {d.location || t('inRoute')}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                                                ⭐ {d.rating || 'N/A'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-400 italic">{t('noData')}</div>
                                            )}
                                        </div>

                                        {/* Vehicles List */}
                                        <div>
                                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                <Truck size={16} /> {t('fleet')}
                                            </h4>
                                            {cVehicles.length > 0 ? (
                                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                                    {cVehicles.map(v => (
                                                        <div key={v.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                                                <Truck size={14} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-semibold text-sm truncate">{v.name}</div>
                                                                <div className="text-xs text-slate-500">{v.type} • {v.plates}</div>
                                                            </div>
                                                            <div className={`w-2 h-2 rounded-full ${v.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-400 italic">{t('noData')}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
