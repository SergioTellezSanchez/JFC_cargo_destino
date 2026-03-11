'use client';

import { useRouter } from 'next/navigation';
import { Package, Truck, Users } from 'lucide-react';
import { useUser } from '@/lib/UserContext';

export default function CarrierDashboard() {
    const router = useRouter();
    const { user } = useUser();

    const modules = [
        {
            title: 'Gestión de Órdenes',
            description: 'Ver solicitudes, asignar conductores y viajes de regreso.',
            href: '/carrier/orders',
            icon: Package,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 border-indigo-100'
        },
        {
            title: 'Mi Flota',
            description: 'Gestionar vehículos, mantenimientos y documentación.',
            href: '/carrier/vehicles',
            icon: Truck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 border-emerald-100'
        },
        {
            title: 'Conductores',
            description: 'Administrar operadores, licencias y rendimiento.',
            href: '/carrier/drivers',
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50 border-blue-100'
        }
    ];

    return (
        <main>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Portal de Transportista</h1>
                <p className="text-slate-500 font-medium">Bienvenido, {user?.name || 'Transportista'}. Gestiona tu operación desde aquí.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {modules.map((m) => {
                    const Icon = m.icon;
                    return (
                        <div
                            key={m.href}
                            onClick={() => router.push(m.href)}
                            className={`
                                p-6 rounded-2xl border transition-all duration-200 cursor-pointer
                                hover:shadow-lg hover:-translate-y-1 bg-white
                                ${m.bg}
                            `}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-white shadow-sm ${m.color}`}>
                                <Icon size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{m.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">{m.description}</p>
                        </div>
                    );
                })}
            </div>
        </main>
    );
}
