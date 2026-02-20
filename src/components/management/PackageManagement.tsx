'use client';

import React, { useState, useEffect } from 'react';
import { Package as PackageIcon, Plus, Edit, Trash2, Search, Filter, ChevronDown, ChevronUp, FileText, Truck, DollarSign, Save, AlertTriangle, CheckCircle2, Box, MapPin, User, Info, Building2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { useUser } from '@/lib/UserContext';
import { authenticatedFetch } from '@/lib/api';
import { generateShippingGuide } from '@/lib/pdfGenerator';
import { calculateLogisticsCosts, isVehicleSuitable, type Package as PackageType } from '@/lib/calculations';
import type { Vehicle } from '@/lib/firebase/schema';
import Modal from '@/components/Modal';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface PackageManagementProps {
    isAdminView?: boolean;
}

const LOGISTICS_COMPANIES = [
    'JFC Cargo Central',
    'Logística Express MX',
    'Transportes del Norte',
    'Mudanzas Rápidas S.A.',
    'Flotilla Continental',
    'Aliado Estratégico Bajío'
];

const STATUS_OPTIONS = [
    'PENDING',
    'ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED'
];

export default function PackageManagement({ isAdminView = false }: PackageManagementProps) {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const { user, isAdmin, loading: authLoading } = useUser();

    const [packages, setPackages] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>(['ALL']);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentItem, setCurrentItem] = useState<any>(null);

    const [isAssignCarrierModalOpen, setIsAssignCarrierModalOpen] = useState(false);
    const [pkgToAssign, setPkgToAssign] = useState<any>(null);
    const [selectedCarrierForAssign, setSelectedCarrierForAssign] = useState('');

    const availableCarriers = React.useMemo(() => {
        const companies = new Set<string>(LOGISTICS_COMPANIES);
        drivers.forEach(d => { if (d.company) companies.add(d.company); });
        vehicles.forEach(v => { if (v.company) companies.add(v.company); });
        return Array.from(companies).sort();
    }, [drivers, vehicles]);

    const [assignmentState, setAssignmentState] = useState({
        driverId: '',
        vehicleId: '',
        status: '',
        logisticsCompany: ''
    });

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [pRes, vRes, dRes, sRes] = await Promise.all([
                authenticatedFetch('/api/packages'),
                authenticatedFetch('/api/vehicles'),
                authenticatedFetch('/api/drivers'),
                authenticatedFetch('/api/settings')
            ]);

            if (pRes.ok) {
                let data = await pRes.json();
                if (!isAdmin && !isAdminView) {
                    data = data.filter((p: any) => p.createdBy === user?.uid);
                }
                setPackages(data);
            }
            if (vRes.ok) setVehicles(await vRes.json());
            if (dRes.ok) setDrivers(await dRes.json());
            if (sRes.ok) setSettings(await sRes.json());
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [authLoading, user, isAdmin]);

    const handleOpenModal = (mode: 'create' | 'edit', item: any = null) => {
        setModalMode(mode);
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete') + '?')) return;
        try {
            const res = await authenticatedFetch(`/api/packages/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert(t('completed'));
                fetchData();
            }
        } catch (error) { console.error(error); }
    };

    const handleQuickStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await authenticatedFetch(`/api/packages/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchData();
        } catch (error) { console.error(error); }
    };

    const toggleCompany = (company: string) => {
        if (company === 'ALL') {
            setSelectedCompanies(['ALL']);
            return;
        }

        let newSelected = selectedCompanies.filter(c => c !== 'ALL');
        if (newSelected.includes(company)) {
            newSelected = newSelected.filter(c => c !== company);
            if (newSelected.length === 0) newSelected = ['ALL'];
        } else {
            newSelected.push(company);
        }
        setSelectedCompanies(newSelected);
    };

    const handleAssignmentUpdate = async (packageId: string) => {
        try {
            const res = await authenticatedFetch(`/api/packages/${packageId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assignmentState)
            });
            if (res.ok) {
                alert('Asignación actualizada');
                setExpandedRow(null);
                fetchData();
            }
        } catch (err) { console.error(err); }
    };


    const toggleRow = (pkg: any) => {
        if (expandedRow === pkg.id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(pkg.id);
            const delivery = pkg.deliveries?.[0];
            setAssignmentState({
                driverId: pkg.assignedDriverId || delivery?.driver?.id || '',
                vehicleId: pkg.assignedVehicleId || delivery?.vehicle?.id || '',
                status: pkg.status || delivery?.status || 'PENDING',
                logisticsCompany: pkg.logisticsCompany || ''
            });
        }
    };

    const getRecommendation = (pkg: any) => {
        const suitableVehicles = vehicles.filter(v => isVehicleSuitable(v, pkg as PackageType));
        if (suitableVehicles.length === 0) return { message: 'No hay vehículos con capacidad suficiente.', status: 'error' };

        // Sort by calculated operational cost for this specific package
        const bestVehicle = suitableVehicles.sort((a, b) => {
            const costA = calculateLogisticsCosts(pkg as PackageType, a, settings).operationalCost ?? 0;
            const costB = calculateLogisticsCosts(pkg as PackageType, b, settings).operationalCost ?? 0;
            return costA - costB;
        })[0];

        return { message: `Sugerencia: ${bestVehicle.name} (${bestVehicle.plates || 'S/P'})`, status: 'success', vehicle: bestVehicle };
    };

    const filteredPackages = packages.filter(p => {
        const idMatch = p.trackingId?.toLowerCase().includes(searchTerm.toLowerCase());
        const nameMatch = p.recipientName?.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = filterStatus === 'ALL' || (p.status || p.deliveries?.[0]?.status) === filterStatus;

        let companyMatch = true;
        if (!selectedCompanies.includes('ALL')) {
            const pkgCompany = p.logisticsCompany || 'UNASSIGNED';
            companyMatch = selectedCompanies.includes(pkgCompany);
        }

        return (idMatch || nameMatch) && statusMatch && companyMatch;
    });

    const canEditAssignment = isAdmin || isAdminView;

    return (
        <div className="space-y-6">
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por ID o Destinatario..."
                                className="input"
                                style={{ paddingLeft: '2.5rem', margin: 0 }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select className="input" style={{ width: 'auto', margin: 0 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="ALL">Todos los Estados</option>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(s as any)}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenModal('create')}>
                        <Plus size={18} /> Nuevo Envío
                    </button>
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--secondary)', marginRight: '0.5rem' }}>Filtrar por Aliado:</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', padding: '0.25rem 0.6rem', borderRadius: '0.5rem', background: selectedCompanies.includes('ALL') ? 'var(--primary-light)' : 'transparent', color: selectedCompanies.includes('ALL') ? 'var(--primary)' : 'inherit' }}>
                        <input type="checkbox" checked={selectedCompanies.includes('ALL')} onChange={() => toggleCompany('ALL')} style={{ cursor: 'pointer' }} />
                        Todos
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', padding: '0.25rem 0.6rem', borderRadius: '0.5rem', background: selectedCompanies.includes('UNASSIGNED') ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: selectedCompanies.includes('UNASSIGNED') ? '#ef4444' : 'inherit' }}>
                        <input type="checkbox" checked={selectedCompanies.includes('UNASSIGNED')} onChange={() => toggleCompany('UNASSIGNED')} style={{ cursor: 'pointer' }} />
                        Sin asignar
                    </label>
                    {LOGISTICS_COMPANIES.map(company => (
                        <label key={company} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', padding: '0.25rem 0.6rem', borderRadius: '0.5rem', background: selectedCompanies.includes(company) ? 'var(--secondary-bg)' : 'transparent', color: selectedCompanies.includes(company) ? 'var(--primary)' : 'inherit', border: selectedCompanies.includes(company) ? '1px solid var(--primary)' : '1px solid transparent' }}>
                            <input type="checkbox" checked={selectedCompanies.includes(company)} onChange={() => toggleCompany(company)} style={{ cursor: 'pointer' }} />
                            {company}
                        </label>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando envíos...</div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100">
                    <table className="table w-full">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                                <th className="font-bold">Tracking ID</th>
                                <th className="font-bold">Ruta</th>
                                <th className="font-bold">Destinatario</th>
                                <th className="font-bold" style={{ width: '170px' }}>Estado</th>
                                <th className="font-bold">Aliado / Empresa</th>
                                <th className="font-bold text-center">Solicitudes</th>
                                <th className="font-bold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPackages.length > 0 ? filteredPackages.map((pkg: any) => {
                                const currentDelivery = pkg.deliveries?.[0];
                                const status = pkg.status || currentDelivery?.status || 'PENDING';
                                const isExpanded = expandedRow === pkg.id;

                                const selectedVehicle = vehicles.find(v => v.id === (assignmentState.vehicleId));
                                const costs = selectedVehicle ? calculateLogisticsCosts(pkg as PackageType, selectedVehicle, settings) : null;
                                const recommendation = getRecommendation(pkg);

                                // Basic colors mapping similar to OrderTable
                                const getStatusColors = (s: string) => {
                                    switch (s) {
                                        case 'PENDING': return { bg: '#fef3c7', text: '#d97706' };
                                        case 'ASSIGNED': return { bg: '#e0e7ff', text: '#4f46e5' };
                                        case 'PICKED_UP': return { bg: '#dbeafe', text: '#2563eb' };
                                        case 'IN_TRANSIT': return { bg: '#f3e8ff', text: '#9333ea' };
                                        case 'DELIVERED': return { bg: '#dcfce7', text: '#16a34a' };
                                        case 'CANCELLED': return { bg: '#fee2e2', text: '#dc2626' };
                                        default: return { bg: '#f1f5f9', text: '#64748b' };
                                    }
                                };
                                const colors = getStatusColors(status);

                                return (
                                    <React.Fragment key={pkg.id}>
                                        <tr
                                            className={`hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                                            onClick={() => toggleRow(pkg)}
                                        >
                                            <td className="font-mono font-bold text-indigo-600 text-sm">
                                                #{pkg.trackingId || pkg.id.slice(0, 8)}
                                            </td>
                                            <td className="max-w-[220px]" onClick={e => e.stopPropagation()}>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                        <span className="text-xs font-semibold text-slate-700 truncate">
                                                            {typeof pkg.origin === 'object' && pkg.origin?.address
                                                                ? pkg.origin.address.split(',')[0]
                                                                : (pkg.origin?.split(',')[0] || '—')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                                        <span className="text-xs font-semibold text-slate-700 truncate">
                                                            {typeof pkg.destination === 'object' && pkg.destination?.address
                                                                ? pkg.destination.address.split(',')[0]
                                                                : (pkg.destination?.split(',')[0] || pkg.address?.split(',')[0] || '—')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-sm text-slate-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                                                {pkg.recipientName}
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    className="select select-sm border-0 font-bold focus:ring-0 cursor-pointer px-2"
                                                    style={{
                                                        background: colors.bg,
                                                        color: colors.text,
                                                        borderRadius: '9999px',
                                                        height: '28px',
                                                        minHeight: '28px',
                                                        fontSize: '0.75rem',
                                                        width: '100%',
                                                    }}
                                                    value={status}
                                                    onChange={(e) => handleQuickStatusUpdate(pkg.id, e.target.value)}
                                                >
                                                    {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-white text-slate-800">{t(s as any)}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                                                    <Building2 size={13} className="text-slate-400" />
                                                    <span className="truncate max-w-[120px]">{pkg.logisticsCompany && pkg.logisticsCompany !== 'UNASSIGNED' ? pkg.logisticsCompany : <span className="text-slate-400 italic">Pendiente</span>}</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                {pkg.interestedCarriers?.length > 0 ? (
                                                    <span
                                                        title={`${pkg.interestedCarriers.length} solicitud(es)`}
                                                        className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 rounded-full px-2.5 py-0.5 text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); toggleRow(pkg); }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                                        {pkg.interestedCarriers.length}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        className="btn btn-ghost btn-xs btn-square text-slate-400 hover:text-indigo-600"
                                                        onClick={() => generateShippingGuide(pkg)}
                                                        title="Guía"
                                                    >
                                                        <FileText size={15} />
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-xs btn-square text-slate-400 hover:text-indigo-600"
                                                        onClick={() => handleOpenModal('edit', pkg)}
                                                        title="Editar"
                                                    >
                                                        <Edit size={15} />
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-xs btn-square text-slate-400 hover:text-rose-600"
                                                        onClick={() => handleDelete(pkg.id)}
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-xs btn-square text-slate-400 hover:text-indigo-600"
                                                        onClick={() => toggleRow(pkg)}
                                                    >
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-slate-50/50">
                                                <td colSpan={7} className="p-0">
                                                    <div className="p-6 border-b border-slate-100">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                            {/* LEFT: Assignment Form */}
                                                            <div className="space-y-4">
                                                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                                    <Truck size={16} className="text-indigo-500" />
                                                                    Asignación Logística
                                                                </h4>

                                                                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-xs font-bold text-slate-600">Empresa Logística (Aliado)</label>
                                                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 flex items-center justify-between gap-2">
                                                                            <div className="flex items-center gap-2 overflow-hidden w-full">
                                                                                <Building2 size={14} className="text-slate-400 shrink-0" />
                                                                                {pkg.logisticsCompany && pkg.logisticsCompany !== 'UNASSIGNED' ? (
                                                                                    <span className="font-medium truncate text-indigo-700">
                                                                                        {pkg.logisticsCompany}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-slate-400 italic truncate">Sin Asignar</span>
                                                                                )}
                                                                            </div>
                                                                            {canEditAssignment && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setPkgToAssign(pkg);
                                                                                        setSelectedCarrierForAssign(pkg.logisticsCompany === 'UNASSIGNED' ? '' : pkg.logisticsCompany || '');
                                                                                        setIsAssignCarrierModalOpen(true);
                                                                                    }}
                                                                                    className="btn btn-ghost btn-xs text-indigo-600 hover:bg-indigo-50 border border-slate-200 shrink-0 h-7 min-h-7 px-3"
                                                                                >
                                                                                    Cambiar
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-1.5">
                                                                        <label className="text-xs font-bold text-slate-600">Vehículo de Flotilla</label>
                                                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 flex items-center gap-2">
                                                                            <Truck size={14} className="text-slate-400" />
                                                                            {pkg.vehicleId ? (
                                                                                <span className="font-medium">
                                                                                    {vehicles.find(v => v.id === pkg.vehicleId)?.name || 'Vehículo'}
                                                                                    {vehicles.find(v => v.id === pkg.vehicleId)?.plates ? ` (${vehicles.find(v => v.id === pkg.vehicleId)?.plates})` : ''}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-slate-400 italic">Pendiente por asignar (Carrier)</span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-1.5">
                                                                        <label className="text-xs font-bold text-slate-600">Conductor Responsable</label>
                                                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 flex items-center gap-2">
                                                                            <User size={14} className="text-slate-400" />
                                                                            {pkg.driverId ? (
                                                                                <span className="font-medium">
                                                                                    {drivers.find(d => d.id === pkg.driverId)?.name || 'Conductor asignado'}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-slate-400 italic">Pendiente por asignar (Carrier)</span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            </div>

                                                            {/* RIGHT: ROI Projection */}
                                                            <div className="space-y-4">
                                                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                                    <DollarSign size={16} className="text-emerald-500" />
                                                                    Proyección ROI
                                                                </h4>
                                                                {costs ? (
                                                                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-sm">
                                                                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                                                            <span className="text-slate-500">Costo Operativo</span>
                                                                            <strong className="text-slate-800">{formatCurrency(costs.operationalCost ?? 0)}</strong>
                                                                        </div>
                                                                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                                                            <span className="text-slate-500">Seguro (Base)</span>
                                                                            <strong className="text-slate-800">{formatCurrency(costs.insurance ?? 0)}</strong>
                                                                        </div>
                                                                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                                                            <span className="text-slate-500">Depreciación</span>
                                                                            <strong className="text-slate-800">{formatCurrency(costs.depreciation ?? 0)}</strong>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-emerald-600 font-medium">
                                                                            <span>Utilidad Estimada</span>
                                                                            <strong>+{formatCurrency(costs.utility ?? 0)} ({(costs.utilityPercent ?? 0).toFixed(1)}%)</strong>
                                                                        </div>
                                                                        <div className="pt-3 mt-3 border-t-2 border-dashed border-slate-100">
                                                                            <div className="flex justify-between items-center">
                                                                                <strong className="text-indigo-600">Cotización Final</strong>
                                                                                <strong className="text-lg text-indigo-700">{formatCurrency(costs.priceToClient ?? 0)}</strong>
                                                                            </div>
                                                                            <p className="text-[0.7rem] text-slate-400 mt-1">*Incluye margen operativo e IVA 16%</p>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                                                                        <Info size={24} className="mx-auto mb-2 opacity-50" />
                                                                        <p className="text-xs px-4">{recommendation.message}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="text-center py-12 text-slate-500">
                                            <PackageIcon size={32} className="mx-auto mb-3 opacity-20" />
                                            <p className="text-sm font-medium">No hay envíos que coincidan con los filtros.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gestionar Envío">
                <form key={currentItem?.id || 'new'} onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const payload: any = Object.fromEntries(formData.entries());
                    payload.weight = Number(payload.weight);
                    payload.declaredValue = Number(payload.declaredValue || 0);
                    payload.price = Number(payload.price || 0);

                    try {
                        const endpoint = modalMode === 'create' ? '/api/packages' : `/api/packages/${currentItem.id}`;
                        const method = modalMode === 'create' ? 'POST' : 'PUT';
                        if (modalMode === 'create') payload.userId = user?.uid;
                        const res = await authenticatedFetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                        if (res.ok) { setIsModalOpen(false); fetchData(); }
                    } catch (err) { console.error(err); }
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Tracking ID</label>
                            <input name="trackingId" className="input" defaultValue={currentItem?.trackingId || `PKG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`} required />
                        </div>

                        <div className="input-group"><label>Destinatario</label><input name="recipientName" className="input" defaultValue={currentItem?.recipientName} required /></div>
                        <div className="input-group"><label>Teléfono Receptor</label><input name="receiverPhone" className="input" defaultValue={currentItem?.receiverPhone || currentItem?.recipientPhone} /></div>

                        <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Dirección Origen</label><input name="origin" className="input" defaultValue={currentItem?.origin} /></div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Dirección Destino</label><input name="address" className="input" defaultValue={currentItem?.address || currentItem?.destination} required /></div>

                        <div className="input-group"><label>Peso (kg)</label><input name="weight" type="number" className="input" defaultValue={currentItem?.weight} /></div>
                        <div className="input-group"><label>Dimensiones (LxWxH)</label><input name="dimensions" className="input" defaultValue={currentItem?.dimensions} placeholder="10x10x10" /></div>

                        <div className="input-group">
                            <label>Tipo de Carga</label>
                            <select name="loadType" className="input" defaultValue={currentItem?.loadType}>
                                <option value="">Seleccionar...</option>
                                <option value="package">Paquetería</option>
                                <option value="full-truck">Camión Completo</option>
                                <option value="van">Camioneta</option>
                                <option value="recurring">Recurrente</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Nivel de Servicio</label>
                            <select name="serviceLevel" className="input" defaultValue={currentItem?.serviceLevel}>
                                <option value="standard">Estándar</option>
                                <option value="express">Express</option>
                            </select>
                        </div>

                        <div className="input-group"><label>Valor Declarado ($)</label><input name="declaredValue" type="number" className="input" defaultValue={currentItem?.declaredValue} /></div>
                        <div className="input-group"><label>Precio al Cliente ($)</label><input name="price" type="number" className="input" defaultValue={currentItem?.price || currentItem?.cost} /></div>

                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Empresa Logística</label>
                            <select
                                name="logisticsCompany"
                                className="input"
                                defaultValue={currentItem?.logisticsCompany}
                                disabled={!canEditAssignment}
                            >
                                <option value="">Ninguna</option>
                                {availableCarriers.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Descripción / Instrucciones</label><textarea name="description" className="input" style={{ height: '80px' }} defaultValue={currentItem?.description || currentItem?.instructions}></textarea></div>
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAssignCarrierModalOpen} onClose={() => setIsAssignCarrierModalOpen(false)} title="Asignar Empresa Logística">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Selecciona la empresa aliada responsable de llevar este envío.
                        El transportista será el encargado de asignar conductor y vehículo.
                    </p>
                    <select
                        className="select select-bordered w-full bg-slate-50 focus:border-indigo-500 transition-shadow"
                        value={selectedCarrierForAssign}
                        onChange={(e) => setSelectedCarrierForAssign(e.target.value)}
                    >
                        <option value="" disabled>Seleccionar Empresa...</option>
                        {availableCarriers.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                        <button className="btn btn-ghost border border-slate-200 text-slate-600" onClick={() => setIsAssignCarrierModalOpen(false)}>
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary shadow-sm"
                            onClick={async () => {
                                if (!pkgToAssign) return;
                                try {
                                    const res = await authenticatedFetch(`/api/packages/${pkgToAssign.id}/assign`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            logisticsCompany: selectedCarrierForAssign,
                                            driverId: '',
                                            vehicleId: ''
                                        })
                                    });
                                    if (res.ok) {
                                        alert('Empresa asignada correctamente');
                                        setIsAssignCarrierModalOpen(false);
                                        fetchData();
                                    }
                                } catch (e) {
                                    console.error(e);
                                }
                            }}
                        >
                            <Save size={16} className="mr-1" /> Asignar Empresa
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
