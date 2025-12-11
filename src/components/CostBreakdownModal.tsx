import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/utils';
import { Calculator, MapPin, Package, Zap, ArrowRight, Truck } from 'lucide-react';

interface QuoteDetails {
    base: number;
    distance: number;
    weight: number;
    serviceMultiplier: number;
    serviceFee: number;
    fuelSurcharge: number;
    demandSurcharge: number;
    iva: number;
    total: number;
}

interface CostBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    details: QuoteDetails | null;
    totalPrice: number;
    distanceKm: number;
    weight: number;
    serviceLevel: 'standard' | 'express';
}

export default function CostBreakdownModal({
    isOpen,
    onClose,
    onConfirm,
    details,
    totalPrice,
    distanceKm,
    weight,
    serviceLevel
}: CostBreakdownModalProps) {
    if (!details) return null;

    return (
        <Modal isOpen={isOpen} title="Desglose del Precio" onClose={onClose}>
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <Calculator size={18} className="text-blue-500" />
                            Resumen de Costos
                        </h4>
                        <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full uppercase">
                            {serviceLevel === 'express' ? 'Express Plus' : 'Estándar'}
                        </span>
                    </div>

                    <div className="space-y-3 text-sm">
                        {/* Base Rate */}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <Truck size={14} /> Tarifa Base
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.base)}</span>
                        </div>

                        {/* Distance */}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <MapPin size={14} /> Distancia ({distanceKm.toFixed(1)} km)
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.distance)}</span>
                        </div>

                        {/* Weight */}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <Package size={14} /> Peso ({weight} kg)
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.weight)}</span>
                        </div>

                        {/* Fuel Surcharge */}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <Zap size={14} /> Recargo por Combustible
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.fuelSurcharge)}</span>
                        </div>

                        {/* Demand Surcharge */}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <Calculator size={14} /> Demand Surcharge
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.demandSurcharge)}</span>
                        </div>

                        {/* Service Fee */}
                        {details.serviceFee > 0 && (
                            <div className="flex justify-between items-center text-orange-600 bg-orange-50 p-2 rounded-lg">
                                <span className="flex items-center gap-2 font-medium">
                                    <Zap size={14} /> Prioridad Express
                                </span>
                                <span className="font-bold">+{formatCurrency(details.serviceFee)}</span>
                            </div>
                        )}

                        {/* IVA */}
                        <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-2">
                            <span className="text-slate-500 flex items-center gap-2">
                                <span>IVA (16%)</span>
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.iva)}</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-end">
                        <span className="text-slate-500 font-medium">Total Estimado</span>
                        <span className="text-3xl font-bold text-slate-900 tracking-tight">{formatCurrency(totalPrice)}</span>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 flex items-start gap-3">
                    <div className="bg-blue-100 p-1 rounded-full shrink-0">
                        <Calculator size={14} className="text-blue-600" />
                    </div>
                    <p>
                        Este precio incluye impuestos y seguro básico. El costo final puede variar ligeramente si hay cambios en la ruta o tiempo de espera.
                    </p>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                        onClick={onClose}
                    >
                        Volver
                    </button>
                    <button
                        className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        onClick={onConfirm}
                    >
                        Continuar <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </Modal>
    );
}
