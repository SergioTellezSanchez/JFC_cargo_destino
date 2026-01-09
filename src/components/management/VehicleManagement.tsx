'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Edit, Trash2, Search, Filter, ChevronDown, ChevronUp, Box, Users, Building2, CheckSquare, Square, UserPlus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { useUser } from '@/lib/UserContext';
import { authenticatedFetch } from '@/lib/api';
import Modal from '@/components/Modal';
import { VEHICLE_CATEGORIES } from '@/lib/logistics';

interface VehicleManagementProps {
    isAdminView?: boolean;
}

const TRUCK_STANDARDS: Record<string, { weight: number, volume: number }> = {
    'Kenworth T680': { weight: 28000, volume: 85 },
    'Freightliner Cascadia': { weight: 30000, volume: 90 },
    'Volvo VNL 860': { weight: 29000, volume: 88 },
    'International LT Series': { weight: 27500, volume: 82 },
    'Peterbilt 579': { weight: 28500, volume: 86 },
    'Mack Anthem': { weight: 27000, volume: 80 },
    'Hino 338': { weight: 14000, volume: 45 },
    'Isuzu NPR-HD': { weight: 6500, volume: 22 },
    'Torton': { weight: 14000, volume: 50 },
    'Trailer': { weight: 30000, volume: 90 },
    'Camioneta 1.5 Tons': { weight: 1500, volume: 10 },
    'Camioneta 3.5 Tons': { weight: 3500, volume: 18 },
    'Nissan NPM': { weight: 1500, volume: 8 }
};

const PARTNER_COMPANIES = [
    'JFC Cargo Central',
    'Logística Express MX',
    'Transportes del Norte',
    'Mudanzas Rápidas S.A.',
    'Flotilla Continental',
    'Aliado Estratégico Bajío'
];

