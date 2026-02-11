'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext'; // Check path
import { useTranslation } from '@/lib/i18n';

export default function WorldClock({ compact = false }: { compact?: boolean }) {
    const [time, setTime] = useState(new Date());
    const { language } = useLanguage();
    const t = useTranslation(language);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getTimeInZone = (zone: string) => {
        return time.toLocaleTimeString('es-MX', { timeZone: zone, hour: '2-digit', minute: '2-digit' });
    };

    // If compact (collapsed sidebar), show minimal vertical
    if (compact) {
        return (
            <div className="flex flex-col gap-1 items-center text-xs text-slate-500 w-full animate-in fade-in duration-300">
                <Clock size={18} className="text-[var(--primary)]" />
                <div className="flex flex-col gap-1 text-center w-full">
                    <div>
                        <span className="font-bold text-slate-700">{getTimeInZone('America/Mexico_City')}</span>
                        <span className="block text-[9px] uppercase tracking-wider text-slate-400">CST</span>
                    </div>
                </div>
            </div>
        );
    }

    // Default (Expanded Sidebar) - Vertical layout to fit width
    return (
        <div className="flex flex-col gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl w-full">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Clock size={16} className="text-[var(--primary)]" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">{t('timeZones')}</span>
            </div>

            <div className="space-y-3">
                {[
                    { label: t('pacific'), zone: 'America/Tijuana' },
                    { label: t('central'), zone: 'America/Mexico_City' },
                    { label: t('eastern'), zone: 'America/Cancun' }
                ].map((item) => (
                    <div key={item.zone} className="flex justify-between items-center group hover:bg-white hover:shadow-sm p-2 rounded-lg transition-all">
                        <span className="text-xs text-slate-500 group-hover:text-[var(--primary)] font-medium">{item.label}</span>
                        <span className="font-mono font-semibold text-slate-700">{getTimeInZone(item.zone)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
