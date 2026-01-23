'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Package, ArrowRight, FileText } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import CustomerPackageList from '@/components/customer/CustomerPackageList';

export default function CustomerPortalPage() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = useTranslation(language);
    const [trackingInput, setTrackingInput] = useState('');

    console.log('Rendering Customer Portal - Quote Text: Cotizar');

    const handleTrackingSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (trackingInput.trim()) {
            router.push(`/tracking?trackingId=${encodeURIComponent(trackingInput.trim())}`);
        }
    };

    return (
        <main className="container min-h-[90vh] p-8 space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-extrabold text-gradient mb-2">Customer Portal</h1>
                <p className="text-[var(--secondary)] text-lg">Gestiona tus envíos, cotizaciones y rastreo en un solo lugar.</p>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Quote Action */}
                <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-white p-8 rounded-2xl flex flex-col justify-between shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => router.push('/quote')}
                >
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <Plus size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Cotizar Nuevo Envío</h2>
                            <p className="text-white/80">Calcula costos y crea órdenes de servicio inmediatas.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 font-bold mt-4 group-hover:gap-4 transition-all">
                        Cotizar <ArrowRight size={20} />
                    </div>
                </div>

                {/* 2. Quick Tracking */}
                <div className="card p-8 border border-slate-100 shadow-md">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Search size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Rastreo Rápido</h2>
                            <p className="text-slate-500 text-sm">Consulta el estado de cualquier guía.</p>
                        </div>
                    </div>

                    <form onSubmit={handleTrackingSearch} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Ej. PKG-123456"
                            className="input flex-1 bg-slate-50 border-slate-200"
                            value={trackingInput}
                            onChange={(e) => setTrackingInput(e.target.value)}
                        />
                        <button type="submit" className="btn btn-secondary whitespace-nowrap">
                            <Search size={18} className="mr-2" /> Buscar
                        </button>
                    </form>
                </div>
            </div>

            {/* 3. My Services List */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <Package size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Mis Servicios Activos</h2>
                </div>

                {/* Embedded Management Table */}
                <CustomerPackageList />
            </div>
        </main>
    );
}
