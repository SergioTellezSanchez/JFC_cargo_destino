'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Truck, Save, DollarSign, Package as PackageIcon, Users, Warehouse, Plus, LayoutGrid, Database, Lock, AlertCircle, Info, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/UserContext';
import { UserRole } from '@/lib/firebase/schema';
import WorldClock from '@/components/WorldClock';
import { authenticatedFetch } from '@/lib/api';
import WarehouseManagement from '@/components/management/WarehouseManagement';
import UserRoleManagement from '@/components/management/UserRoleManagement';
import PackageManagement from '@/components/management/PackageManagement';
import VehicleManagement from '@/components/management/VehicleManagement';
import DriverManagement from '@/components/management/DriverManagement';

function AdminContent() {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const { user, isAdmin, loading: authLoading } = useUser();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('packages');
    const [settings, setSettings] = useState<any>({
        insuranceRate: 1.5,
        profitMargin: 1.4,
        suspensionTypes: ['Neumática', 'Muelles', 'Hidráulica'],
        usefulLifeKm: 500000,
        basePrice: 1000,
        fuelPrices: {
            diesel: 25.00,
            gasoline91: 26.50,
            gasoline87: 24.50
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['packages', 'vehicles', 'drivers', 'warehouses', 'settings'].includes(tab)) {
            setActiveTab(tab);
        }

        if (!authLoading) {
            if (user) {
                fetchSettings();
            } else {
                setLoading(false);
            }
        }
    }, [searchParams, authLoading, user]);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        window.history.pushState(null, '', `/admin?tab=${tabId}`);
    };

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await authenticatedFetch('/api/settings');
            if (res.ok) setSettings(await res.json());
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || (user && loading)) return <div className="container p-8 text-center">Cargando administrador...</div>;

    // Access Control
    if (!user) {
        return (
            <div className="container min-h-[90vh] flex items-center justify-center p-8">
                <div className="card max-w-[400px] w-full p-12 text-center mx-auto">
                    <div className="flex justify-center mb-6">
                        <Lock size={48} className="text-[var(--primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Acceso Restringido</h2>
                    <p className="text-[var(--secondary)] mb-8">Debes iniciar sesión para acceder al panel administrativo.</p>
                    <button className="btn btn-primary w-full" onClick={() => router.push('/login')}>Ir al Login</button>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="container min-h-[90vh] flex items-center justify-center p-8">
                <div className="card max-w-[500px] w-full p-12 text-center mx-auto border-2 border-[var(--error-bg)]">
                    <div className="flex justify-center mb-6">
                        <AlertCircle size={48} className="text-[var(--error)]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-[var(--error)]">Sin Privilegios</h2>
                    <p className="text-[var(--secondary)] mb-4">
                        Tu cuenta <strong>({user.email})</strong> no tiene permisos de administrador.
                    </p>
                    <p className="text-sm text-[var(--secondary)] mb-8">
                        Si crees que esto es un error, contacta al soporte técnico.
                    </p>
                    <button className="btn btn-secondary w-full" onClick={() => router.push('/')}>Volver al Inicio</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <WorldClock />

            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-gradient text-3xl font-bold">{t('adminDashboard')}</h1>
                    <span className="badge badge-primary text-xs uppercase">{user?.role || 'ADMIN'}</span>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-[var(--card-bg)] p-1 rounded-xl border border-[var(--border)] flex-wrap overflow-x-auto">
                    {[
                        { id: 'packages', label: t('packages'), icon: <PackageIcon size={18} /> },
                        { id: 'vehicles', label: t('vehicles'), icon: <Truck size={18} /> },
                        { id: 'drivers', label: t('drivers'), icon: <Users size={18} /> },
                        { id: 'warehouses', label: t('warehouses'), icon: <Warehouse size={18} /> },
                        { id: 'settings', label: 'Configuración', icon: <LayoutGrid size={18} /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`
                                flex items-center gap-2 px-5 py-2.5 rounded-lg border-none cursor-pointer transition-all duration-200 whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'bg-[var(--primary)] text-white font-semibold'
                                    : 'bg-transparent text-[var(--secondary)] hover:bg-[var(--secondary-bg)]'}
                            `}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className={`
                min-h-[400px] transition-all
                ${activeTab === 'settings' ? 'bg-transparent border-none p-0' : 'card bg-[var(--card-bg)] border border-[var(--border)] p-1'}
            `}>
                {activeTab === 'packages' && <PackageManagement isAdminView={true} />}
                {activeTab === 'vehicles' && <VehicleManagement isAdminView={true} />}
                {activeTab === 'drivers' && <DriverManagement isAdminView={true} />}
                {activeTab === 'warehouses' && <WarehouseManagement isAdminView={true} />}

                {activeTab === 'settings' && (
                    <div className="space-y-8">
                        <div className="card p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[var(--primary)] text-white p-2 rounded-lg">
                                        <DollarSign size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold m-0">Parámetros Globales</h2>
                                        <p className="text-[var(--secondary)] text-sm">Configura los valores base para la operación.</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const payload = {
                                    insuranceRate: Number(formData.get('insuranceRate')),
                                    profitMargin: Number(formData.get('profitMargin')),
                                    usefulLifeKm: Number(formData.get('usefulLifeKm')),
                                    basePrice: Number(formData.get('basePrice')),
                                    suspensionTypes: formData.getAll('suspensionTypes'),
                                    fuelPrices: {
                                        diesel: Number(formData.get('fuel_diesel')),
                                        gasoline91: Number(formData.get('fuel_gasoline91')),
                                        gasoline87: Number(formData.get('fuel_gasoline87'))
                                    }
                                };
                                try {
                                    const res = await authenticatedFetch('/api/settings', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload)
                                    });
                                    if (res.ok) alert('Configuración guardada');
                                } catch (err) { alert('Error al guardar'); }
                            }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="input-group">
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="font-semibold">Tasa de Seguro (%)</label>
                                                <div className="cursor-help"><HelpCircle size={14} className="text-[var(--secondary)]" /></div>
                                            </div>
                                            <input name="insuranceRate" type="number" step="0.01" lang="en-US" className="input w-full" defaultValue={settings.insuranceRate} required />
                                        </div>
                                        <div className="input-group">
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="font-semibold">Margen de Utilidad (Factor)</label>
                                                <div className="cursor-help"><HelpCircle size={14} className="text-[var(--secondary)]" /></div>
                                            </div>
                                            <input name="profitMargin" type="number" step="0.01" lang="en-US" className="input w-full" defaultValue={settings.profitMargin} required />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="input-group">
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="font-semibold">Precio Base Ruta ($)</label>
                                                <div className="cursor-help"><HelpCircle size={14} className="text-[var(--secondary)]" /></div>
                                            </div>
                                            <input name="basePrice" type="number" className="input w-full" defaultValue={settings.basePrice} required />
                                        </div>
                                        <div className="input-group">
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="font-semibold">Precios de Combustible (MXN/L)</label>
                                            </div>
                                            <div className="p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--border)] grid gap-4">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs w-20 text-[var(--secondary)]">Diesel:</span>
                                                    <input name="fuel_diesel" type="number" step="0.01" className="input m-0 flex-1" defaultValue={settings.fuelPrices?.diesel} />
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs w-20 text-[var(--secondary)]">Magna (87):</span>
                                                    <input name="fuel_gasoline87" type="number" step="0.01" className="input m-0 flex-1" defaultValue={settings.fuelPrices?.gasoline87} />
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs w-20 text-[var(--secondary)]">Premium (91):</span>
                                                    <input name="fuel_gasoline91" type="number" step="0.01" className="input m-0 flex-1" defaultValue={settings.fuelPrices?.gasoline91} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="font-semibold">Tipos de Suspensión</label>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]">
                                                {['Neumática', 'Muelles', 'Mecánica', 'Hidráulica', 'Bolsas de Aire'].map(type => (
                                                    <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            name="suspensionTypes"
                                                            value={type}
                                                            defaultChecked={settings.suspensionTypes?.includes(type)}
                                                        />
                                                        {type}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button type="submit" className="btn btn-primary flex items-center gap-2 px-8 py-3">
                                        <Save size={18} /> Guardar Configuración
                                    </button>
                                </div>
                            </form>
                        </div>

                        {user?.role === UserRole.SUPER_ADMIN && (
                            <div className="card p-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="bg-[var(--foreground)] text-white p-2 rounded-lg">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold m-0">Gestión de Usuarios y Roles</h2>
                                        <p className="text-[var(--secondary)] text-sm">Controla quién tiene acceso a las funciones administrativas.</p>
                                    </div>
                                </div>
                                <UserRoleManagement />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={<div className="container p-8 text-center">Cargando...</div>}>
            <AdminContent />
        </Suspense>
    );
}
