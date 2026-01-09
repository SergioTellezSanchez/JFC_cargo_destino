'use client';

import React, { useState, useEffect } from 'react';
import { Package as PackageIcon, Plus, Edit, Trash2, Search, Filter, ChevronDown, ChevronUp, FileText, Truck, DollarSign, Save, AlertTriangle, CheckCircle2, Box, MapPin, User, Info, Building2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { useUser } from '@/lib/UserContext';
import { authenticatedFetch } from '@/lib/api';
import { generateShippingGuide } from '@/lib/pdfGenerator';
import { calculateLogisticsCosts, isVehicleSuitable, Vehicle, Package as PackageType } from '@/lib/logistics';
import Modal from '@/components/Modal';

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
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
            const costA = calculateLogisticsCosts(pkg as PackageType, a, settings).operationalCost;
            const costB = calculateLogisticsCosts(pkg as PackageType, b, settings).operationalCost;
            return costA - costB;
        })[0];

        return { message: `Sugerencia: ${bestVehicle.name} (${bestVehicle.plate || 'S/P'})`, status: 'success', vehicle: bestVehicle };
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
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tracking ID</th>
                                    <th>Destinatario</th>
                                    <th style={{ width: '180px' }}>Estado</th>
                                    <th>Aliado / Empresa</th>
                                    <th>Acciones</th>
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

                                    return (
                                        <React.Fragment key={pkg.id}>
                                            <tr style={{ background: isExpanded ? 'var(--secondary-bg)' : 'transparent' }}>
                                                <td style={{ fontWeight: 'bold' }}>{pkg.trackingId}</td>
                                                <td>{pkg.recipientName}</td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        className="input"
                                                        style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', height: 'auto', border: '1px solid var(--border)' }}
                                                        value={status}
                                                        onChange={(e) => handleQuickStatusUpdate(pkg.id, e.target.value)}
                                                    >
                                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(s as any)}</option>)}
                                                    </select>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                                                        <Building2 size={14} /> {pkg.logisticsCompany || 'Pendiente'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-secondary" style={{ padding: '0.3rem' }} onClick={() => generateShippingGuide(pkg)}><FileText size={16} /></button>
                                                        <button className="btn btn-secondary" style={{ padding: '0.3rem' }} onClick={() => toggleRow(pkg)}>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                                                        <button className="btn btn-secondary" style={{ padding: '0.3rem' }} onClick={() => handleOpenModal('edit', pkg)}><Edit size={16} /></button>
                                                        <button className="btn btn-danger" style={{ padding: '0.3rem' }} onClick={() => handleDelete(pkg.id)}><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={5} style={{ padding: '2rem', background: 'var(--secondary-bg)' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                                                            <div className="card" style={{ padding: '1.5rem', background: 'var(--secondary-bg)', border: '1px solid var(--border)' }}>
                                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary)' }}>
                                                                    <Truck size={20} /> Asignación Logística
                                                                </h3>

                                                                <div className="space-y-5">
                                                                    <div className="input-group" style={{ margin: 0 }}>
                                                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '0.4rem', display: 'block' }}>Empresa Logística (Aliado)</label>
                                                                        <select
                                                                            className="input"
                                                                            style={{ width: '100%', margin: 0, height: '42px' }}
                                                                            value={assignmentState.logisticsCompany}
                                                                            onChange={(e) => setAssignmentState({ ...assignmentState, logisticsCompany: e.target.value, vehicleId: '', driverId: '' })}
                                                                        >
                                                                            <option value="">Seleccionar Empresa</option>
                                                                            {LOGISTICS_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                                        </select>
                                                                    </div>

                                                                    <div className="input-group" style={{ margin: 0 }}>
                                                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '0.4rem', display: 'block' }}>Vehículo de Flotilla</label>
                                                                        <select
                                                                            className="input"
                                                                            style={{ width: '100%', margin: 0, height: '42px' }}
                                                                            value={assignmentState.vehicleId}
                                                                            onChange={(e) => setAssignmentState({ ...assignmentState, vehicleId: e.target.value })}
                                                                        >
                                                                            <option value="">Seleccionar Vehículo</option>
                                                                            {vehicles
                                                                                .filter(v => !assignmentState.logisticsCompany || v.company === assignmentState.logisticsCompany)
                                                                                .filter(v => isVehicleSuitable(v, pkg as PackageType))
                                                                                .map(v => (
                                                                                    <option key={v.id} value={v.id}>{v.name || 'Vehículo'} ({v.plate || 'S/P'})</option>
                                                                                ))}
                                                                        </select>
                                                                        {vehicles.filter(v => (!assignmentState.logisticsCompany || v.company === assignmentState.logisticsCompany) && isVehicleSuitable(v, pkg as PackageType)).length === 0 && (
                                                                            <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                                <AlertTriangle size={12} /> No hay vehículos adecuados.
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    <div className="input-group" style={{ margin: 0 }}>
                                                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '0.4rem', display: 'block' }}>Conductor Responsable</label>
                                                                        <select
                                                                            className="input"
                                                                            style={{ width: '100%', margin: 0, height: '42px' }}
                                                                            value={assignmentState.driverId}
                                                                            onChange={(e) => setAssignmentState({ ...assignmentState, driverId: e.target.value })}
                                                                        >
                                                                            <option value="">Seleccionar Conductor</option>
                                                                            {drivers
                                                                                .filter(d => !assignmentState.logisticsCompany || d.company === assignmentState.logisticsCompany)
                                                                                .map(d => (
                                                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                                                ))}
                                                                        </select>
                                                                    </div>

                                                                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', height: '45px', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)' }} onClick={() => handleAssignmentUpdate(pkg.id)}>
                                                                        <Save size={18} /> Actualizar Asignación
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)' }}>
                                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <DollarSign size={18} className="text-secondary" /> Proyección ROI
                                                                </h3>
                                                                {costs ? (
                                                                    <div className="space-y-3" style={{ fontSize: '0.95rem' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                                                            <span style={{ color: 'var(--secondary)' }}>Costo Operativo</span>
                                                                            <strong>{formatCurrency(costs.operationalCost)}</strong>
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                                                            <span style={{ color: 'var(--secondary)' }}>Seguro (Base)</span>
                                                                            <strong>{formatCurrency(costs.insurance)}</strong>
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                                                            <span style={{ color: 'var(--secondary)' }}>Depreciación</span>
                                                                            <strong>{formatCurrency(costs.depreciation)}</strong>
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                                                                            <span>Utilidad Estimada</span>
                                                                            <strong>+{formatCurrency(costs.utility)} ({costs.utilityPercent.toFixed(1)}%)</strong>
                                                                        </div>
                                                                        <div style={{ marginTop: '1rem', borderTop: '2px dashed var(--border)', paddingTop: '1rem', fontSize: '1.1rem' }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                <strong style={{ color: 'var(--primary)' }}>Cotización Final</strong>
                                                                                <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>{formatCurrency(costs.priceToClient)}</strong>
                                                                            </div>
                                                                            <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>*Incluye margen operativo e IVA 16%</p>
                                                                        </div>
                                                                    </div>
                                                                ) : <div style={{ textAlign: 'center', color: 'var(--secondary)', padding: '2rem', background: 'var(--secondary-bg)', borderRadius: '0.5rem', border: '1px dashed var(--border)' }}>
                                                                    <Info size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                                                    <p style={{ fontSize: '0.85rem' }}>{recommendation.message}</p>
                                                                </div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                }) : (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No hay envíos.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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

                        <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Empresa Logística</label><select name="logisticsCompany" className="input" defaultValue={currentItem?.logisticsCompany}><option value="">Ninguna</option>{LOGISTICS_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Descripción / Instrucciones</label><textarea name="description" className="input" style={{ height: '80px' }} defaultValue={currentItem?.description || currentItem?.instructions}></textarea></div>
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
