'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Truck, Save, DollarSign, Package as PackageIcon, Users, Warehouse, Plus, LayoutGrid, Database, Lock, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/UserContext';
import WorldClock from '@/components/WorldClock';
import { authenticatedFetch } from '@/lib/api';
import WarehouseManagement from '@/components/management/WarehouseManagement';
import UserRoleManagement from '@/components/management/UserRoleManagement';
import PackageManagement from '@/components/management/PackageManagement';
import VehicleManagement from '@/components/management/VehicleManagement';
import DriverManagement from '@/components/management/DriverManagement';
import { Info, HelpCircle } from 'lucide-react';

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

    if (authLoading || (user && loading)) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Cargando administrador...</div>;

    // Access Control
    if (!user) {
        return (
            <div className="container" style={{ padding: '10vh 2rem', textAlign: 'center' }}>
                <div className="card" style={{ maxWidth: '400px', margin: '0 auto', padding: '3rem' }}>
                    <Lock size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Acceso Restringido</h2>
                    <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>Debes iniciar sesión para acceder al panel administrativo.</p>
                    <button className="btn btn-primary w-full" onClick={() => router.push('/login')}>Ir al Login</button>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="container" style={{ padding: '10vh 2rem', textAlign: 'center' }}>
                <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem', border: '2px solid var(--error-bg)' }}>
                    <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--error)' }}>Sin Privilegios</h2>
                    <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>
                        Tu cuenta <strong>({user.email})</strong> no tiene permisos de administrador.
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '2rem' }}>
                        Si crees que esto es un error, contacta al soporte técnico.
                    </p>
                    <button className="btn btn-secondary w-full" onClick={() => router.push('/')}>Volver al Inicio</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <WorldClock />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{t('adminDashboard')}</h1>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{user?.role || 'ADMIN'}</span>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--card-bg)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
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
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '0.6rem',
                                border: 'none',
                                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--secondary)',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.id ? '600' : '400',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className={activeTab === 'settings' ? '' : 'card'} style={{ minHeight: '400px', background: activeTab === 'settings' ? 'transparent' : 'var(--card-bg)', border: activeTab === 'settings' ? 'none' : '1px solid var(--border)', padding: activeTab === 'settings' ? 0 : '1px' }}>
                {activeTab === 'packages' && <PackageManagement isAdminView={true} />}
                {activeTab === 'vehicles' && <VehicleManagement isAdminView={true} />}
                {activeTab === 'drivers' && <DriverManagement isAdminView={true} />}
                {activeTab === 'warehouses' && <WarehouseManagement isAdminView={true} />}

                {activeTab === 'settings' && (
                    <div className="space-y-8">
                        <div className="card" style={{ padding: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', }}>
                                    <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                        <DollarSign size={24} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Parámetros Globales</h2>
                                        <p style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>Configura los valores base para la operación.</p>
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                    <div className="space-y-4">
                                        <div className="input-group">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <label style={{ fontWeight: '600' }}>Tasa de Seguro (%)</label>
                                                <div style={{ cursor: 'help' }}><HelpCircle size={14} color="var(--secondary)" /></div>
                                            </div>
                                            <input name="insuranceRate" type="number" step="0.01" lang="en-US" className="input" defaultValue={settings.insuranceRate} required />
                                        </div>
                                        <div className="input-group">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <label style={{ fontWeight: '600' }}>Margen de Utilidad (Factor)</label>
                                                <div style={{ cursor: 'help' }}><HelpCircle size={14} color="var(--secondary)" /></div>
                                            </div>
                                            <input name="profitMargin" type="number" step="0.01" lang="en-US" className="input" defaultValue={settings.profitMargin} required />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="input-group">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <label style={{ fontWeight: '600' }}>Precio Base Ruta ($)</label>
                                                <div style={{ cursor: 'help' }}><HelpCircle size={14} color="var(--secondary)" /></div>
                                            </div>
                                            <input name="basePrice" type="number" className="input" defaultValue={settings.basePrice} required />
                                        </div>
                                        <div className="input-group">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <label style={{ fontWeight: '600' }}>Precios de Combustible (MXN/L)</label>
                                            </div>
                                            <div style={{ padding: '1rem', background: 'var(--card-bg)', borderRadius: '0.5rem', border: '1px solid var(--border)', display: 'grid', gap: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span style={{ fontSize: '0.8rem', width: '80px', color: 'var(--secondary)' }}>Diesel:</span>
                                                    <input name="fuel_diesel" type="number" step="0.01" className="input" style={{ margin: 0 }} defaultValue={settings.fuelPrices?.diesel} />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span style={{ fontSize: '0.8rem', width: '80px', color: 'var(--secondary)' }}>Magna (87):</span>
                                                    <input name="fuel_gasoline87" type="number" step="0.01" className="input" style={{ margin: 0 }} defaultValue={settings.fuelPrices?.gasoline87} />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span style={{ fontSize: '0.8rem', width: '80px', color: 'var(--secondary)' }}>Premium (91):</span>
                                                    <input name="fuel_gasoline91" type="number" step="0.01" className="input" style={{ margin: 0 }} defaultValue={settings.fuelPrices?.gasoline91} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <label style={{ fontWeight: '600' }}>Tipos de Suspensión</label>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.75rem', background: 'var(--card-bg)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                                {['Neumática', 'Muelles', 'Mecánica', 'Hidráulica', 'Bolsas de Aire'].map(type => (
                                                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
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
                                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}>
                                        <Save size={18} /> Guardar Configuración
                                    </button>
                                </div>
                            </form>
                        </div>

                        {user?.role === 'ADMIN_MASTER' && (
                            <div className="card" style={{ padding: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                                    <div style={{ background: 'var(--foreground)', color: 'white', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Gestión de Usuarios y Roles</h2>
                                        <p style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>Controla quién tiene acceso a las funciones administrativas.</p>
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
        <Suspense fallback={<div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>}>
            <AdminContent />
        </Suspense>
    );
}
