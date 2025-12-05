'use client';

import { useState, useEffect } from 'react';
import { MapPin, Truck, ChevronDown, ChevronUp, Save, DollarSign, Package as PackageIcon } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import WorldClock from '@/components/WorldClock';

export default function AdminDashboard() {
    const { language } = useLanguage();
    const t = useTranslation(language);

    const [packages, setPackages] = useState([]);
    const [drivers, setDrivers] = useState([]);

    interface Vehicle {
        id: string;
        name: string;
        plate: string;
        capacity: number;
        currentLoad: number;
    }

    const [vehicles, setVehicles] = useState<Vehicle[]>([]); // Mock vehicles for now if API not ready
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Edit state for expanded row
    const [editState, setEditState] = useState<{
        driverId: string;
        vehicleId: string;
    }>({ driverId: '', vehicleId: '' });

    useEffect(() => {
        fetchData();
        // Mock vehicles if API doesn't exist yet
        setVehicles([
            { id: 'v1', name: 'Nissan NP300', plate: 'JFC-001', capacity: 1000, currentLoad: 200 },
            { id: 'v2', name: 'Ford Transit', plate: 'JFC-002', capacity: 1500, currentLoad: 800 },
            { id: 'v3', name: 'Kenworth T680', plate: 'JFC-003', capacity: 20000, currentLoad: 15000 },
        ]);
    }, []);

    const fetchData = async () => {
        try {
            const [packagesRes, driversRes] = await Promise.all([
                fetch('/api/packages'),
                fetch('/api/drivers')
            ]);
            const packagesData = await packagesRes.json();
            const driversData = await driversRes.json();
            setPackages(packagesData);
            setDrivers(driversData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const toggleRow = (pkgId: string, currentDriverId: string, currentVehicleId: string = '') => {
        if (expandedRow === pkgId) {
            setExpandedRow(null);
        } else {
            setExpandedRow(pkgId);
            setEditState({
                driverId: currentDriverId || '',
                vehicleId: currentVehicleId || '' // Assuming we will add vehicleId to package/delivery later
            });
        }
    };

    const handleSaveAssignment = async (pkgId: string) => {
        if (editState.driverId && editState.vehicleId) {
            try {
                const response = await fetch(`/api/packages/${pkgId}/assign`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        driverId: editState.driverId,
                        vehicleId: editState.vehicleId
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

    // Calculations
    const calculateCosts = (pkg: any, vehicleId: string) => {
        const vehicle = vehicles.find((v: any) => v.id === vehicleId);
        const weight = pkg.weight || 10;
        const declaredValue = pkg.declaredValue || 1000;

        // Mock formulas
        const shippingCost = weight * 15; // Base cost
        const insurance = declaredValue * 0.02;
        const totalCost = shippingCost + insurance;
        const priceToClient = totalCost * 1.4; // 40% margin
        const utility = priceToClient - totalCost;
        const utilityPercent = (utility / priceToClient) * 100;

        const vehicleCapacity = vehicle ? vehicle.capacity : 1000;
        const currentLoad = vehicle ? vehicle.currentLoad : 0;
        const newLoad = currentLoad + weight;
        const loadPercent = (newLoad / vehicleCapacity) * 100;

        return {
            shippingCost,
            insurance,
            totalCost,
            priceToClient,
            utility,
            utilityPercent,
            loadPercent
        };
    };

    if (loading) return <div className="container">{t('loading')}</div>;

    return (
        <div className="container">
            <WorldClock />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{t('adminDashboard')}</h1>
                <div className="responsive-actions">
                    <button className="btn btn-primary">{t('createPackage')}</button>
                </div>
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>{t('trackingId')}</th>
                            <th>{t('recipient')}</th>
                            <th>{t('destination')}</th>
                            <th>{t('status')}</th>
                            <th>{t('assignedDriver')}</th>
                            <th>{t('action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packages.map((pkg: any) => {
                            const currentDelivery = pkg.deliveries?.[0];
                            const status = currentDelivery?.status || 'PENDING';
                            const driver = currentDelivery?.driver;
                            const isExpanded = expandedRow === pkg.id;

                            const costs = calculateCosts(pkg, editState.vehicleId);

                            return (
                                <>
                                    <tr key={pkg.id} style={{ background: isExpanded ? 'var(--secondary-bg)' : 'transparent' }}>
                                        <td style={{ fontWeight: 'bold' }}>{pkg.trackingId}</td>
                                        <td>{pkg.recipientName}</td>
                                        <td>{pkg.address}</td>
                                        <td><span className={`badge badge-${status.toLowerCase()}`}>{t(status as any)}</span></td>
                                        <td>{driver?.name || <span style={{ color: 'var(--error)' }}>Sin Asignar</span>}</td>
                                        <td>
                                            <button
                                                className="btn btn-secondary"
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>Conductor</label>
                                                    <select
                                                        className="input"
                                                        value={editState.driverId}
                                                        onChange={(e) => setEditState(prev => ({ ...prev, driverId: e.target.value }))}
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
                                                        value={editState.vehicleId}
                                                        onChange={(e) => setEditState(prev => ({ ...prev, vehicleId: e.target.value }))}
                                                    >
                                                        <option value="">Seleccionar Vehículo...</option>
                                                        {vehicles.map((v: any) => (
                                                            <option key={v.id} value={v.id}>{v.name} - {v.plate}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {editState.vehicleId && (
                                                    <div style={{ marginTop: '0.5rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                            <span>Carga Vehículo</span>
                                                            <span style={{ fontWeight: 'bold' }}>{costs.loadPercent.toFixed(1)}%</span>
                                                        </div>
                                                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${Math.min(costs.loadPercent, 100)}%`,
                                                                height: '100%',
                                                                background: costs.loadPercent > 90 ? 'var(--error)' : 'var(--success)'
                                                            }} />
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    className="btn btn-primary"
                                                    style={{ marginTop: '1rem' }}
                                                    onClick={() => handleSaveAssignment(pkg.id)}
                                                >
                                                    <Save size={18} /> Confirmar Asignación
                                                </button>
                                            </div>
                                        </div>

                                        {/* Financial Breakdown */}
                                        <div className="card">
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
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Precio al Cliente</span>
                                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>${costs.priceToClient.toFixed(2)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Utilidad Estimada</span>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontWeight: 'bold', color: 'var(--success)' }}>${costs.utility.toFixed(2)}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{costs.utilityPercent.toFixed(1)}% margen</div>
                                                    </div>
                                                </div >
                                            </div >
                                            );
}
