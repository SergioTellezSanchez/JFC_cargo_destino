'use client';

import { useState, Fragment } from 'react';
import { Order } from '@/lib/firebase/schemas/orders';
import { PricingSettings } from '@/lib/firebase/schemas/pricing';
import { Vehicle } from '@/lib/firebase/schemas/vehicles';
import { Driver } from '@/lib/firebase/schemas/users';

import { ChevronDown, ChevronUp, Truck, User as UserIcon, MapPin, Package, DollarSign, RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api';

interface OrderTableProps {
    orders: Order[];
    drivers: Driver[];
    vehicles: Vehicle[];
    settings: PricingSettings;
    carrierId: string;
    onRefresh?: () => void;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7' },
    ASSIGNED: { label: 'Asignado (JFC)', color: '#2563eb', bg: '#eff6ff' },
    ASSIGNED_CONFIRMED: { label: 'Confirmado', color: '#059669', bg: '#d1fae5' },
    PICKED_UP: { label: 'Recogido', color: '#7c3aed', bg: '#ede9fe' },
    IN_TRANSIT: { label: 'En Tránsito', color: '#0284c7', bg: '#e0f2fe' },
    DELIVERED: { label: 'Entregado', color: '#16a34a', bg: '#f0fdf4' },
    CANCELLED: { label: 'Cancelado', color: '#dc2626', bg: '#fef2f2' },
    // legacy lowercase
    assigned: { label: 'Asignado', color: '#2563eb', bg: '#eff6ff' },
    pending_assignment: { label: 'Pendiente Asig.', color: '#d97706', bg: '#fef3c7' },
};

export default function OrderTable({ orders, drivers, vehicles, settings, carrierId, onRefresh }: OrderTableProps) {
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    // Per-order assignment state
    const [assignments, setAssignments] = useState<Record<string, { driverId: string; vehicleId: string }>>({});

    const getAssignment = (order: Order) => assignments[order.id] ?? {
        driverId: order.driverId || '',
        vehicleId: order.vehicleId || '',
    };

    const setAssignment = (orderId: string, field: 'driverId' | 'vehicleId', value: string) => {
        setAssignments(prev => ({
            ...prev,
            [orderId]: { ...getAssignment({ id: orderId } as Order), [field]: value }
        }));
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(prev => prev === orderId ? null : orderId);
    };

    const handleAssign = async (order: Order) => {
        const { driverId, vehicleId } = getAssignment(order);
        if (!driverId || !vehicleId) {
            alert('Selecciona conductor y vehículo para continuar.');
            return;
        }

        const driver = drivers.find(d => d.id === driverId);
        const vehicle = vehicles.find(v => v.id === vehicleId);

        try {
            setSavingId(order.id);
            const res = await authenticatedFetch(`/api/packages/${order.id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driverId,
                    vehicleId,
                    driverName: driver?.name || '',
                    vehiclePlate: vehicle?.plates || '',
                    status: 'ASSIGNED_CONFIRMED',
                })
            });

            if (res.ok) {
                alert(`✓ Orden asignada correctamente a ${driver?.name || driverId}`);
                setExpandedOrderId(null);
                onRefresh?.();
            } else {
                const err = await res.json().catch(() => ({}));
                alert('Error al asignar: ' + (err.error || res.status));
            }
        } catch (error) {
            console.error(error);
            alert('Error de red al asignar orden');
        } finally {
            setSavingId(null);
        }
    };

    const findReturnTrips = (order: Order) => {
        alert(`Buscando viajes de regreso en un radio de ${settings.backhaulMatchRadiusKm || 50}km... (Próximamente)`);
    };

    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100">
            <table className="table w-full">
                <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <th className="font-bold">Folio</th>
                        <th className="font-bold">Ruta</th>
                        <th className="font-bold">Fecha</th>
                        <th className="font-bold">Estatus</th>
                        <th className="font-bold">Conductor / Vehículo</th>
                        <th className="font-bold text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => {
                        const isExpanded = expandedOrderId === order.id;
                        const statusMeta = STATUS_MAP[order.status || ''] || { label: order.status || 'Desconocido', color: '#64748b', bg: '#f1f5f9' };
                        const assignedDriver = drivers.find(d => d.id === order.driverId);
                        const assignedVehicle = vehicles.find(v => v.id === order.vehicleId);
                        const isConfirmed = order.status === 'assigned_confirmed' || order.status === 'in_transit' || order.status === 'delivered' || order.status === 'completed';

                        return (
                            <Fragment key={order.id}>
                                <tr
                                    className={`hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                                    onClick={() => toggleExpand(order.id)}
                                >
                                    <td className="font-mono font-bold text-indigo-600 text-sm">
                                        #{order.folio || order.id.slice(0, 8)}
                                    </td>
                                    <td className="max-w-[220px]">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                <span className="text-xs font-semibold text-slate-700 truncate">{order.origin?.address?.split(',')[0] || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                                <span className="text-xs font-semibold text-slate-700 truncate">{order.destination?.address?.split(',')[0] || '—'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                        {order.pickupDate?.toDate
                                            ? order.pickupDate.toDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                                            : '—'}
                                    </td>
                                    <td>
                                        <span style={{ background: statusMeta.bg, color: statusMeta.color, borderRadius: '9999px', padding: '0.15rem 0.7rem', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                            {statusMeta.label}
                                        </span>
                                    </td>
                                    <td>
                                        {assignedDriver || assignedVehicle ? (
                                            <div className="text-xs space-y-0.5">
                                                {assignedDriver && (
                                                    <div className="flex items-center gap-1 text-slate-700 font-semibold">
                                                        <UserIcon size={11} className="text-indigo-400" />
                                                        {assignedDriver.name}
                                                    </div>
                                                )}
                                                {assignedVehicle && (
                                                    <div className="flex items-center gap-1 text-slate-500">
                                                        <Truck size={11} className="text-slate-400" />
                                                        {assignedVehicle.plates || `${assignedVehicle.make} ${assignedVehicle.model}`}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Sin asignar</span>
                                        )}
                                    </td>
                                    <td className="text-center" onClick={e => e.stopPropagation()}>
                                        <button
                                            className="btn btn-ghost btn-xs btn-square text-slate-400 hover:text-indigo-600"
                                            onClick={() => toggleExpand(order.id)}
                                        >
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </td>
                                </tr>

                                {/* EXPANDED ROW */}
                                {isExpanded && (
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={6} className="p-0">
                                            <div className="p-6 border-b border-slate-100">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                                    {/* LEFT: Assignment Form */}
                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                            <Truck size={16} className="text-indigo-500" />
                                                            Asignar Recursos al Viaje
                                                        </h4>

                                                        {isConfirmed ? (
                                                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                                                                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                                                                <div>
                                                                    <p className="text-sm font-bold text-emerald-800">Recursos asignados</p>
                                                                    {assignedDriver && <p className="text-xs text-emerald-700">Conductor: {assignedDriver.name}</p>}
                                                                    {assignedVehicle && <p className="text-xs text-emerald-700">Vehículo: {assignedVehicle.make} {assignedVehicle.model} ({assignedVehicle.plates})</p>}
                                                                    <button
                                                                        className="mt-2 text-xs text-emerald-600 underline"
                                                                        onClick={() => {
                                                                            setAssignments(prev => ({
                                                                                ...prev,
                                                                                [order.id]: { driverId: order.driverId || '', vehicleId: order.vehicleId || '' }
                                                                            }));
                                                                        }}
                                                                    >
                                                                        Reasignar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <AssignmentForm
                                                                order={order}
                                                                drivers={drivers}
                                                                vehicles={vehicles}
                                                                assignment={getAssignment(order)}
                                                                onDriverChange={(v) => setAssignment(order.id, 'driverId', v)}
                                                                onVehicleChange={(v) => setAssignment(order.id, 'vehicleId', v)}
                                                                onAssign={() => handleAssign(order)}
                                                                loading={savingId === order.id}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* RIGHT: Order Info & Backhaul */}
                                                    <div className="space-y-6">
                                                        {/* Order Detail */}
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                                                                <Package size={16} className="text-slate-500" />
                                                                Detalle de la Orden
                                                            </h4>
                                                            <div className="bg-white rounded-xl border border-slate-200 p-3 text-xs space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500">Destinatario</span>
                                                                    <strong className="text-slate-800">{order.clientName || '—'}</strong>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500">Tipo de carga</span>
                                                                    <strong className="text-slate-800">{order.loadType || order.cargoType || '—'}</strong>
                                                                </div>
                                                                {order.packageCount && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-500">Paquetes</span>
                                                                        <strong className="text-slate-800">{order.packageCount}</strong>
                                                                    </div>
                                                                )}
                                                                {order.distanceKm && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-500">Distancia</span>
                                                                        <strong className="text-slate-800">{order.distanceKm} km</strong>
                                                                    </div>
                                                                )}
                                                                {(order.pricing?.subtotal || order.pricing?.priceToClient) && (
                                                                    <div className="flex justify-between pt-1 border-t border-slate-100">
                                                                        <span className="font-bold text-slate-600">Tarifa acordada</span>
                                                                        <strong className="text-emerald-700">
                                                                            ${(order.pricing?.subtotal || order.pricing?.priceToClient || 0).toLocaleString('es-MX')}
                                                                        </strong>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Backhaul */}
                                                        {(order.status === 'assigned_confirmed') && (
                                                            <div className="pt-4 border-t border-slate-200">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                                        <RefreshCw size={16} className="text-orange-500" />
                                                                        Viaje de Regreso
                                                                    </h4>
                                                                    <button
                                                                        onClick={() => findReturnTrips(order)}
                                                                        className="btn btn-xs btn-outline border-slate-200 text-slate-600 hover:bg-slate-50"
                                                                    >
                                                                        Buscar
                                                                    </button>
                                                                </div>
                                                                <div className="bg-orange-50 rounded-lg p-3 text-xs text-orange-800 border border-orange-100">
                                                                    <p>Radio de búsqueda: <strong>{settings.backhaulMatchRadiusKm || 50} km</strong></p>
                                                                    <p className="mt-0.5 opacity-80">Encuentra cargas de regreso para optimizar tu flota.</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ============================================================================
// AssignmentForm
// ============================================================================
interface AssignmentFormProps {
    order: Order;
    drivers: Driver[];
    vehicles: Vehicle[];
    assignment: { driverId: string; vehicleId: string };
    onDriverChange: (id: string) => void;
    onVehicleChange: (id: string) => void;
    onAssign: () => void;
    loading: boolean;
}

function AssignmentForm({ order, drivers, vehicles, assignment, onDriverChange, onVehicleChange, onAssign, loading }: AssignmentFormProps) {
    const selectedDriver = drivers.find(d => d.id === assignment.driverId);
    const selectedVehicle = vehicles.find(v => v.id === assignment.vehicleId);
    const canAssign = assignment.driverId && assignment.vehicleId;

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            {drivers.length === 0 && vehicles.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <p>No hay conductores ni vehículos registrados bajo tu empresa. Agrégalos primero en las secciones correspondientes.</p>
                </div>
            ) : (
                <>
                    {/* Vehicle Select */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                            <Truck size={12} className="inline mr-1" />Vehículo
                        </label>
                        <select
                            className="select select-sm select-bordered w-full"
                            value={assignment.vehicleId}
                            onChange={e => onVehicleChange(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Seleccionar vehículo…</option>
                            {vehicles.map((v: Vehicle) => (
                                <option key={v.id} value={v.id}>
                                    {v.make} {v.model} — {v.plates} ({v.type})
                                </option>
                            ))}
                        </select>
                        {selectedVehicle && (
                            <p className="text-xs text-slate-400 mt-1 ml-1">Tipo: {selectedVehicle.type} · Estado: {selectedVehicle.serviceStatus || 'Disponible'}</p>
                        )}
                    </div>

                    {/* Driver Select */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                            <UserIcon size={12} className="inline mr-1" />Conductor
                        </label>
                        <select
                            className="select select-sm select-bordered w-full"
                            value={assignment.driverId}
                            onChange={e => onDriverChange(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Seleccionar conductor…</option>
                            {drivers.map((d: any) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}{d.rating ? ` (${d.rating}★)` : ''}{d.status ? ` · ${d.status}` : ''}
                                </option>
                            ))}
                        </select>
                        {selectedDriver && (
                            <p className="text-xs text-slate-400 mt-1 ml-1">Licencia: {selectedDriver.license || 'N/A'}</p>
                        )}
                    </div>

                    <button
                        onClick={onAssign}
                        disabled={loading || !canAssign}
                        className="btn btn-primary btn-sm w-full shadow-sm"
                        style={{ height: '40px', borderRadius: '0.65rem' }}
                    >
                        {loading
                            ? <><span className="loading loading-spinner loading-xs" /> Guardando…</>
                            : <><CheckCircle2 size={15} /> Confirmar Asignación</>
                        }
                    </button>
                </>
            )}
        </div>
    );
}
