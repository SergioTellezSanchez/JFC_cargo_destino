'use client';

import React, { useState, useEffect } from 'react';
import { Package as PackageIcon, Plus, Edit, Trash2, Search, Filter, ChevronDown, ChevronUp, FileText, Truck, MapPin, Box, Calendar, DollarSign } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { useUser } from '@/lib/UserContext';
import { authenticatedFetch } from '@/lib/api';
import { generateShippingGuide } from '@/lib/pdfGenerator';
import { formatCurrency } from '@/lib/utils';
import Modal from '@/components/Modal';

// Status styling helper
const getStatusColor = (status: string) => {
    switch (status) {
        case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
        case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'PICKED_UP': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getStatusLabel = (status: string) => {
    const map: any = {
        'PENDING': 'Pendiente',
        'ASSIGNED': 'Asignado',
        'PICKED_UP': 'Recolectado',
        'IN_TRANSIT': 'En Tránsito',
        'DELIVERED': 'Entregado',
        'CANCELLED': 'Cancelado'
    };
    return map[status] || status;
};

export default function CustomerPackageList() {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const { user, loading: authLoading } = useUser();

    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Modal state for Creating/Editing package (Customer side only allows editing details)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentItem, setCurrentItem] = useState<any>(null);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await authenticatedFetch('/api/packages');
            if (res.ok) {
                let data = await res.json();
                // Server might return all, so filter just in case, though API should handle it ideally.
                // Assuming current API returns all, we filter client side as seen in PackageManagement
                data = data.filter((p: any) => p.createdBy === user.uid);
                setPackages(data);
            }
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) fetchData();
        else if (!authLoading) setLoading(false);
    }, [authLoading, user]);

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

    const filteredPackages = packages.filter(p => {
        const idMatch = p.trackingId?.toLowerCase().includes(searchTerm.toLowerCase());
        const nameMatch = p.recipientName?.toLowerCase().includes(searchTerm.toLowerCase());
        return idMatch || nameMatch;
    });

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar mis envíos..."
                            className="input"
                            style={{ paddingLeft: '2.5rem', margin: 0, width: '100%' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenModal('create')}>
                        <Plus size={18} /> Nuevo Envío
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando tus envíos...</div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tracking ID</th>
                                    <th>Destinatario</th>
                                    <th>Estado</th>
                                    <th>Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPackages.length > 0 ? filteredPackages.map((pkg) => {
                                    const status = pkg.status || pkg.deliveries?.[0]?.status || 'PENDING';
                                    const isExpanded = expandedRow === pkg.id;

                                    // Assignment Info (Read Only)
                                    const delivery = pkg.deliveries?.[0];
                                    const assignedVehicle = delivery?.vehicle || pkg.assignedVehicle;
                                    const assignedDriver = delivery?.driver || pkg.assignedDriver;
                                    const logisticsCompany = pkg.logisticsCompany;

                                    return (
                                        <React.Fragment key={pkg.id}>
                                            <tr
                                                style={{ cursor: 'pointer', background: isExpanded ? 'var(--secondary-bg)' : 'transparent' }}
                                                onClick={() => toggleRow(pkg.id)}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td style={{ fontWeight: 'bold' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <PackageIcon size={16} className="text-[var(--primary)]" />
                                                        {pkg.trackingId}
                                                    </div>
                                                </td>
                                                <td>{pkg.recipientName}</td>
                                                <td>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                                                        {getStatusLabel(status)}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: '600' }}>
                                                    {pkg.price || pkg.cost ? formatCurrency(pkg.price || pkg.cost) : '-'}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={4} style={{ background: 'var(--secondary-bg)', padding: '0 2rem 2rem 2rem' }}>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                                                            {/* Origin / Destination */}
                                                            <div className="card p-4 border border-[var(--border)] shadow-sm">
                                                                <h4 className="text-sm font-bold text-[var(--secondary)] mb-3 flex items-center gap-2">
                                                                    <MapPin size={16} /> Ruta
                                                                </h4>
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <div className="text-xs text-[var(--secondary)] uppercase tracking-wider">Origen</div>
                                                                        <div className="font-medium text-sm">{pkg.origin}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs text-[var(--secondary)] uppercase tracking-wider">Destino</div>
                                                                        <div className="font-medium text-sm">{pkg.address || pkg.destination}</div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Package Details */}
                                                            <div className="card p-4 border border-[var(--border)] shadow-sm">
                                                                <h4 className="text-sm font-bold text-[var(--secondary)] mb-3 flex items-center gap-2">
                                                                    <Box size={16} /> Detalles de Carga
                                                                </h4>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <div className="text-xs text-[var(--secondary)]">Peso</div>
                                                                        <div className="font-medium">{pkg.weight} kg</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs text-[var(--secondary)]">Dimensiones</div>
                                                                        <div className="font-medium">{pkg.dimensions || 'N/A'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs text-[var(--secondary)]">Tipo</div>
                                                                        <div className="font-medium capitalize">{pkg.loadType || 'Paquete'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs text-[var(--secondary)]">Servicio</div>
                                                                        <div className="font-medium capitalize">{pkg.serviceLevel || 'Estándar'}</div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Assignment Info - READ ONLY */}
                                                            <div className="card p-4 border border-[var(--border)] shadow-sm">
                                                                <h4 className="text-sm font-bold text-[var(--secondary)] mb-3 flex items-center gap-2">
                                                                    <Truck size={16} /> Estado de Logística
                                                                </h4>

                                                                {logisticsCompany ? (
                                                                    <div className="space-y-3">
                                                                        <div className="bg-blue-50 text-blue-800 p-2 rounded text-xs font-bold text-center">
                                                                            ASIGNADO
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-xs text-[var(--secondary)]">Empresa Logística</div>
                                                                            <div className="font-medium text-sm">{logisticsCompany}</div>
                                                                        </div>
                                                                        {assignedVehicle && (
                                                                            <div>
                                                                                <div className="text-xs text-[var(--secondary)]">Vehículo</div>
                                                                                <div className="font-medium text-sm">{assignedVehicle.name} ({assignedVehicle.plate})</div>
                                                                            </div>
                                                                        )}
                                                                        {assignedDriver && (
                                                                            <div>
                                                                                <div className="text-xs text-[var(--secondary)]">Conductor</div>
                                                                                <div className="font-medium text-sm">{assignedDriver.name}</div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center h-full text-[var(--secondary)] py-4">
                                                                        <div className="bg-yellow-50 text-yellow-800 p-2 rounded text-xs font-bold mb-2">
                                                                            PENDIENTE DE ASIGNACIÓN
                                                                        </div>
                                                                        <div className="text-xs text-center">
                                                                            Un operador logístico validará tu envío pronto.
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Actions Card */}
                                                            <div className="card p-4 border border-[var(--border)] shadow-sm flex flex-col justify-between">
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-[var(--secondary)] mb-3 flex items-center gap-2">
                                                                        <FileText size={16} /> Gestión
                                                                    </h4>
                                                                    <p className="text-xs text-[var(--secondary)] mb-4">
                                                                        Administra los documentos y detalles de este envío.
                                                                    </p>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <button
                                                                        className="btn btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                                                                        onClick={(e) => { e.stopPropagation(); generateShippingGuide(pkg); }}
                                                                    >
                                                                        <FileText size={16} /> Descargar Guía
                                                                    </button>

                                                                    {status === 'PENDING' && (
                                                                        <>
                                                                            <button
                                                                                className="btn btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                                                                                onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', pkg); }}
                                                                            >
                                                                                <Edit size={16} /> Editar Detalles
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-danger w-full flex items-center justify-center gap-2 text-sm"
                                                                                onClick={(e) => { e.stopPropagation(); handleDelete(pkg.id); }}
                                                                            >
                                                                                <Trash2 size={16} /> Cancelar Envío
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Description / Instructions if exists */}
                                                        {(pkg.description || pkg.instructions) && (
                                                            <div className="mt-4 p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg">
                                                                <div className="text-xs text-[var(--secondary)] font-bold mb-1">NOTAS / INSTRUCCIONES</div>
                                                                <p className="text-sm text-[var(--foreground)] opacity-80">{pkg.description || pkg.instructions}</p>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                }) : (
                                    <tr><td colSpan={4} className="text-center py-8 text-[var(--secondary)]">No tienes envíos registrados aún.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Simplified Modal for Customers - No Status, No Logistics Assignment */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Crear Nuevo Envío" : "Editar Envío"}>
                <form key={currentItem?.id || 'new'} onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const payload: any = Object.fromEntries(formData.entries());
                    payload.weight = Number(payload.weight);
                    payload.declaredValue = Number(payload.declaredValue || 0);
                    // Customer might edit details but price usually is recalculated or fixed. For now allow simple edit.

                    try {
                        const endpoint = modalMode === 'create' ? '/api/packages' : `/api/packages/${currentItem.id}`;
                        const method = modalMode === 'create' ? 'POST' : 'PUT';
                        if (modalMode === 'create') payload.userId = user?.uid;

                        const res = await authenticatedFetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                        if (res.ok) { setIsModalOpen(false); fetchData(); }
                    } catch (err) { console.error(err); }
                }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="input-group col-span-2">
                            <label>Tracking ID (Auto-generado si vacío)</label>
                            <input name="trackingId" className="input bg-gray-50" defaultValue={currentItem?.trackingId} placeholder="Generar Automático" readOnly={modalMode === 'edit'} />
                        </div>

                        <div className="input-group"><label>Destinatario</label><input name="recipientName" className="input" defaultValue={currentItem?.recipientName} required /></div>
                        <div className="input-group"><label>Teléfono Receptor</label><input name="receiverPhone" className="input" defaultValue={currentItem?.receiverPhone || currentItem?.recipientPhone} /></div>

                        <div className="input-group col-span-2"><label>Dirección Origen</label><input name="origin" className="input" defaultValue={currentItem?.origin} required /></div>
                        <div className="input-group col-span-2"><label>Dirección Destino</label><input name="address" className="input" defaultValue={currentItem?.address || currentItem?.destination} required /></div>

                        <div className="input-group"><label>Peso (kg)</label><input name="weight" type="number" className="input" defaultValue={currentItem?.weight} required /></div>
                        <div className="input-group"><label>Dimensiones (LxWxH)</label><input name="dimensions" className="input" defaultValue={currentItem?.dimensions} placeholder="10x10x10" /></div>

                        <div className="input-group">
                            <label>Tipo de Carga</label>
                            <select name="loadType" className="input" defaultValue={currentItem?.loadType}>
                                <option value="package">Paquetería</option>
                                <option value="full-truck">Camión Completo</option>
                                <option value="van">Camioneta</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Nivel de Servicio</label>
                            <select name="serviceLevel" className="input" defaultValue={currentItem?.serviceLevel}>
                                <option value="standard">Estándar</option>
                                <option value="express">Express</option>
                            </select>
                        </div>

                        <div className="input-group col-span-2"><label>Descripción / Instrucciones</label><textarea name="description" className="input h-20" defaultValue={currentItem?.description || currentItem?.instructions}></textarea></div>
                    </div>
                    <div className="mt-6 flex gap-4">
                        <button type="button" className="btn btn-secondary flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary flex-1">Guardar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
