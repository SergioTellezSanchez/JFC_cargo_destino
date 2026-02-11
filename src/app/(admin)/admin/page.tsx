'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, Package, Truck, Users, FileText, ChevronRight, LogOut, Bell, Search, Menu, X, PlusCircle, ShoppingCart, Check, Warehouse, UserCheck, Building2 } from 'lucide-react';
import { useUser } from '@/lib/UserContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { authenticatedFetch } from '@/lib/api';
import { PricingSettings } from '@/lib/firebase/schema';

// Components
import WorldClock from '@/components/WorldClock';
import PackageManagement from '@/components/management/PackageManagement';
import UserManagement from '@/components/management/UserRoleManagement';
import DriverManagement from '@/components/management/DriverManagement';
import VehicleManagement from '@/components/management/VehicleManagement';
import WarehouseManagement from '@/components/management/WarehouseManagement';
import CarrierManagement from '@/components/management/CarrierManagement';

import AdminSettings from '@/components/admin/AdminSettings';
import AdminSimulator from '@/components/admin/AdminSimulator';

import { DEFAULT_SETTINGS } from '@/lib/calculations';

function AdminContent() {
    const { user, loading: authLoading, isAdmin } = useUser();
    const { language } = useLanguage();
    const t = useTranslation(language);
    const router = useRouter();
    const searchParams = useSearchParams();

    const [activeTab, setActiveTab] = useState('orders');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [settings, setSettings] = useState<PricingSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Initial Load & Auth Check
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }
        if (user && !isAdmin) {
            router.push('/dashboard');
            return;
        }

        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);

        // Fetch settings only if authenticated
        const fetchSettings = async () => {
            try {
                const res = await authenticatedFetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data && Object.keys(data).length > 0) {
                        setSettings(prev => ({ ...prev, ...data }));
                    }
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };
        fetchSettings();
    }, [user, authLoading, isAdmin, router, searchParams]);

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            const res = await authenticatedFetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (!res.ok) throw new Error('Failed to save');
            setToast({ message: t('save') + ' ' + t('completed'), type: 'success' }); // Basic i18n
            setTimeout(() => setToast(null), 3000);
        } catch (error) {
            console.error(error);
            setToast({ message: t('failed'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = (section: keyof PricingSettings, key: string | null, value: unknown) => {
        setSettings(prev => {
            if (key) {
                return {
                    ...prev,
                    [section]: {
                        ...(prev[section] as any || {}),
                        [key]: value
                    }
                };
            }
            return { ...prev, [section]: value };
        });
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
    if (!user || !isAdmin) return null;

    const menuItems = [
        { id: 'dashboard', label: t('dashboardTitle'), icon: LayoutDashboard },
        { id: 'orders', label: t('orders'), icon: ShoppingCart },
        { id: 'carriers', label: t('carriers'), icon: Building2 },
        { id: 'drivers', label: t('drivers'), icon: UserCheck },
        { id: 'vehicles', label: t('vehicles'), icon: Truck },
        { id: 'warehouses', label: t('warehouses'), icon: Warehouse },
        { id: 'users', label: 'Usuarios', icon: Users }, // Keeping generic for now or t('users') if key exists (didn't add 'users' explicitly but 'manageDrivers' etc exist)
        { id: 'settings', label: t('settings'), icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20 shadow-xl relative`}>
                <div className="p-4 flex items-center h-16 border-b border-slate-100">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-indigo-800 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                                JFC
                            </div>
                            <span className="font-extrabold text-xl tracking-tight text-slate-900">ADMIN</span>
                        </div>
                    ) : (
                        <div className="w-8 h-8 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center font-bold mx-auto">J</div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                                ${activeTab === item.id
                                    ? 'bg-[var(--primary)] text-white shadow-md shadow-indigo-200 font-semibold'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-[var(--primary)]'} />
                            {sidebarOpen && <span>{item.label}</span>}
                            {!sidebarOpen && activeTab === item.id && (
                                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* World Clock in Sidebar Footer */}
                <div className={`p-4 border-t border-slate-100 ${!sidebarOpen && 'flex justify-center'}`}>
                    {sidebarOpen ? <WorldClock /> : <WorldClock compact />}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                        {sidebarOpen ? <ChevronRight size={20} className="rotate-180" /> : <ChevronRight size={20} />}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50/50">
                {/* Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <Menu size={20} />
                        </button>
                        <h1 className="text-lg font-bold text-slate-800 hidden md:block">
                            {menuItems.find(i => i.id === activeTab)?.label}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-slate-700 hidden sm:block">Admin</span>
                            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-slate-600">
                                <Users size={18} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Body */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto pb-20">
                        {activeTab === 'dashboard' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in zoom-in duration-300">
                                {[
                                    { l: t('orders'), v: '12', i: ShoppingCart, c: 'text-blue-600', b: 'bg-blue-50' },
                                    { l: 'Cotizaciones (Mes)', v: '-', i: FileText, c: 'text-purple-600', b: 'bg-purple-50' },
                                    { l: 'Usuarios Registrados', v: '128', i: Users, c: 'text-emerald-600', b: 'bg-emerald-50' },
                                    { l: 'Ingresos (Mes)', v: '$45,200', i: Package, c: 'text-amber-600', b: 'bg-amber-50' }
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-xl ${stat.b}`}>
                                                <stat.i size={22} className={stat.c} />
                                            </div>
                                            <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-full text-slate-500">+2.5%</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">{stat.v}</h3>
                                        <p className="text-sm font-medium text-slate-400">{stat.l}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'orders' && <PackageManagement />}
                        {activeTab === 'carriers' && <CarrierManagement />}
                        {activeTab === 'drivers' && <DriverManagement />}
                        {activeTab === 'vehicles' && <VehicleManagement />}
                        {activeTab === 'warehouses' && <WarehouseManagement />}
                        {activeTab === 'users' && <UserManagement />}

                        {activeTab === 'settings' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                {/* Configuration Component */}
                                <AdminSettings
                                    settings={settings}
                                    loading={loading}
                                    updateSetting={updateSetting}
                                    saveSettings={handleSaveSettings}
                                />

                                {/* Simulator Component */}
                                <AdminSimulator settings={settings} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Toast Notification */}
                {toast && (
                    <div className={`fixed bottom-4 right-4 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 z-50 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
                        {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
                        <span className="font-medium">{toast.message}</span>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>}>
            <AdminContent />
        </Suspense>
    );
}