export default function VehicleManagement({ isAdminView = false }: VehicleManagementProps) {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const { user, isAdmin, loading: authLoading } = useUser();

    const [vehicles, setVehicles] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>(['ALL']);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [suspensionOptions, setSuspensionOptions] = useState<string[]>(['Neumática', 'Mecánica', 'Hidráulica', 'Muelles', 'Bolsas de Aire']);
    const [fuelPrices, setFuelPrices] = useState<any>({ diesel: 25.00, gasoline91: 26.50, gasoline87: 24.50 });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentItem, setCurrentItem] = useState<any>(null);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState<any>(null);
    const [tempDriverIds, setTempDriverIds] = useState<string[]>([]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [vRes, sRes, dRes] = await Promise.all([
                authenticatedFetch('/api/vehicles'),
                authenticatedFetch('/api/settings'),
                authenticatedFetch('/api/drivers')
            ]);

            if (vRes.ok) {
                let data = await vRes.json();
                if (!isAdmin && !isAdminView) {
                    data = data.filter((v: any) => v.createdBy === user?.uid);
                }
                setVehicles(data);
            }

            if (dRes.ok) {
                setDrivers(await dRes.json());
            }

            if (sRes.ok) {
                const settings = await sRes.json();
                if (settings.suspensionTypes && settings.suspensionTypes.length > 0) {
                    setSuspensionOptions(settings.suspensionTypes);
                }
                if (settings.fuelPrices) {
                    setFuelPrices(settings.fuelPrices);
                }
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
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
        setEditForm({
            fuelType: item?.fuelType || 'diesel',
            fuelEfficiency: item?.fuelEfficiency || 2
        });
        setIsModalOpen(true);
    };

    const [editForm, setEditForm] = useState({
        fuelType: 'diesel',
        fuelEfficiency: 2
    });

    const handleOpenAssignModal = (vehicle: any) => {
        setAssignTarget(vehicle);
        const currentIds = Array.isArray(vehicle.driverId) ? vehicle.driverId : (vehicle.driverId ? [vehicle.driverId] : []);
        setTempDriverIds(currentIds);
        setIsAssignModalOpen(true);
    };

    const handleSaveAssignment = async () => {
        if (!assignTarget) return;
        try {
            const res = await authenticatedFetch(`/api/vehicles/${assignTarget.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...assignTarget,
                    driverId: tempDriverIds.length === 1 ? tempDriverIds[0] : tempDriverIds
                })
            });
            if (res.ok) {
                setIsAssignModalOpen(false);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete') + '?')) return;
        try {
            const res = await authenticatedFetch(`/api/vehicles/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert(t('completed'));
                fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredVehicles.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredVehicles.map(v => v.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
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

    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = (v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.company?.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesCompany = true;
        if (!selectedCompanies.includes('ALL')) {
            const vCompany = v.company || 'UNASSIGNED';
            matchesCompany = selectedCompanies.includes(vCompany);
        }

        return matchesSearch && matchesCompany;
    });

    // Group drivers by company for the assign modal
    const driversByCompany = drivers.reduce((acc: any, driver: any) => {
        const company = driver.company || 'JFC Cargo Central';
        if (!acc[company]) acc[company] = [];
        acc[company].push(driver);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, placa o empresa..."
                            className="input"
                            style={{ paddingLeft: '2.5rem', margin: 0 }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {selectedIds.length > 0 && (
                            <button className="btn btn-secondary" onClick={() => { if (confirm('¿Eliminar seleccionados?')) { } }}>
                                <Trash2 size={18} /> ({selectedIds.length})
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={() => handleOpenModal('create')}>
                            <Plus size={18} /> Agregar Vehículo
                        </button>
                    </div>
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
                    {PARTNER_COMPANIES.map(company => (
                        <label key={company} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', padding: '0.25rem 0.6rem', borderRadius: '0.5rem', background: selectedCompanies.includes(company) ? 'var(--secondary-bg)' : 'transparent', color: selectedCompanies.includes(company) ? 'var(--primary)' : 'inherit', border: selectedCompanies.includes(company) ? '1px solid var(--primary)' : '1px solid transparent' }}>
                            <input type="checkbox" checked={selectedCompanies.includes(company)} onChange={() => toggleCompany(company)} style={{ cursor: 'pointer' }} />
                            {company}
                        </label>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando flota...</div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div onClick={handleSelectAll} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                            {selectedIds.length === filteredVehicles.length && filteredVehicles.length > 0 ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} />}
                            {selectedIds.length > 0 ? `${selectedIds.length} seleccionados` : 'Seleccionar todos'}
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th>Nombre / Modelo</th>
                                    <th>Empresa</th>
                                    <th>Placa</th>
                                    <th>Capacidad</th>
                                    <th>Conductor(es)</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVehicles.length > 0 ? filteredVehicles.map((v: any, index: number) => {
                                    const isExpanded = expandedRow === v.id;
                                    const isSelected = selectedIds.includes(v.id);

                                    const truckKeys = Object.keys(TRUCK_STANDARDS);
                                    const displayName = v.name || truckKeys[index % truckKeys.length];
                                    const displayCompany = v.company || PARTNER_COMPANIES[index % PARTNER_COMPANIES.length];

                                    const standards = TRUCK_STANDARDS[displayName] || TRUCK_STANDARDS['Trailer'];
                                    const weightCap = Number(v.capacity) || standards.weight;
                                    const assignedDriverIds = Array.isArray(v.driverId) ? v.driverId : (v.driverId ? [v.driverId] : []);
                                    const assignedDriverNames = drivers.filter(d => assignedDriverIds.includes(d.id)).map(d => d.name);

                                    return (
                                        <React.Fragment key={v.id}>
                                            <tr
                                                style={{
                                                    background: isSelected ? 'rgba(var(--primary-rgb), 0.05)' : (isExpanded ? 'var(--secondary-bg)' : 'transparent'),
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onClick={() => setExpandedRow(isExpanded ? null : v.id)}
                                                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--secondary-bg)'; }}
                                                onMouseLeave={(e) => {
                                                    if (!isExpanded && !isSelected) e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <td onClick={(e) => { e.stopPropagation(); toggleSelect(v.id); }}>
                                                    {isSelected ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} color="var(--secondary)" />}
                                                </td>
                                                <td style={{ fontWeight: '600' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        {isExpanded ? <ChevronUp size={16} color="var(--primary)" /> : <ChevronDown size={16} color="var(--secondary)" />}
                                                        {displayName}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                                                        <Building2 size={14} /> {displayCompany}
                                                    </div>
                                                </td>
                                                <td><span className="badge badge-secondary">{v.plate || 'S/P'}</span></td>
                                                <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{weightCap.toLocaleString()} kg</td>
                                                <td onClick={(e) => { e.stopPropagation(); handleOpenAssignModal(v); }}>
                                                    <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Users size={14} />
                                                        {assignedDriverNames.length > 0 ? assignedDriverNames.join(', ') : 'Asignar'}
                                                    </button>
                                                </td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => handleOpenModal('edit', v)}><Edit size={16} /></button>
                                                        <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(v.id)}><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={7} style={{ padding: '2rem', background: 'var(--secondary-bg)' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                                            <div className="card" style={{ padding: '1.25rem' }}>
                                                                <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Ficha Técnica</h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
                                                                    <div><strong>Vida Útil:</strong> {v.usefulLifeKm?.toLocaleString() || '800,000'} km</div>
                                                                    <div><strong>Valor ($):</strong> {formatCurrency(Number(v.value) || 2500000)}</div>
                                                                    <div><strong>Suspensión:</strong> {v.suspensionType || 'Mecánica'}</div>
                                                                </div>
                                                            </div>
                                                            <div className="card" style={{ padding: '1.25rem' }}>
                                                                <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Operación / Aliado</h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
                                                                    <div><strong>Empresa:</strong> {displayCompany}</div>
                                                                    <div><strong>Conductores:</strong> {assignedDriverNames.join(', ') || 'Ninguno'}</div>
                                                                    <div><strong>Estado:</strong> <span className="badge badge-success">Activo</span></div>
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
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>No se encontraron vehículos.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            )}

            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Asignar Conductores" maxWidth="900px">
                <div className="space-y-6">
                    <p style={{ fontSize: '0.95rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                        Selecciona los conductores para la unidad: <strong style={{ color: 'var(--primary)' }}>{assignTarget?.name || 'Vehículo'}</strong>
                    </p>

                    <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }} className="space-y-8">
                        {Object.entries(driversByCompany).map(([company, companyDrivers]: [string, any]) => (
                            <section key={company} className="space-y-3">
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', background: 'var(--secondary-bg)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                                    <Building2 size={18} /> {company}
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                    {companyDrivers.map((d: any) => (
                                        <label
                                            key={d.id}
                                            className="card"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '1rem',
                                                cursor: 'pointer',
                                                border: tempDriverIds.includes(d.id) ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                background: tempDriverIds.includes(d.id) ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--card-bg)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={tempDriverIds.includes(d.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setTempDriverIds([...tempDriverIds, d.id]);
                                                    else setTempDriverIds(tempDriverIds.filter(id => id !== d.id));
                                                }}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{d.name}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Users size={12} /> Conductor
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAssignModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveAssignment}>Guardar Asignación</button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${modalMode === 'create' ? 'Agregar' : 'Editar'} Vehículo`}
            >
                <form
                    key={currentItem?.id || 'new'}
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const selectedSuspensions = formData.getAll('suspensionType');
                        const payload: any = Object.fromEntries(formData.entries());
                        payload.suspensionType = selectedSuspensions.join(', ');
                        payload.capacity = Number(payload.capacity);
                        payload.volumetricCapacity = Number(payload.volumetricCapacity);
                        payload.usefulLifeKm = Number(payload.usefulLifeKm);
                        payload.value = Number(payload.value);
                        payload.fuelEfficiency = Number(payload.fuelEfficiency);

                        // Handle dimensions
                        payload.dimensions = {
                            l: Number(payload['dimensions.l']),
                            w: Number(payload['dimensions.w']),
                            h: Number(payload['dimensions.h'])
                        };
                        delete payload['dimensions.l'];
                        delete payload['dimensions.w'];
                        delete payload['dimensions.h'];

                        // Handle uses
                        payload.uses = payload.uses?.split(',').map((u: string) => u.trim()).filter(Boolean) || [];

                        try {
                            const endpoint = modalMode === 'create' ? '/api/vehicles' : `/api/vehicles/${currentItem.id}`;
                            const method = modalMode === 'create' ? 'POST' : 'PUT';
                            if (modalMode === 'create') payload.createdBy = user?.uid;

                            const res = await authenticatedFetch(endpoint, {
                                method,
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                            });

                            if (res.ok) {
                                setIsModalOpen(false);
                                fetchData();
                            }
                        } catch (error) { console.error(error); }
                    }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Nombre / Modelo</label>
                            <input name="name" type="text" className="input" defaultValue={currentItem?.name} required placeholder="Kenworth, Volvo..." />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Empresa / Aliado</label>
                            <select name="company" className="input" defaultValue={currentItem?.company || 'JFC Cargo Central'}>
                                {PARTNER_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Placa</label>
                            <input name="plate" type="text" className="input" defaultValue={currentItem?.plate} required placeholder="ABC-123" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Tipo de Combustible</label>
                            <select
                                name="fuelType"
                                className="input"
                                value={editForm.fuelType}
                                onChange={(e) => setEditForm({ ...editForm, fuelType: e.target.value as any })}
                            >
                                <option value="diesel">Diesel</option>
                                <option value="gasoline87">Magna (87)</option>
                                <option value="gasoline91">Premium (91)</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Rendimiento Combustible (km/L)</label>
                            <input
                                name="fuelEfficiency"
                                type="number"
                                step="0.1"
                                className="input"
                                value={editForm.fuelEfficiency}
                                onChange={(e) => setEditForm({ ...editForm, fuelEfficiency: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Capacidad de Carga (kg)</label>
                            <input name="capacity" type="number" className="input" defaultValue={currentItem?.capacity} required />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Vida Útil (km)</label>
                            <input name="usefulLifeKm" type="number" className="input" defaultValue={currentItem?.usefulLifeKm || 800000} />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Valor de la Unidad ($)</label>
                            <input name="value" type="number" className="input" defaultValue={currentItem?.value || 2500000} />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Categoría de Vehículo</label>
                            <select name="category" className="input" defaultValue={currentItem?.category || VEHICLE_CATEGORIES.RIGIDOS}>
                                {Object.entries(VEHICLE_CATEGORIES).map(([key, val]) => (
                                    <option key={key} value={val}>{val}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Capacidad Volumétrica (m³)</label>
                            <input name="volumetricCapacity" type="number" className="input" defaultValue={currentItem?.volumetricCapacity || 0} />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Dimensiones (Largo x Ancho x Alto en metros)</label>
                            <div className="grid grid-cols-3 gap-2">
                                <input name="dimensions.l" type="number" step="0.1" className="input" placeholder="Largo" defaultValue={currentItem?.dimensions?.l} />
                                <input name="dimensions.w" type="number" step="0.1" className="input" placeholder="Ancho" defaultValue={currentItem?.dimensions?.w} />
                                <input name="dimensions.h" type="number" step="0.1" className="input" placeholder="Alto" defaultValue={currentItem?.dimensions?.h} />
                            </div>
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Usos / Etiquetas (Separados por coma)</label>
                            <input name="uses" type="text" className="input" defaultValue={currentItem?.uses?.join(', ')} placeholder="Ej: Urbano, Refrigerado, Pesado..." />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Descripción</label>
                            <textarea name="description" className="input" style={{ height: '80px', resize: 'none' }} defaultValue={currentItem?.description} placeholder="Descripción detallada de la unidad..." />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Tipos de Suspensión</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginTop: '0.5rem', padding: '0.75rem', background: 'var(--card-bg)', borderRadius: '0.6rem', border: '1px solid var(--border)' }}>
                                {suspensionOptions.map(type => (
                                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input type="checkbox" name="suspensionType" value={type} defaultChecked={currentItem?.suspensionType?.includes(type)} />
                                        {type}
                                    </label>
                                ))}
                            </div>
                        </div>
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
