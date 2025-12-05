
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MapPin, Truck, ChevronDown, ChevronUp, Save, DollarSign, Package as PackageIcon, Users, Warehouse, Plus, Edit, Trash2, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/UserContext';
import WorldClock from '@/components/WorldClock';
import Modal from '@/components/Modal';

function AdminContent() {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const { user, isAdmin } = useUser();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('packages');
    const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all');

    const [packages, setPackages] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [itemType, setItemType] = useState<'package' | 'vehicle' | 'driver' | 'warehouse'>('package');

    // Edit state for assignment
    const [assignmentState, setAssignmentState] = useState<{
        driverId: string;
        vehicleId: string;
    }>({ driverId: '', vehicleId: '' });

    useEffect(() => {
        const tab = searchParams.get('tab');
        const modal = searchParams.get('modal');
        const filter = searchParams.get('filter');

        if (tab && ['packages', 'vehicles', 'drivers', 'warehouses'].includes(tab)) {
            setActiveTab(tab);
            if (modal === 'create') {
                setTimeout(() => openModal(tab as any, 'create'), 100);
            }
        }

        if (filter === 'mine') {
            setFilterMode('mine');
        } else {
            setFilterMode('all');
        }

        fetchData();
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [packagesRes, driversRes, vehiclesRes, warehousesRes] = await Promise.all([
                fetch('/api/packages'),
                fetch('/api/drivers'),
                fetch('/api/vehicles'),
                fetch('/api/storage')
            ]);

            if (packagesRes.ok) setPackages(await packagesRes.json());
            if (driversRes.ok) setDrivers(await driversRes.json());
            if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
            if (warehousesRes.ok) setWarehouses(await warehousesRes.json());

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredData = (data: any[]) => {
        if (filterMode === 'mine' && user) {
            return data.filter(item => item.createdBy === user.uid);
        }
        return data;
    };

    const toggleRow = (pkgId: string, currentDriverId: string, currentVehicleId: string = '') => {
        if (expandedRow === pkgId) {
            setExpandedRow(null);
        } else {
            setExpandedRow(pkgId);
            setAssignmentState({
                driverId: currentDriverId || '',
                vehicleId: currentVehicleId || ''
            });
        }
    };

    const handleSaveAssignment = async (pkgId: string) => {
        if (assignmentState.driverId && assignmentState.vehicleId) {
            try {
                const response = await fetch(`/api/packages/${pkgId}/assign`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        driverId: assignmentState.driverId,
                        vehicleId: assignmentState.vehicleId
                    }),
                });
                if (response.ok) {
                    fetchData();
                    setExpandedRow(null);
                    alert('Asignación guardada correctamente');
                } else {
                    alert('Error al guardar la asignación');
                }
            } catch (error) {
                console.error('Error assigning resources:', error);
                alert('Error de conexión');
            }
        } else {
            alert('Por favor selecciona conductor y vehículo');
        }
    };

    const openModal = (type: 'package' | 'vehicle' | 'driver' | 'warehouse', mode: 'create' | 'edit', item: any = null) => {
        setItemType(type);
        setModalMode(mode);
        setCurrentItem(item || {});
        setIsModalOpen(true);
    };

    const handleDelete = async (type: string, id: string) => {
        if (!confirm(t('delete') + '?')) return;

        try {
            const endpoint = `/api/${type === 'warehouse' ? 'storage' : type + 's'}/${id}`;
            const response = await fetch(endpoint, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert(t('delete') + ' ' + t('completed'));
                fetchData();
            } else {
                alert(t('failed'));
            }
        } catch (error) {
            console.error(error);
            alert(t('failed'));
        }
    };

    const canEdit = (item: any) => {
        if (isAdmin) return true;
        return item.createdBy === user?.uid;
    };

    // Calculations (Mock)
    const calculateCosts = (pkg: any, vehicleId: string) => {
        const vehicle = vehicles.find((v: any) => v.id === vehicleId);
        const weight = pkg.weight || 10;
        const declaredValue = pkg.declaredValue || 1000;

        const shippingCost = weight * 15;
        const insurance = declaredValue * 0.02;
        const totalCost = shippingCost + insurance;
        const priceToClient = totalCost * 1.4;
        const utility = priceToClient - totalCost;
        const utilityPercent = (utility / priceToClient) * 100;

        const vehicleCapacity = vehicle ? vehicle.capacity : 1000;
        const currentLoad = vehicle ? vehicle.currentLoad : 0;
        const newLoad = currentLoad + weight;
        const loadPercent = (newLoad / vehicleCapacity) * 100;

        return { shippingCost, insurance, totalCost, priceToClient, utility, utilityPercent, loadPercent };
    };

    if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Cargando datos...</div>;

    return (
        <div className="container">
            <WorldClock />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{t('adminDashboard')}</h1>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                    {[
                        { id: 'packages', label: t('packages'), icon: <PackageIcon size={18} /> },
                        { id: 'vehicles', label: t('vehicles'), icon: <Truck size={18} /> },
                        { id: 'drivers', label: t('drivers'), icon: <Users size={18} /> },
                        { id: 'warehouses', label: t('warehouses'), icon: <Warehouse size={18} /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                router.push(`/admin?tab=${tab.id}`, { scroll: false });
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.25rem',
                                border: 'none',
                                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--secondary)',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.id ? '600' : '400',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Filter Toggle */}
                    <div style={{ display: 'flex', background: 'var(--card-bg)', borderRadius: '0.5rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <button
                            onClick={() => setFilterMode('all')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                background: filterMode === 'all' ? 'var(--secondary-bg)' : 'transparent',
                                color: filterMode === 'all' ? 'var(--foreground)' : 'var(--secondary)',
                                cursor: 'pointer',
                                fontWeight: filterMode === 'all' ? '600' : '400'
                            }}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilterMode('mine')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                background: filterMode === 'mine' ? 'var(--secondary-bg)' : 'transparent',
                                color: filterMode === 'mine' ? 'var(--foreground)' : 'var(--secondary)',
                                cursor: 'pointer',
                                fontWeight: filterMode === 'mine' ? '600' : '400'
                            }}
                        >
                            Mis Items
                        </button>
                    </div>

                    <button className="btn btn-primary" onClick={() => openModal(activeTab as any, 'create')}>
                        <Plus size={18} /> {t('create')} {activeTab === 'packages' ? 'Paquete' : activeTab === 'vehicles' ? 'Vehículo' : activeTab === 'drivers' ? 'Conductor' : 'Almacén'}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="card" style={{ overflowX: 'auto', minHeight: '400px' }}>
                {activeTab === 'packages' && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Destinatario</th>
                                <th>Estado</th>
                                <th>Conductor</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredData(packages).map((pkg: any) => {
                                const currentDelivery = pkg.deliveries?.[0];
                                const status = currentDelivery?.status || 'PENDING';
                                const driver = currentDelivery?.driver;
                                const isExpanded = expandedRow === pkg.id;
                                const costs = calculateCosts(pkg, assignmentState.vehicleId);

                                return (
                                    <>
                                        <tr key={pkg.id} style={{ background: isExpanded ? 'var(--secondary-bg)' : 'transparent' }}>
                                            <td style={{ fontWeight: 'bold' }}>{pkg.trackingId}</td>
                                            <td>{pkg.recipientName}</td>
                                            <td><span className={`badge badge-${status.toLowerCase()}`}>{t(status as any)}</span></td>
                                            <td>{driver?.name || <span style={{ color: 'var(--error)' }}>Sin Asignar</span>}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => toggleRow(pkg.id, driver?.id)}>
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                    {canEdit(pkg) && (
                                                        <>
                                                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openModal('package', 'edit', pkg)}>
                                                                <Edit size={16} />
                                                            </button>
                                                            <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete('package', pkg.id)}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '1.5rem', background: 'var(--secondary-bg)' }}>
                                                    <div className="responsive-grid" style={{ alignItems: 'flex-start' }}>
                                                        {/* Shipping Details */}
                                                        <div className="card responsive-card">
                                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <PackageIcon size={18} /> Detalles del Envío
                                                            </h3>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                                                                <div><span className="font-bold">Origen:</span> {pkg.origin || 'N/A'}</div>
                                                                <div><span className="font-bold">Destino:</span> {pkg.destination || pkg.address}</div>
                                                                <div className="border-t my-2"></div>
                                                                <div><span className="font-bold">Remitente:</span> {pkg.senderName || 'N/A'}</div>
                                                                <div><span className="font-bold">Tel:</span> {pkg.senderPhone || 'N/A'}</div>
                                                                <div className="border-t my-2"></div>
                                                                <div><span className="font-bold">Destinatario:</span> {pkg.recipientName}</div>
                                                                <div><span className="font-bold">Tel:</span> {pkg.receiverPhone || 'N/A'}</div>
                                                                <div className="border-t my-2"></div>
                                                                <div><span className="font-bold">Instrucciones:</span> {pkg.instructions || 'Ninguna'}</div>
                                                            </div>
                                                        </div>

                                                        {/* Resource Assignment */}
                                                        <div className="card responsive-card">
                                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <Truck size={18} /> Asignación de Recursos
                                                            </h3>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                                <div>
                                                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>Conductor</label>
                                                                    <select
                                                                        className="input"
                                                                        value={assignmentState.driverId}
                                                                        onChange={(e) => setAssignmentState(prev => ({ ...prev, driverId: e.target.value }))}
                                                                    >
                                                                        <option value="">Seleccionar Conductor...</option>
                                                                        {drivers.map((d: any) => (
                                                                            <option key={d.id} value={d.id}>{d.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>Vehículo</label>
                                                                    <select
                                                                        className="input"
                                                                        value={assignmentState.vehicleId}
                                                                        onChange={(e) => setAssignmentState(prev => ({ ...prev, vehicleId: e.target.value }))}
                                                                    >
                                                                        <option key="default-vehicle" value="">Seleccionar Vehículo...</option>
                                                                        {vehicles.map((v: any) => (
                                                                            <option key={v.id} value={v.id}>{v.name} - {v.plate}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => handleSaveAssignment(pkg.id)}>
                                                                    <Save size={18} /> Confirmar Asignación
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Financial Breakdown */}
                                                        <div className="card responsive-card">
                                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <DollarSign size={18} /> Desglose Financiero
                                                            </h3>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                                                                    <span style={{ color: 'var(--secondary)' }}>Costo Envío Base</span>
                                                                    <span>${costs.shippingCost.toFixed(2)}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                                                                    <span style={{ color: 'var(--secondary)' }}>Seguro (2%)</span>
                                                                    <span>${costs.insurance.toFixed(2)}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                                                                    <span style={{ fontWeight: 'bold' }}>Costo Total Operativo</span>
                                                                    <span style={{ fontWeight: 'bold' }}>${costs.totalCost.toFixed(2)}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                                                                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Utilidad Estimada</span>
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <div style={{ fontWeight: 'bold', color: 'var(--success)' }}>${costs.utility.toFixed(2)}</div>
                                                                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{costs.utilityPercent.toFixed(1)}% margen</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {activeTab === 'vehicles' && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Placa</th>
                                <th>Capacidad</th>
                                <th>Carga Actual</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredData(vehicles).map((v: any) => (
                                <tr key={v.id}>
                                    <td>{v.name}</td>
                                    <td>{v.plate}</td>
                                    <td>{v.capacity} kg</td>
                                    <td>{v.currentLoad} kg</td>
                                    <td>
                                        {canEdit(v) && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openModal('vehicle', 'edit', v)}><Edit size={16} /></button>
                                                <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete('vehicle', v.id)}><Trash2 size={16} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'drivers' && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Teléfono</th>
                                <th>Licencia</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredData(drivers).map((d: any) => (
                                <tr key={d.id}>
                                    <td>{d.name}</td>
                                    <td>{d.phone}</td>
                                    <td>{d.license || 'N/A'}</td>
                                    <td><span className="badge badge-success">Activo</span></td>
                                    <td>
                                        {canEdit(d) && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openModal('driver', 'edit', d)}><Edit size={16} /></button>
                                                <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete('driver', d.id)}><Trash2 size={16} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'warehouses' && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Ubicación</th>
                                <th>Capacidad</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredData(warehouses).map((w: any) => (
                                <tr key={w.id}>
                                    <td>{w.name}</td>
                                    <td>{w.location || 'N/A'}</td>
                                    <td>{w.capacity}</td>
                                    <td>
                                        {canEdit(w) && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openModal('warehouse', 'edit', w)}><Edit size={16} /></button>
                                                <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete('warehouse', w.id)}><Trash2 size={16} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>


            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${modalMode === 'create' ? t('create') : t('edit')} ${itemType === 'package' ? t('packages') : itemType === 'vehicle' ? t('vehicles') : itemType === 'driver' ? t('drivers') : t('warehouses')}`}
            >
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = Object.fromEntries(formData.entries());

                    try {
                        const endpoint = `/api/${itemType === 'warehouse' ? 'storage' : itemType + 's'}${modalMode === 'edit' ? `/${currentItem.id}` : ''}`;
                        const method = modalMode === 'create' ? 'POST' : 'PUT';

                        // Add createdBy if creating
                        if (modalMode === 'create' && user) {
                            // @ts-ignore
                            data.createdBy = user.uid;
                        }

                        const response = await fetch(endpoint, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data),
                        });

                        if (response.ok) {
                            alert(t('save') + ' ' + t('completed'));
                            setIsModalOpen(false);
                            fetchData();
                        } else {
                            alert(t('failed'));
                        }
                    } catch (error) {
                        console.error(error);
                        alert(t('failed'));
                    }
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {itemType === 'package' && (
                            <>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('trackingId')}</label>
                                    <input name="trackingId" type="text" className="input" defaultValue={currentItem?.trackingId} required />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('recipientName')}</label>
                                    <input name="recipientName" type="text" className="input" defaultValue={currentItem?.recipientName} required />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('address')}</label>
                                    <input name="address" type="text" className="input" defaultValue={currentItem?.address} required />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('weight')}</label>
                                    <input name="weight" type="number" className="input" defaultValue={currentItem?.weight} required />
                                </div>
                            </>
                        )}

                        {itemType === 'vehicle' && (
                            <>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('name')}</label>
                                    <input name="name" type="text" className="input" defaultValue={currentItem?.name} required />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('plate')}</label>
                                    <input name="plate" type="text" className="input" defaultValue={currentItem?.plate} required />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('capacity')} (kg)</label>
                                    <input name="capacity" type="number" className="input" defaultValue={currentItem?.capacity} required />
                                </div>
                            </>
                        )}

                        {itemType === 'driver' && (
                            <>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('name')}</label>
                                    <input name="name" type="text" className="input" defaultValue={currentItem?.name} required />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('phone')}</label>
                                    <input name="phone" type="text" className="input" defaultValue={currentItem?.phone} required />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('license')}</label>
                                    <input name="license" type="text" className="input" defaultValue={currentItem?.license} />
                                </div>
                            </>
                        )}

                        {itemType === 'warehouse' && (
                            <>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('name')}</label>
                                    <input name="name" type="text" className="input" defaultValue={currentItem?.name} required />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('location')}</label>
                                    <input name="location" type="text" className="input" defaultValue={currentItem?.location} required />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('capacity')}</label>
                                    <input name="capacity" type="number" className="input" defaultValue={currentItem?.capacity} required />
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
                            <button type="submit" className="btn btn-primary">{t('save')}</button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={<div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>}>
            <AdminContent />
        </Suspense>
    );
}
