'use client';

import { useRouter } from 'next/navigation';
import { Truck, Package, Users, Warehouse, Settings, FileText, ShieldCheck, History } from 'lucide-react';
import { useUser } from '@/lib/UserContext';

import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export default function Dashboard() {
    const router = useRouter();
    const { user, loading, loginWithGoogle, isAdmin } = useUser();
    const { language } = useLanguage();
    const t = useTranslation(language);

    if (loading) {
        return (
            <main className="container min-h-[90vh] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold">{t('loading')}</h2>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="container min-h-[90vh] flex flex-col items-center justify-center">
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/jfc_carg-_destino_logo.png"
                            alt="JFC Cargo Destino"
                            className="h-[180px] w-auto"
                        />
                    </div>
                </div>

                <div className="card w-full max-w-[450px] p-10 text-center">
                    <h3 className="mb-8 font-bold text-2xl">Iniciar Sesión</h3>

                    <button
                        onClick={() => loginWithGoogle()}
                        className="btn w-full p-4 text-lg bg-white text-[#757575] border border-[#ddd] flex items-center justify-center gap-4 hover:bg-gray-50 transition-colors"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                        Continuar con Google
                    </button>

                    <div className="mt-8 pt-6 border-t border-[var(--border)] text-sm text-[var(--secondary)]">
                        <p>Acceso seguro vía Google Workspace</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="container min-h-[90vh] p-8">
            {/* Header & Welcome */}
            <div className="mb-12 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-gradient text-5xl font-extrabold">
                        {t('dashboardTitle')}
                    </h1>
                    <p className="text-lg text-[var(--secondary)]">
                        {t('welcome')}, {user.name}
                    </p>
                </div>
            </div>

            {/* Section: Mis Servicios */}
            <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">
                {t('myServices')}
            </h2>
            <div className="responsive-grid grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 mb-12">
                {/* Customer Portal Entry */}
                <ModuleCard
                    title="Customer Portal"
                    description="Accede al cotizador, rastreo y tus servicios activos."
                    icon={<Users size={32} color="white" />}
                    onClick={() => router.push('/portal')}
                    gradient="linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)"
                />
            </div>

            {/* Section: Gestión */}
            <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">
                {t('management')}
            </h2>
            <div className="responsive-grid grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8">
                {/* Vehículos */}
                <ModuleCard
                    title={t('fleetTitle')}
                    description={t('fleetDesc')}
                    icon={<Truck size={32} color="white" />}
                    onClick={() => router.push('/vehicles')}
                    gradient="linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)"
                />

                {/* Conductores */}
                <ModuleCard
                    title={t('driversTitle')}
                    description={t('driversDesc')}
                    icon={<Users size={32} color="white" />}
                    onClick={() => router.push('/drivers')}
                    gradient="linear-gradient(135deg, var(--secondary) 0%, var(--primary-hover) 100%)"
                />

                {/* Almacenes */}
                <ModuleCard
                    title={t('warehousesTitle')}
                    description={t('warehousesDesc')}
                    icon={<Warehouse size={32} color="white" />}
                    onClick={() => router.push('/storage')}
                    gradient="linear-gradient(135deg, var(--accent) 0%, #c5a059 100%)"
                />

                {/* Admin */}
                <ModuleCard
                    title={t('adminTitle')}
                    description={t('adminPanelDesc')}
                    icon={<Settings size={32} color="white" />}
                    onClick={() => router.push('/admin')}
                    gradient="linear-gradient(135deg, var(--foreground) 0%, #000000 100%)"
                    disabled={!isAdmin}
                    locked={!isAdmin}
                />
            </div>
        </main>
    );
}

function ModuleCard({ title, description, icon, onClick, gradient, disabled = false, locked = false }: any) {
    return (
        <div
            className={`
                card relative flex flex-col gap-4 border-none shadow-sm 
                transition-all duration-200 
                ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg'}
            `}
            // Note: inline styles for shadow hover are replaced by Tailwind classes
            onClick={!disabled ? onClick : undefined}
        >
            {locked && (
                <div className="absolute top-4 right-4 text-[var(--secondary)]">
                    <ShieldCheck size={20} />
                </div>
            )}
            <div
                className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center shadow-md text-white"
                style={{ background: gradient || 'var(--secondary-bg)' }}
            >
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-[var(--secondary)] text-[0.95rem] leading-6">{description}</p>
            </div>
        </div>
    );
}
