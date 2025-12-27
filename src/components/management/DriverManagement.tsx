'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, Phone, CreditCard, Truck, ChevronDown, ChevronUp, Mail, Building2, CheckSquare, Square } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { useUser } from '@/lib/UserContext';
import { authenticatedFetch } from '@/lib/api';
import Modal from '@/components/Modal';

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

export default function DriverManagement({ isAdminView = false }: DriverManagementProps) {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const { user, isAdmin, loading: authLoading } = useUser();

    const [drivers, setDrivers] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentItem, setCurrentItem] = useState<any>(null);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState<any>(null);
    const [tempVehicleIds, setTempVehicleIds] = useState<string[]>([]);

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

    const filteredDrivers = drivers.filter(d =>
    (d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.company?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o empresa..."
                        className="input"
                        style={{ paddingLeft: '2.5rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th>Nombre</th>
                                <th>Empresa</th>
                                <th>Teléfono</th>
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
                                const assignedVehicleNames = vehicles.filter(v => assignedVehicleIds.includes(v.id)).map(v => v.name);
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
                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CreditCard size={14} /> {d.licenseNumber || d.license || 'Pendiente'}</div></td>
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
                                                <td colSpan={7} style={{ padding: '1.5rem', background: 'var(--secondary-bg)' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                                        <div className="card" style={{ padding: '1rem' }}>
                                                            <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Contacto / Empresa</h4>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                                                                <div><strong>Email:</strong> {d.email || 'N/A'}</div>
                                                                <div><strong>Teléfono:</strong> {d.phone || 'N/A'}</div>
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
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>No se encontraron conductores.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Asignar Vehículos">
                <div className="space-y-4">
                    <p style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>Selecciona los vehículos para <strong>{assignTarget?.name}</strong></p>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {vehicles.map(v => (
                            <label key={v.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={tempVehicleIds.includes(v.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) setTempVehicleIds([...tempVehicleIds, v.id]);
                                        else setTempVehicleIds(tempVehicleIds.filter(id => id !== v.id));
                                    }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 'bold' }}>{v.name}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{v.plate} - {v.company}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSaveAssignment}>Guardar Asignación</button>
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
                        const formData = new FormData(e.currentTarget);
                        const payload: any = Object.fromEntries(formData.entries());

                        try {
                            const endpoint = modalMode === 'create' ? '/api/drivers' : `/api/drivers/${currentItem.id}`;
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
                            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Número de Licencia</label>
                            <input name="license" type="text" className="input" defaultValue={currentItem?.license || currentItem?.licenseNumber} placeholder="ABC-123456" />
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
