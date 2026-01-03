import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/utils';
import { Calculator, MapPin, Package, Zap, ArrowRight, Truck } from 'lucide-react';

interface QuoteDetails {
    basePrice: number;
    operationalCost: number;
    depreciation: number;
    insurance: number;
    suspensionPremium: number;
    serviceFee: number;
    iva: number;
    priceToClient: number;
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
                            Resumen de Costos B2B
                        </h4>
                        <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full uppercase">
                            {serviceLevel === 'express' ? 'Express Plus' : 'Estándar'}
                        </span>
                    </div>

                    <div className="space-y-3 text-sm">
                        {/* Base Rate */}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <Truck size={14} /> Tarifa Base (Servicio)
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.basePrice)}</span>
                        </div>

                        {/* Operating Cost */}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <Zap size={14} /> Costo Operativo ({distanceKm.toFixed(1)} km)
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.operationalCost)}</span>
                        </div>

                        {/* Depreciation */}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <Calculator size={14} /> Depreciación de Activo
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.depreciation)}</span>
                        </div>

                        {/* Insurance */}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <Calculator size={14} /> Seguro de Carga
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.insurance)}</span>
                        </div>

                        {/* Suspension Premium */}
                        {details.suspensionPremium > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <Truck size={14} /> Premium Suspensión Neumática
                                </span>
                                <span className="font-medium text-slate-900">{formatCurrency(details.suspensionPremium)}</span>
                            </div>
                        )}

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

                <div className="bg-slate-900 text-slate-300 p-5 rounded-xl text-[11px] font-mono border border-slate-800 space-y-3">
                    <h5 className="text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Calculator size={14} /> Memoria de Cálculo
                    </h5>

                    <div className="space-y-2">
                        <p className="border-b border-white/5 pb-1">
                            <span className="text-white block mb-1">1. Costo Operativo:</span>
                            ({formatCurrency(details.operationalCost / distanceKm)}/km avg) × {distanceKm.toFixed(1)} km = <span className="text-blue-300">{formatCurrency(details.operationalCost)}</span>
                        </p>

                        <p className="border-b border-white/5 pb-1">
                            <span className="text-white block mb-1">2. Seguro de Carga:</span>
                            Valor Declarado × Tasa Seguro = <span className="text-blue-300">{formatCurrency(details.insurance)}</span>
                        </p>

                        <p className="border-b border-white/5 pb-1">
                            <span className="text-white block mb-1">3. Margen y Servicios:</span>
                            (Base + Op + Dep) × Margen {details.serviceFee > 0 ? '+ Fee Express' : ''} = <span className="text-blue-300">{formatCurrency(totalPrice / 1.16 - details.iva)}</span>
                        </p>

                        <p>
                            <span className="text-white block mb-1">4. Impuestos:</span>
                            Subtotal × 0.16 (IVA) = <span className="text-blue-300">{formatCurrency(details.iva)}</span>
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 flex items-start gap-3">
                    <div className="bg-blue-100 p-1 rounded-full shrink-0">
                        <Calculator size={14} className="text-blue-600" />
                    </div>
                    <p>
                        Este desglose técnico detalla la formación del precio final basado en parámetros de flota y mercado vigentes.
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
