'use client';

import React, { useState, useEffect } from 'react';
import { Warehouse, Plus, Edit, Trash2, Search, MapPin, ChevronDown, ChevronUp, Box, Users as UsersIcon, Info, Layers } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { useUser } from '@/lib/UserContext';
import { authenticatedFetch } from '@/lib/api';
import Modal from '@/components/Modal';
import { formatNumber } from '@/lib/utils';
import PlaceAutocomplete from '@/components/PlaceAutocomplete';
import PinSelectionModal from '@/components/PinSelectionModal';
import Spinner from '@/components/Spinner';
import { APIProvider } from '@vis.gl/react-google-maps';


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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Maps & Location State
    // Maps & Location State
    const [tempLocation, setTempLocation] = useState<{ address: string, lat: number, lng: number } | null>(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number, address: string } | null>(null);

    // Controlled address state for autofill
    const [addressForm, setAddressForm] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'México'
    });

    const handleAddressSelect = (location: any) => {
        setTempLocation(location);
        setShowPinModal(true);
        if (location.details) {
            setAddressForm({
                street: location.details.street || '',
                city: location.details.city || '',
                state: location.details.state || '',
                zipCode: location.details.zipCode || '',
                country: location.details.country || 'México'
            });
        }
    };

    const handlePinConfirm = (location: any) => {
        setSelectedLocation(location);
        setShowPinModal(false);
    };

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
        setAddressForm({
            street: item?.address?.street || '',
            city: item?.address?.city || '',
            state: item?.address?.state || '',
            zipCode: item?.address?.zipCode || '',
            country: item?.address?.country || 'México'
        });
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

        let locationString = '';
        if (typeof w.location === 'string') locationString = w.location;

        let addressString = '';
        if (typeof w.address === 'string') addressString = w.address;
        else if (w.address && typeof w.address === 'object') {
            addressString = `${w.address.street || ''} ${w.address.city || ''} ${w.address.state || ''} ${w.address.country || ''}`;
        }

        const locationMatch = locationString.toLowerCase().includes(searchTerm.toLowerCase());
        const addressMatch = addressString.toLowerCase().includes(searchTerm.toLowerCase());

        return nameMatch || locationMatch || addressMatch;
    });

    return (
        <div className="space-y-6">
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o ubicación..."
                            className="input"
                            style={{ paddingLeft: '2.5rem', margin: 0 }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenModal('create')}>
                        <Plus size={18} /> Agregar Almacén
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando almacenes...</div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-container">
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
                                    // Handle structured capacity object or legacy number
                                    const capacity = typeof w.capacity === 'object' ? (w.capacity?.weight || 50000) : (Number(w.capacity) || 50000);
                                    const volCapacity = typeof w.capacity === 'object' ? (w.capacity?.volume || Math.round(capacity / 500)) : (Number(w.volumetricCapacity) || Math.round(capacity / 500));
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
                                                            <span>{w.name || (typeof w.location === 'string' ? w.location : 'Almacén')}</span>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 'normal' }}>
                                                                <MapPin size={10} style={{ display: 'inline', marginRight: '2px' }} />
                                                                {typeof w.address === 'object'
                                                                    ? `${w.address.street || ''}${w.address.city ? ', ' + w.address.city : ''}`
                                                                    : (w.address || (typeof w.location === 'string' ? w.location : 'Ubicación GPS'))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: '600' }}>{formatNumber(capacity)} kg</td>
                                                <td style={{ fontWeight: '600', color: 'var(--secondary)' }}>{formatNumber(volCapacity)} m³</td>
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
                                                                        <Box size={14} className="text-secondary" /> {formatNumber(volCapacity)} m³ de almacenamiento
                                                                    </div>
                                                                    <div><strong>Carga Útil:</strong> {formatNumber(capacity)} kg</div>
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
                </div>

            )}

            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={`${modalMode === 'create' ? 'Agregar' : 'Editar'} Almacén`}
                >
                    {/* Map Pin Selection Modal */}
                    <PinSelectionModal
                        isOpen={showPinModal}
                        onClose={() => setShowPinModal(false)}
                        onConfirm={handlePinConfirm}
                        initialLocation={tempLocation}
                    />

                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (isSubmitting) return;

                        setIsSubmitting(true);
                        try {
                            const formData = new FormData(e.currentTarget);
                            const payload: any = {};

                            // Address
                            payload.address = {
                                street: formData.get('street'),
                                city: formData.get('city'),
                                state: formData.get('state'),
                                zipCode: formData.get('zipCode'),
                                country: formData.get('country') || 'México'
                            };

                            // GeoPoint handling
                            if (selectedLocation) {
                                payload.location = {
                                    latitude: selectedLocation.lat,
                                    longitude: selectedLocation.lng
                                };
                            } else if (currentItem?.location) {
                                payload.location = {
                                    latitude: currentItem.location.latitude || currentItem.location._lat,
                                    longitude: currentItem.location.longitude || currentItem.location._long
                                };
                            }

                            // Capacity
                            payload.capacity = {
                                weight: Number(formData.get('weight')),
                                volume: Number(formData.get('volume')),
                                pallets: Number(formData.get('pallets'))
                            };

                            // Operating Hours
                            payload.operatingHours = {
                                open: formData.get('openTime'),
                                close: formData.get('closeTime')
                            };

                            // Basic Fields
                            payload.name = formData.get('name');
                            payload.manager = formData.get('manager');
                            payload.status = formData.get('status') || 'active';

                            // Operational Fields
                            const clearanceHeight = formData.get('clearanceHeight');
                            if (clearanceHeight) payload.clearanceHeight = Number(clearanceHeight);

                            const staffCount = formData.get('staffCount');
                            if (staffCount) payload.staffCount = Number(staffCount);

                            const dockCount = formData.get('dockCount');
                            if (dockCount) payload.dockCount = Number(dockCount);

                            // Certifications
                            payload.certifications = formData.getAll('certifications') as string[];

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
                                setTempLocation(null);
                                setSelectedLocation(null);
                                fetchData();
                            } else {
                                const error = await res.json().catch(() => ({}));
                                alert(`Error al guardar almacén: ${error.message || 'Error desconocido'}`);
                            }
                        } catch (error) {
                            console.error(error);
                            alert('Error al conectar con el servidor');
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                            {/* Ubicación con Google Maps */}
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Ubicación</label>
                                <PlaceAutocomplete
                                    className="input"
                                    placeholder="Buscar dirección para ubicar en mapa..."
                                    onPlaceSelect={handleAddressSelect}
                                    defaultValue={currentItem?.address?.street || selectedLocation?.address}
                                />
                                {selectedLocation ? (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MapPin size={12} /> Ubicación seleccionada: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                    </p>
                                ) : currentItem?.location ? (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                                        Ubicación actual guardada
                                    </p>
                                ) : null}
                            </div>

                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Nombre del Almacén</label>
                                <input name="name" type="text" className="input" defaultValue={currentItem?.name} required placeholder="Almacén Norte, CEDIS..." />
                            </div>

                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Manager / Responsable</label>
                                <input name="manager" className="input" defaultValue={currentItem?.manager} required placeholder="Nombre del responsable" />
                            </div>

                            {/* Dirección Completa */}
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Calle</label>
                                <input
                                    name="street"
                                    className="input"
                                    value={addressForm.street}
                                    onChange={e => setAddressForm({ ...addressForm, street: e.target.value })}
                                    required
                                    placeholder="Av. Principal 123"
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Ciudad</label>
                                <input
                                    name="city"
                                    className="input"
                                    value={addressForm.city}
                                    onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                                    required
                                    placeholder="Ciudad"
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Estado</label>
                                <input
                                    name="state"
                                    className="input"
                                    value={addressForm.state}
                                    onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                                    required
                                    placeholder="Estado"
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Código Postal</label>
                                <input
                                    name="zipCode"
                                    className="input"
                                    value={addressForm.zipCode}
                                    onChange={e => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                                    required
                                    placeholder="00000"
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>País</label>
                                <input
                                    name="country"
                                    className="input"
                                    value={addressForm.country}
                                    onChange={e => setAddressForm({ ...addressForm, country: e.target.value })}
                                    required
                                    placeholder="México"
                                />
                            </div>

                            {/* Horarios */}
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Horario Apertura</label>
                                <input name="openTime" type="time" className="input" defaultValue={currentItem?.operatingHours?.open || '08:00'} required />
                            </div>
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Horario Cierre</label>
                                <input name="closeTime" type="time" className="input" defaultValue={currentItem?.operatingHours?.close || '18:00'} required />
                            </div>

                            {/* Capacidad */}
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Capacidad Peso (kg)</label>
                                <input name="weight" type="number" className="input" defaultValue={currentItem?.capacity?.weight} required placeholder="50000" />
                            </div>
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Capacidad Volumen (m³)</label>
                                <input name="volume" type="number" className="input" defaultValue={currentItem?.capacity?.volume} required placeholder="1000" />
                            </div>
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Capacidad Pallets</label>
                                <input name="pallets" type="number" className="input" defaultValue={currentItem?.capacity?.pallets} required placeholder="500" />
                            </div>

                            {/* Operational Fields */}
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Altura Libre (m)</label>
                                <input name="clearanceHeight" type="number" step="0.1" className="input" defaultValue={currentItem?.clearanceHeight} placeholder="12" />
                            </div>
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Número de Andenes</label>
                                <input name="dockCount" type="number" className="input" defaultValue={currentItem?.dockCount} placeholder="4" />
                            </div>
                            <div className="input-group">
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Personal Operativo</label>
                                <input name="staffCount" type="number" className="input" defaultValue={currentItem?.staffCount} placeholder="10" />
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Certificaciones</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginTop: '0.5rem', padding: '0.75rem', background: 'var(--card-bg)', borderRadius: '0.6rem', border: '1px solid var(--border)' }}>
                                    {['ISO 9001', 'HACCP', 'C-TPAT', 'FDA', 'FSMA', 'OEA'].map(cert => (
                                        <label key={cert} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                name="certifications"
                                                value={cert}
                                                defaultChecked={currentItem?.certifications?.includes(cert)}
                                            />
                                            {cert}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting || (modalMode === 'create' && !selectedLocation && !currentItem?.location)}
                                style={{ flex: 1 }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner size="sm" /> Guardando...
                                    </>
                                ) : (
                                    modalMode === 'create' ? 'Crear' : 'Guardar'
                                )}
                            </button>
                        </div>
                    </form>
                </Modal>
            </APIProvider>
        </div>
    );
}
