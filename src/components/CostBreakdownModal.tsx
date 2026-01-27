import Modal from '@/components/Modal';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Calculator, MapPin, Package, Zap, ArrowRight, Truck, ShieldCheck, Info } from 'lucide-react';

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

    // Billable Fields
    billableFreight?: number;
    billableFees?: number;
    billableTolls?: number;
    billableLineItems?: Array<{ label: string; value: number; type: string; price: number }>;
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
        <Modal isOpen={isOpen} title="Desglose Detallado de Costos" onClose={onClose}>
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

                        {/* 1. COSTO BASE */}
                        <div className="mb-4">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Costo Base</div>
                            {details.billableLineItems?.filter(i => i.type === 'base').map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center px-3 py-1.5 hover:bg-slate-50 rounded-lg">
                                    <span className="flex items-center gap-2 font-bold text-slate-700">
                                        <Truck size={14} className="text-blue-500" /> {item.label}
                                    </span>
                                    <span className="font-medium text-slate-900">{formatCurrency(item.price)}</span>
                                </div>
                            ))}
                        </div>

                        {/* 2. COSTOS OPERATIVOS EXTRAS (Fees) */}
                        {details.billableLineItems?.some(i => i.type === 'fee') && (
                            <div className="mb-4">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Costos Operativos Extras</div>
                                {details.billableLineItems?.filter(i => i.type === 'fee').map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center px-3 py-1.5 hover:bg-slate-50 rounded-lg">
                                        <span className="flex items-center gap-2 text-xs text-slate-600">
                                            <Package size={14} className="text-orange-400" /> {item.label}
                                        </span>
                                        <span className="font-medium text-slate-600">{formatCurrency(item.price)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 3. RATE COST OPERATIVOS (Multipliers) */}
                        {details.billableLineItems?.some(i => i.type === 'surcharge') && (
                            <div className="mb-4">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Rate Cost Operativos</div>
                                {details.billableLineItems?.filter(i => i.type === 'surcharge').map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center px-3 py-1.5 hover:bg-slate-50 rounded-lg">
                                        <span className="flex items-center gap-2 text-xs text-slate-600">
                                            <Zap size={14} className="text-yellow-500" /> {item.label}
                                        </span>
                                        <span className="font-medium text-slate-600">{formatCurrency(item.price)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 4. OTROS (Pass-through & Imponderables) */}
                        {details.billableLineItems?.some(i => i.type === 'pass-through' || i.type === 'imponderables') && (
                            <div className="mb-4">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Otros</div>
                                {details.billableLineItems?.filter(i => i.type === 'pass-through' || i.type === 'imponderables').map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center px-3 py-1.5 hover:bg-slate-50 rounded-lg">
                                        <span className="flex items-center gap-2 text-xs text-slate-500 italic">
                                            {item.type === 'imponderables' ? <Info size={14} className="text-slate-400" /> : <ShieldCheck size={14} className="text-green-500" />}
                                            {item.label}
                                        </span>
                                        <span className="font-medium text-slate-500">{formatCurrency(item.price)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Summary Section */}
                        <div className="pt-4 mt-2 border-t-2 border-slate-200">
                            <div className="flex justify-between items-center font-bold text-slate-900">
                                <span>Subtotal</span>
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
                        </div>
                        <div className="text-right">
                            {details.operationalCostPerKm && (
                                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                                    {formatCurrency(details.operationalCostPerKm)}/km
                                </span>
                            )}
                        </div>
                    </div>
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
