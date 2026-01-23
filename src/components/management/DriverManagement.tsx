'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, Phone, CreditCard, Truck, ChevronDown, ChevronUp, Mail, Building2, CheckSquare, Square } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { useUser } from '@/lib/UserContext';
import { authenticatedFetch } from '@/lib/api';
import Modal from '@/components/Modal';
import Spinner from '@/components/Spinner';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface DriverManagementProps {
    isAdminView?: boolean;
}

const PARTNER_COMPANIES = [
    'JFC Cargo Central',
    'Logística Express MX',
    'Transportes del Norte',
    'Mudanzas Rápidas S.A.',
    'Flotilla Continental',
    'Aliado Estratégico Bajío'
];

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

export default function DriverManagement({ isAdminView = false }: DriverManagementProps) {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const { user, isAdmin, loading: authLoading } = useUser();

    const [drivers, setDrivers] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>(['ALL']);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentItem, setCurrentItem] = useState<any>(null);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState<any>(null);
    const [tempVehicleIds, setTempVehicleIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [dRes, vRes] = await Promise.all([
                authenticatedFetch('/api/drivers'),
                authenticatedFetch('/api/vehicles')
            ]);

            if (dRes.ok) {
                let data = await dRes.json();
                if (!isAdmin && !isAdminView) {
                    data = data.filter((d: any) => d.createdBy === user?.uid);
                }
                setDrivers(data);
            }

            if (vRes.ok) {
                setVehicles(await vRes.json());
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
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

    const handleOpenAssignModal = (driver: any) => {
        setAssignTarget(driver);
        // Supports multiple vehicles if vehicleId is an array
        const currentIds = Array.isArray(driver.vehicleId) ? driver.vehicleId : (driver.vehicleId ? [driver.vehicleId] : []);
        setTempVehicleIds(currentIds);
        setIsAssignModalOpen(true);
    };

    const handleSaveAssignment = async () => {
        if (!assignTarget) return;
        try {
            const res = await authenticatedFetch(`/api/drivers/${assignTarget.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...assignTarget,
                    vehicleId: tempVehicleIds.length === 1 ? tempVehicleIds[0] : tempVehicleIds
                })
            });
            if (res.ok) {
                setIsAssignModalOpen(false);
                fetchData();
            }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete') + '?')) return;
        try {
            const res = await authenticatedFetch(`/api/drivers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert(t('completed'));
                fetchData();
            }
        } catch (error) { console.error(error); }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredDrivers.length) setSelectedIds([]);
        else setSelectedIds(filteredDrivers.map(d => d.id));
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
        else setSelectedIds([...selectedIds, id]);
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

    const filteredDrivers = drivers.filter(d => {
        const matchesSearch = (d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.company?.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesCompany = true;
        if (!selectedCompanies.includes('ALL')) {
            const dCompany = d.company || 'UNASSIGNED';
            matchesCompany = selectedCompanies.includes(dCompany);
        }

        return matchesSearch && matchesCompany;
    });

    // Group vehicles by company for the assign modal
    const vehiclesByCompany = vehicles.reduce((acc: any, vehicle: any, index: number) => {
        const company = vehicle.company || PARTNER_COMPANIES[index % PARTNER_COMPANIES.length];
        if (!acc[company]) acc[company] = [];

        const truckKeys = Object.keys(TRUCK_STANDARDS);
        const displayName = vehicle.name || truckKeys[index % truckKeys.length];
        acc[company].push({ ...vehicle, displayName, displayCompany: company });

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
                            placeholder="Buscar por nombre, teléfono o empresa..."
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
                            <Plus size={18} /> Agregar Conductor
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
                <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando conductores...</div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div onClick={handleSelectAll} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                            {selectedIds.length === filteredDrivers.length && filteredDrivers.length > 0 ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} />}
                            {selectedIds.length > 0 ? `${selectedIds.length} seleccionados` : 'Seleccionar todos'}
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th>Foto</th>
                                    <th>Nombre</th>
                                    <th>Empresa</th>
                                    <th>Teléfono</th>
                                    <th>Edad</th>
                                    <th>Licencia</th>
                                    <th>Vehículo(s)</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDrivers.length > 0 ? filteredDrivers.map((d: any, index: number) => {
                                    const isExpanded = expandedRow === d.id;
                                    const isSelected = selectedIds.includes(d.id);
                                    const assignedVehicleIds = Array.isArray(d.vehicleId) ? d.vehicleId : (d.vehicleId ? [d.vehicleId] : []);
                                    const assignedVehicleNames = vehicles.map((v, idx) => {
                                        if (!assignedVehicleIds.includes(v.id)) return null;
                                        const truckKeys = Object.keys(TRUCK_STANDARDS);
                                        return v.name || truckKeys[idx % truckKeys.length];
                                    }).filter(Boolean);
                                    const displayCompany = d.company || PARTNER_COMPANIES[index % PARTNER_COMPANIES.length];

                                    return (
                                        <React.Fragment key={d.id}>
                                            <tr
                                                style={{
                                                    background: isSelected ? 'rgba(var(--primary-rgb), 0.05)' : (isExpanded ? 'var(--secondary-bg)' : 'transparent'),
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onClick={() => setExpandedRow(isExpanded ? null : d.id)}
                                                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--secondary-bg)'; }}
                                                onMouseLeave={(e) => {
                                                    if (!isExpanded && !isSelected) e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <td onClick={(e) => { e.stopPropagation(); toggleSelect(d.id); }}>
                                                    {isSelected ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} color="var(--secondary)" />}
                                                </td>
                                                <td>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--secondary-bg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                                                        {d.photoUrl ? (
                                                            <img src={d.photoUrl} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <Users size={20} style={{ margin: 'auto', color: 'var(--secondary)' }} />
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: '600' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        {isExpanded ? <ChevronUp size={16} color="var(--primary)" /> : <ChevronDown size={16} color="var(--secondary)" />}
                                                        {d.name || 'Conductor Sin Nombre'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                                                        <Building2 size={14} /> {displayCompany}
                                                    </div>
                                                </td>
                                                <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> {d.phone || 'No registrado'}</div></td>
                                                <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>{d.age ? `${d.age} años` : 'N/A'}</div></td>
                                                <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CreditCard size={14} /> {d.license || d.licenseNumber || 'Pendiente'}</div></td>
                                                <td onClick={(e) => { e.stopPropagation(); handleOpenAssignModal(d); }}>
                                                    <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <Truck size={14} />
                                                        {assignedVehicleNames.length > 0 ? assignedVehicleNames.join(', ') : 'Asignar'}
                                                    </button>
                                                </td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleOpenModal('edit', d)}><Edit size={16} /></button>
                                                        <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(d.id)}><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={8} style={{ padding: '1.5rem', background: 'var(--secondary-bg)' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                                            <div className="card" style={{ padding: '1rem' }}>
                                                                <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Contacto / Empresa</h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                                                                    <div><strong>Email:</strong> {d.email || 'N/A'}</div>
                                                                    <div><strong>Teléfono:</strong> {d.phone || 'N/A'}</div>
                                                                    <div><strong>Edad:</strong> {d.age || 'N/A'} años</div>
                                                                    <div><strong>Sueldo Diario:</strong> {d.dailySalary ? formatCurrency(d.dailySalary) : 'No definido'}</div>
                                                                    <div><strong>Empresa:</strong> {displayCompany}</div>
                                                                </div>
                                                            </div>
                                                            <div className="card" style={{ padding: '1rem' }}>
                                                                <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Documentación</h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                                                                    <div><strong>Licencia:</strong> {d.licenseNumber || d.license || 'Pendiente'}</div>
                                                                    <div><strong>Vigencia:</strong> 12/2026</div>
                                                                    <div><strong>Estado:</strong> <span className="badge badge-success">Activo</span></div>
                                                                </div>
                                                            </div>
                                                            <div className="card" style={{ padding: '1rem' }}>
                                                                <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Historial</h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                                                                    <div><strong>Vehículos:</strong> {assignedVehicleNames.join(', ') || 'Ninguno'}</div>
                                                                    <div><strong>Viajes:</strong> {Math.floor(Math.random() * 50) + 10}</div>
                                                                    <div><strong>Calificación:</strong> ⭐ 4.90</div>
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
                                        <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>No se encontraron conductores.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            )}

            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Asignar Vehículos" maxWidth="900px">
                <div className="space-y-6">
                    <p style={{ fontSize: '0.95rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                        Selecciona las unidades para el conductor: <strong style={{ color: 'var(--primary)' }}>{assignTarget?.name || 'Conductor'}</strong>
                    </p>

                    <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }} className="space-y-8">
                        {Object.entries(vehiclesByCompany).map(([company, companyVehicles]: [string, any]) => (
                            <section key={company} className="space-y-3">
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', background: 'var(--secondary-bg)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                                    <Building2 size={18} /> {company}
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                    {companyVehicles.map((v: any) => (
                                        <label
                                            key={v.id}
                                            className="card"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '1rem',
                                                cursor: 'pointer',
                                                border: tempVehicleIds.includes(v.id) ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                background: tempVehicleIds.includes(v.id) ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--card-bg)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={tempVehicleIds.includes(v.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setTempVehicleIds([...tempVehicleIds, v.id]);
                                                    else setTempVehicleIds(tempVehicleIds.filter(id => id !== v.id));
                                                }}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{v.displayName}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Truck size={12} /> {v.plate || 'S/P'}
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
                title={`${modalMode === 'create' ? 'Agregar' : 'Editar'} Conductor`}
            >
                <form
                    key={currentItem?.id || 'new'}
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (isSubmitting) return; // Prevent double submission

                        setIsSubmitting(true);
                        try {
                            const formData = new FormData(e.currentTarget);
                            const payload: any = {};

                            // Basic fields
                            payload.name = formData.get('name');
                            payload.email = formData.get('email');
                            payload.phone = formData.get('phone');
                            payload.license = formData.get('license') || ''; // Ensure license is always included
                            payload.company = formData.get('company');

                            // Optional numeric fields
                            const age = formData.get('age');
                            if (age) payload.age = Number(age);

                            const dailySalary = formData.get('dailySalary');
                            if (dailySalary) payload.dailySalary = Number(dailySalary);

                            // License expiry date
                            const licenseExpiry = formData.get('licenseExpiry');
                            if (licenseExpiry) {
                                // Convert to Firestore Timestamp format
                                payload.licenseExpiry = new Date(licenseExpiry as string).toISOString();
                            }

                            // Photo URL (if provided)
                            const photoUrl = formData.get('photoUrl');
                            if (photoUrl) payload.photoUrl = photoUrl;

                            if (modalMode === 'create') {
                                payload.createdBy = user?.uid;
                                payload.status = 'available';
                                payload.rating = 0;
                                payload.totalTrips = 0;
                                payload.earnings = 0;
                            }

                            const endpoint = modalMode === 'create' ? '/api/drivers' : `/api/drivers/${currentItem.id}`;
                            const method = modalMode === 'create' ? 'POST' : 'PUT';

                            const res = await authenticatedFetch(endpoint, {
                                method,
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                            });

                            if (res.ok) {
                                setIsModalOpen(false);
                                fetchData();
                            } else {
                                const error = await res.json().catch(() => ({}));
                                alert(`Error al guardar conductor: ${error.message || 'Error desconocido'}`);
                            }
                        } catch (error) {
                            console.error('Error:', error);
                            alert('Error al conectar con el servidor');
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Nombre Completo</label>
                            <input name="name" type="text" className="input" defaultValue={currentItem?.name} required placeholder="Nombre del conductor" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Empresa / Aliado</label>
                            <select name="company" className="input" defaultValue={currentItem?.company || 'JFC Cargo Central'}>
                                {PARTNER_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Email</label>
                            <input name="email" type="email" className="input" defaultValue={currentItem?.email} placeholder="conductor@ejemplo.com" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Teléfono</label>
                            <input name="phone" type="text" className="input" defaultValue={currentItem?.phone} required placeholder="+52 55 ..." />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Edad</label>
                            <input name="age" type="number" className="input" defaultValue={currentItem?.age} placeholder="Ej. 35" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Sueldo Diario ($)</label>
                            <input name="dailySalary" type="number" className="input" defaultValue={currentItem?.dailySalary} placeholder="Ej. 800" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Número de Licencia</label>
                            <input name="license" type="text" className="input" defaultValue={currentItem?.license || currentItem?.licenseNumber} required placeholder="ABC-123456" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Vencimiento Licencia</label>
                            <input
                                name="licenseExpiry"
                                type="date"
                                className="input"
                                defaultValue={currentItem?.licenseExpiry ? new Date(currentItem.licenseExpiry.toDate ? currentItem.licenseExpiry.toDate() : currentItem.licenseExpiry).toISOString().split('T')[0] : ''}
                                required
                            />
                        </div>
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Foto del Conductor (URL)</label>
                            <input
                                name="photoUrl"
                                type="url"
                                className="input"
                                defaultValue={currentItem?.photoUrl}
                                placeholder="https://ejemplo.com/foto.jpg"
                            />
                            {currentItem?.photoUrl && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--border)' }}>
                                        <img src={currentItem.photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Vista previa de la foto actual</p>
                                </div>
                            )}
                            <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                                Ingresa la URL de la foto del conductor
                            </p>
                        </div>
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                            style={{ flex: 1 }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner size="sm" /> Guardando...
                                </>
                            ) : (
                                'Guardar'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
