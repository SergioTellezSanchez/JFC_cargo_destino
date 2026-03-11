'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Truck, Users, Package, Globe, Loader2, Repeat } from 'lucide-react';
import { useUser } from '@/lib/UserContext';
import { useEffect } from 'react';
import { UserRole } from '@/lib/firebase/schemas/users';

export default function CarrierLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user, loading } = useUser();
    const router = useRouter();

    // Role guard: only CARRIER and ADMIN can access this portal
    useEffect(() => {
        if (!loading && user) {
            if (user.role !== UserRole.CARRIER && user.role !== UserRole.ADMIN) {
                // CLIENT and DRIVER are redirected to their appropriate portals
                router.replace('/portal');
            }
        } else if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    const tabs = [
        { name: 'Dashboard', href: '/carrier', icon: LayoutDashboard },
        { name: 'Bolsa de Carga', href: '/carrier/available-loads', icon: Globe },
        { name: 'Mis Viajes', href: '/carrier/orders', icon: Package },
        { name: 'Retornos Vacíos', href: '/carrier/return-trips', icon: Repeat },
        { name: 'Vehículos', href: '/carrier/vehicles', icon: Truck },
        { name: 'Conductores', href: '/carrier/drivers', icon: Users },
    ];

    // Helper to check if link is active
    const isActive = (href: string) => {
        if (href === '/carrier' && pathname === '/carrier') return true;
        if (href !== '/carrier' && pathname.startsWith(href)) return true;
        return false;
    };

    // Show spinner while checking auth/role
    if (loading || !user || (user.role !== UserRole.CARRIER && user.role !== UserRole.ADMIN)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Carrier Portal Sub-Header/Nav */}
            <div className="bg-white border-b border-slate-200">
                <div className="w-full px-6 mx-auto">
                    <div className="flex items-center gap-8 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = isActive(tab.href);
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={`
                                        flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap
                                        ${active
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}
                                    `}
                                >
                                    <Icon size={18} />
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Page Content */}
            <div className="w-full px-6 mx-auto py-8">
                {children}
            </div>
        </div>
    );
}
