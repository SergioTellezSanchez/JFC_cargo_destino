import Modal from '@/components/Modal';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Calculator, MapPin, Package, Zap, ArrowRight, Truck, ShieldCheck } from 'lucide-react';

interface QuoteDetails {
    fuelCost: number;
    tolls: number;
    driverSalary: number;
    driverCommission: number;
    assistantSalary: number;
    assistantCommission: number;
    food: number;
    lodging: number;
    depreciation: number;
    otherExpenses: number;
    unforeseen: number;
    operationalCost: number;
    insurance: number;
    subtotal: number;
    iva: number;
    priceToClient: number;
    capacityOccupiedPercent: number;
    utility: number;
    utilityPercent: number;
    operationalCostPerKm?: number;
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
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <Calculator size={18} className="text-blue-500" />
                            Análisis de Costos Operativos
                        </h4>
                        <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full uppercase">
                            {serviceLevel === 'express' ? 'Prioridad Express' : 'Servicio Estándar'}
                        </span>
                    </div>

                    <div className="space-y-3 text-sm">
                        {/* Direct Costs Section */}
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Costos Directos</div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <Zap size={14} className="text-blue-400" /> Combustible ({formatNumber(distanceKm)} km)
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.fuelCost)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <MapPin size={14} className="text-slate-400" /> Casetas y Peajes
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.tolls)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <Truck size={14} className="text-slate-400" /> Depreciación de Unidad
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.depreciation)}</span>
                        </div>

                        {/* Personnel Section */}
                        <div className="pt-2 mt-2 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal y Viáticos</div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">Sueldos (Chofer + Ayudante)</span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.driverSalary + details.assistantSalary)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">Comisiones</span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.driverCommission + details.assistantCommission)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">Alimentación y Hospedaje</span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.food + details.lodging)}</span>
                        </div>

                        {/* Other Section */}
                        <div className="pt-2 mt-2 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administración y Riesgos</div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">Imponderables (Prevención)</span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.unforeseen)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-green-500" /> Seguro de Carga
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(details.insurance)}</span>
                        </div>

                        {/* Summary Section */}
                        <div className="pt-4 mt-2 border-t-2 border-slate-200">
                            <div className="flex justify-between items-center font-bold text-slate-900">
                                <span>Subtotal Servicio</span>
                                <span>{formatCurrency(details.subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                <span>IVA (16.00%)</span>
                                <span>{formatCurrency(details.iva)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">Total a Pagar</span>
                            <span className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(totalPrice)}</span>
                            {details.operationalCostPerKm && (
                                <span className="text-[10px] text-blue-600 font-bold mt-1">
                                    Costo Op: {formatCurrency(details.operationalCostPerKm)}/km
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Capacidad Ocupada</div>
                            <div className={`text-sm font-bold ${details.capacityOccupiedPercent > 90 ? 'text-orange-500' : 'text-blue-500'}`}>
                                {details.capacityOccupiedPercent.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 text-slate-300 p-5 rounded-xl text-[11px] font-mono border border-slate-800 space-y-3">
                    <h5 className="text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Calculator size={14} /> Memoria de Cálculo Simplificada
                    </h5>

                    <div className="space-y-2">
                        <p className="border-b border-white/5 pb-1">
                            <span className="text-white block mb-1">1. Operación Directa:</span>
                            Combustible + Casetas + Depreciación = <span className="text-blue-300">{formatCurrency(details.fuelCost + details.tolls + details.depreciation)}</span>
                        </p>

                        <p className="border-b border-white/5 pb-1">
                            <span className="text-white block mb-1">2. Factor Humano:</span>
                            Sueldos + Comisiones + Viáticos = <span className="text-blue-300">{formatCurrency(details.driverSalary + details.assistantSalary + details.driverCommission + details.assistantCommission + details.food + details.lodging)}</span>
                        </p>

                        <p className="border-b border-white/5 pb-1">
                            <span className="text-white block mb-1">3. Protección:</span>
                            Seguro + Prevención de Imponderables = <span className="text-blue-300">{formatCurrency(details.insurance + details.unforeseen)}</span>
                        </p>

                        <p>
                            <span className="text-white block mb-1">4. Utilidad Bruta Estimada:</span>
                            Ingreso - Costos - Impuestos = <span className="text-green-400 font-bold">{formatCurrency(details.utility)} ({details.utilityPercent.toFixed(1)}%)</span>
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
