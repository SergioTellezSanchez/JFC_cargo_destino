'use client';

import React, { useState, useEffect } from 'react';
import { Warehouse, Plus, Edit, Trash2, Search, MapPin, ChevronDown, ChevronUp, Box, Users as UsersIcon, Info, Layers } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { useUser } from '@/lib/UserContext';
import { authenticatedFetch } from '@/lib/api';
import Modal from '@/components/Modal';

interface WarehouseManagementProps {
    isAdminView?: boolean;
}

export default function WarehouseManagement({ isAdminView = false }: WarehouseManagementProps) {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const { user, isAdmin, loading: authLoading } = useUser();

    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentItem, setCurrentItem] = useState<any>(null);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await authenticatedFetch('/api/storage');
            if (res.ok) {
                let data = await res.json();
                if (!isAdmin && !isAdminView) {
                    data = data.filter((w: any) => w.createdBy === user?.uid);
                }
                setWarehouses(data);
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
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
            const res = await authenticatedFetch(`/api/storage/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert(t('completed'));
                fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const filteredWarehouses = warehouses.filter(w => {
        const nameMatch = (w.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const locationMatch = (w.location || '').toLowerCase().includes(searchTerm.toLowerCase());
        const addressMatch = (w.address || '').toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || locationMatch || addressMatch;
    });

    return (
        <div className="space-y-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ubicación..."
                        className="input"
                        style={{ paddingLeft: '2.5rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal('create')}>
                    <Plus size={18} /> Agregar Almacén
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando almacenes...</div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre / Ubicación</th>
                                <th>Capacidad (kg)</th>
                                <th>Capacidad (m³)</th>
                                <th>Uso</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWarehouses.length > 0 ? filteredWarehouses.map((w: any) => {
                                const capacity = Number(w.capacity) || 50000;
                                const volCapacity = Number(w.volumetricCapacity) || Math.round(capacity / 500);
                                const currentLoad = Number(w.currentLoad) || 0;
                                const usagePercent = Math.min(Math.round((currentLoad / capacity) * 100), 100);
                                const isExpanded = expandedRow === w.id;

                                return (
                                    <React.Fragment key={w.id}>
                                        <tr
                                            style={{
                                                background: isExpanded ? 'var(--secondary-bg)' : 'transparent',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onClick={() => setExpandedRow(isExpanded ? null : w.id)}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--secondary-bg)'}
                                            onMouseLeave={(e) => {
                                                if (!isExpanded) e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <td style={{ fontWeight: '600' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {isExpanded ? <ChevronUp size={16} color="var(--primary)" /> : <ChevronDown size={16} color="var(--secondary)" />}
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span>{w.name || w.location}</span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 'normal' }}>
                                                            <MapPin size={10} style={{ display: 'inline', marginRight: '2px' }} /> {w.address || w.location}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: '600' }}>{capacity.toLocaleString()} kg</td>
                                            <td style={{ fontWeight: '600', color: 'var(--secondary)' }}>{volCapacity.toLocaleString()} m³</td>
                                            <td>
                                                <div style={{ width: '100px', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                                                    <div style={{ width: `${usagePercent}%`, height: '100%', background: usagePercent > 90 ? 'var(--error)' : 'var(--success)' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>{usagePercent}%</span>
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleOpenModal('edit', w)}><Edit size={16} /></button>
                                                    <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(w.id)}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '1.5rem', background: 'var(--secondary-bg)' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                                        <div className="card" style={{ padding: '1rem' }}>
                                                            <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Infraestructura</h4>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                                                                <div><strong>Superficie Estiba:</strong> {volCapacity / 5} m² (est. 5m altura)</div>
                                                                <div><strong>Altura Libre:</strong> {w.height || '12'}m</div>
                                                                <div><strong>Andenes:</strong> {w.docks || Math.floor(capacity / 20000) + 2}</div>
                                                            </div>
                                                        </div>
                                                        <div className="card" style={{ padding: '1rem' }}>
                                                            <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Capacidad Detallada</h4>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <Box size={14} className="text-secondary" /> {volCapacity.toLocaleString()} m³ de almacenamiento
                                                                </div>
                                                                <div><strong>Carga Útil:</strong> {capacity.toLocaleString()} kg</div>
                                                            </div>
                                                        </div>
                                                        <div className="card" style={{ padding: '1rem' }}>
                                                            <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Operación</h4>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                                                                <div><strong>Turnos:</strong> 24 Horas</div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <UsersIcon size={14} /> {w.staff || Math.floor(capacity / 5000) + 5} operarios
                                                                </div>
                                                                <div><strong>Certificación:</strong> {w.certification || 'OEA / CTPAT'}</div>
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
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>
                                        No se encontraron almacenes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${modalMode === 'create' ? 'Agregar' : 'Editar'} Almacén`}
            >
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const payload: any = Object.fromEntries(formData.entries());
                    payload.capacity = Number(payload.capacity);
                    payload.volumetricCapacity = Number(payload.volumetricCapacity);
                    payload.height = Number(payload.height);
                    payload.docks = Number(payload.docks);
                    payload.staff = Number(payload.staff);

                    try {
                        const endpoint = modalMode === 'create' ? '/api/storage' : `/api/storage/${currentItem.id}`;
                        const method = modalMode === 'create' ? 'POST' : 'PUT';

                        if (modalMode === 'create') {
                            payload.createdBy = user?.uid;
                        }

                        const res = await authenticatedFetch(endpoint, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                        });

                        if (res.ok) {
                            setIsModalOpen(false);
                            fetchData();
                        } else {
                            alert('Error al guardar');
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Nombre del Almacén</label>
                            <input name="name" type="text" className="input" defaultValue={currentItem?.name} required placeholder="Almacén Norte, CEDIS..." />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Ubicación / Ciudad</label>
                            <input name="location" type="text" className="input" defaultValue={currentItem?.location} required placeholder="CDMX, Querétaro..." />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Dirección Completa</label>
                            <input name="address" type="text" className="input" defaultValue={currentItem?.address} placeholder="Calle, Número, Col..." />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Capacidad de Carga (kg)</label>
                            <input name="capacity" type="number" className="input" defaultValue={currentItem?.capacity} required placeholder="50000" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Capacidad Volumétrica (m³)</label>
                            <input name="volumetricCapacity" type="number" className="input" defaultValue={currentItem?.volumetricCapacity} required placeholder="100" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Altura Libre (m)</label>
                            <input name="height" type="number" className="input" defaultValue={currentItem?.height || 12} placeholder="12" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Número de Andenes</label>
                            <input name="docks" type="number" className="input" defaultValue={currentItem?.docks || 4} placeholder="4" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Personal Operativo</label>
                            <input name="staff" type="number" className="input" defaultValue={currentItem?.staff || 10} placeholder="10" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Certificaciones</label>
                            <input name="certification" type="text" className="input" defaultValue={currentItem?.certification || 'OEA / CTPAT'} placeholder="OEA, CTPAT..." />
                        </div>
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{modalMode === 'create' ? 'Crear' : 'Guardar'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
