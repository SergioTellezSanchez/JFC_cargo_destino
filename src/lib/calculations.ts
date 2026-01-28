/**
 * Logistics Calculations Module
 * 
 * This module contains all calculation functions for pricing, costs, and vehicle suitability.
 * It uses the unified schema from firebase/schema.ts
 */

import { formatNumber } from './utils';

import type { Vehicle, PricingSettings, Pricing } from './firebase/schema';

// ============================================================================
// VEHICLE CATEGORIES
// ============================================================================

export const VEHICLE_CATEGORIES = {
    RIGIDOS: 'Camiones unitarios (Rígidos)',
    ARTICULADOS: 'Camiones articulados',
    ESPECIALIZADOS: 'Unidades especializadas',
    PLATAFORMAS: 'Plataformas abiertas'
} as const;

// ============================================================================
// VEHICLE TYPE DEFINITIONS (for quoter)
// ============================================================================

export interface VehicleDefinition {
    id: string;
    name: string;
    category: string;
    capacity: number; // kg
    description: string;
    uses: string[];
    dimensions?: { l: number; w: number; h: number };
    fuelType?: 'diesel' | 'gasoline87' | 'gasoline91';
    fuelEfficiency?: number;
}

export const VEHICLE_TYPES: VehicleDefinition[] = [
    // Rígidos
    { id: 'rabon', name: 'Rabón', category: VEHICLE_CATEGORIES.RIGIDOS, capacity: 8000, description: 'Eje sencillo, ideal para zonas de difícil acceso.', uses: ['Urbano', 'Última milla'], dimensions: { l: 6.5, w: 2.5, h: 2.4 }, fuelType: 'diesel', fuelEfficiency: 4.5 },
    { id: 'torton', name: 'Tortón', category: VEHICLE_CATEGORIES.RIGIDOS, capacity: 17000, description: 'Doble eje, ideal para cargas medianas.', uses: ['Regional', 'Intermunicipal'], fuelType: 'diesel', fuelEfficiency: 3.5 },
    { id: 'van', name: 'Van o Panel', category: VEHICLE_CATEGORIES.RIGIDOS, capacity: 3000, description: 'Transporte ligero urbano.', uses: ['Paquetería', 'E-commerce'], fuelType: 'gasoline87', fuelEfficiency: 8.5 },

    // Articulados
    { id: 'trailer', name: 'Tráiler (Sencillo)', category: VEHICLE_CATEGORIES.ARTICULADOS, capacity: 25000, description: 'Caja seca estándar de 48/53 pies.', uses: ['Carga general'], fuelType: 'diesel', fuelEfficiency: 2.2 },
    { id: 'full', name: 'Doble Remolque (Full)', category: VEHICLE_CATEGORIES.ARTICULADOS, capacity: 50000, description: 'Alta capacidad nacional.', uses: ['Gran volumen'], fuelType: 'diesel', fuelEfficiency: 1.8 },
    { id: 'lowboy', name: 'Lowboy / Cama baja', category: VEHICLE_CATEGORIES.ARTICULADOS, capacity: 45000, description: 'Baja altura para equipo sobredimensionado.', uses: ['Maquinaria pesada'], fuelType: 'diesel', fuelEfficiency: 1.5 },
    { id: 'tren', name: 'Tren de carretera', category: VEHICLE_CATEGORIES.ARTICULADOS, capacity: 60000, description: 'Múltiples remolques para rutas específicas.', uses: ['Contenedores', 'Granel'], fuelType: 'diesel', fuelEfficiency: 1.6 },
    { id: 'megacamion', name: 'Megacamion', category: VEHICLE_CATEGORIES.ARTICULADOS, capacity: 60000, description: 'Máxima eficiencia, requiere permiso especial.', uses: ['Grandes cantidades'], fuelType: 'diesel', fuelEfficiency: 1.7 },

    // Especializados
    { id: 'refrigerado', name: 'Caja Refrigerada', category: VEHICLE_CATEGORIES.ESPECIALIZADOS, capacity: 30000, description: 'Temperatura controlada para cadena de frío.', uses: ['Perecederos', 'Medicamentos'], fuelType: 'diesel', fuelEfficiency: 2.0 },
    { id: 'pipa', name: 'Autotanque (Pipa)', category: VEHICLE_CATEGORIES.ESPECIALIZADOS, capacity: 25000, description: 'Transporte de líquidos y químicos.', uses: ['Combustibles', 'Líquidos'], fuelType: 'diesel', fuelEfficiency: 2.1 },
    { id: 'granelera', name: 'Granelera', category: VEHICLE_CATEGORIES.ESPECIALIZADOS, capacity: 11500, description: 'Para materiales pulverulentos.', uses: ['Construcción', 'Agro'], fuelType: 'diesel', fuelEfficiency: 3.0 },
    { id: 'ganadera', name: 'Jaula Ganadera', category: VEHICLE_CATEGORIES.ESPECIALIZADOS, capacity: 25000, description: 'Ventilación para animales vivos o granel.', uses: ['Ganado', 'Granos'], fuelType: 'diesel', fuelEfficiency: 2.1 },
    { id: 'madrina', name: 'Madrina / Portacoches', category: VEHICLE_CATEGORIES.ESPECIALIZADOS, capacity: 25000, description: 'Transporte de vehículos.', uses: ['Automóviles'], fuelType: 'diesel', fuelEfficiency: 2.0 },

    // Plataformas
    { id: 'plataforma', name: 'Plataforma Estándar', category: VEHICLE_CATEGORIES.PLATAFORMAS, capacity: 25000, description: 'Abierta para fácil carga y descarga.', uses: ['Estructuras', 'Acero'], fuelType: 'diesel', fuelEfficiency: 2.2 },
    { id: 'plataforma_ext', name: 'Plataforma Extensible', category: VEHICLE_CATEGORIES.PLATAFORMAS, capacity: 25000, description: 'Para mercancía extremadamente larga.', uses: ['Tuberías', 'Postes'], fuelType: 'diesel', fuelEfficiency: 2.0 },
];

// ============================================================================
// PACKAGE TYPE (for calculations)
// ============================================================================

export interface Package {
    // Required fields
    weight: number; // kg
    distanceKm: number;

    // Optional cargo fields
    volume?: number; // m³
    type?: 'general' | 'fragile' | 'dangerous';
    packageType?: string;
    description?: string;
    value?: number; // for insurance
    declaredValue?: number; // alias for value

    // Logistics options
    loadType?: string;
    transportType?: 'FTL' | 'PTL' | 'LTL';
    cargoType?: 'hazardous' | 'perishable' | 'machinery' | 'furniture' | 'packages' | 'general';
    requiresLoadingSupport?: boolean;
    requiresUnloadingSupport?: boolean;
    isStackable?: boolean;
    requiresStretchWrap?: boolean;
    insuranceSelection?: 'jfc' | 'own';

    // Detailed cost fields
    fuelPrice?: number;
    fuelEfficiency?: number;
    tolls?: number;
    driverSalary?: number;
    driverCommission?: number;
    assistantSalary?: number;
    assistantCommission?: number;
    food?: number;
    lodging?: number;
    travelDays?: number;
    unforeseenPercent?: number;
    otherExpenses?: number;

    // CRM/Folio data
    seller?: string;
    clientName?: string;
    folio?: string;
    packageCount?: number;
    origin?: string;
    destination?: string;
}

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * NEW SIMPLIFIED QUOTING LOGIC (Service-Based)
 * Formula: Costo Base (Weights x TransportRate x CargoRate) + Extras + Surcharges
 */
export function calculateLogisticsCosts(
    pkg: Package,
    vehicle: Vehicle | VehicleDefinition,
    settings: PricingSettings,
    serviceLevel: 'standard' | 'express' = 'standard'
): Pricing & {
    // Legacy fields kept for compatibility, but simplified or set to 0 where appropriate
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
    operationalCostPerKm: number;
    subtotal: number;
    iva: number;
    priceToClient: number;
    priceBeforeTax: number;
    capacityOccupiedPercent: number;
    utility: number;
    utilityPercent: number;
    insuranceRate: number;

    // Billable Breakdown (For UI)
    billableFreight: number;
    billableFees: number;
    billableTolls: number;
    billableLineItems?: Array<{ label: string; value: number; type: string; price: number }>;
} {
    // 1. Core Variables
    const distance = pkg.distanceKm || 0;
    const insuranceRate = (settings.insuranceRate || 1.5) / 100;
    const margin = settings.profitMargin || 1.4;

    // 2. Multipliers & Breakdown Setup
    const breakdownDetails = [];

    // --- 1. COSTO BASE (Formula: Peso * Transporte * Carga) ---
    // "Peso Aproximado (Costo fijo)" * "Cost rate Tipo Transporte" * "Cost rate Tipo Carga"

    const weightBaseCosts: Record<string, number> = settings.weightRates || {
        '500': 1500,   // Light
        '1500': 3500,  // Van
        '3500': 6500,  // 3.5 Ton
        '10000': 12000,// Rabon
        '14000': 18000,// Torton
        '24000': 25000 // Trailer
    };

    const transportRates: Record<string, number> = settings.transportRates || {
        'FTL': 1.0,
        'PTL': 0.8,
        'LTL': 0.6
    };

    const cargoTypeRates: Record<string, number> = settings.cargoRates || {
        'general': 1.0,
        'packages': 1.0,
        'hazardous': 1.5,
        'perishable': 1.3,
        'machinery': 1.4,
        'furniture': 1.2,
        'heavy': 1.2,
        'fragile': 1.2 // [NEW] Supported in calculations
    };

    // Find closest or matching weight key
    const weightKey = Object.keys(weightBaseCosts).reduce((prev, curr) =>
        (Math.abs(Number(curr) - pkg.weight) < Math.abs(Number(prev) - pkg.weight) ? curr : prev)
        , '500');

    // Calculate Base Logic
    // [MODIFIED] Use Vehicle Specific Price Per Km if available, otherwise Global
    const dynamicVehicleForRate = (settings.vehicleDimensions as any)?.[weightKey];
    const vehicleKmRate = dynamicVehicleForRate?.pricePerKm || settings.kilometerRate || 0;

    const mileageCost = distance * vehicleKmRate;

    // [NEW] Calculate Fuel Cost (Informational / Breakdown)
    // Dynamic Vehicle Lookup from Settings (Updates in real-time)
    const dynamicVehicle = (settings.vehicleDimensions as any)?.[weightKey];

    // Find active fuel config
    let vEfficiency = 3.5;
    let fuelPrice = settings.defaultFuelPrice || 25;

    // Check new 'fuelConfig' structure
    if (dynamicVehicle?.fuelConfig) {
        // Try to find the best fuel (prioritize selected if we had a selector, otherwise first enabled)
        const fuels = ['diesel', 'gasoline87', 'gasoline91'];
        const activeFuel = fuels.find(f => dynamicVehicle.fuelConfig[f]?.enabled);

        if (activeFuel) {
            vEfficiency = dynamicVehicle.fuelConfig[activeFuel].efficiency || vEfficiency;
            if (settings.fuelPrices) {
                fuelPrice = (settings.fuelPrices as any)[activeFuel] || fuelPrice;
            }
        }
    } else {
        // Fallback to legacy structure
        const vFuelType = dynamicVehicle?.fuelType || (vehicle as any).fuelType || 'diesel';
        vEfficiency = dynamicVehicle?.efficiency || (vehicle as any).efficiency || (vehicle as any).fuelEfficiency || 3.5;
        if (vFuelType && settings.fuelPrices) {
            fuelPrice = (settings.fuelPrices as any)[vFuelType] || fuelPrice;
        }
    }

    const calculatedFuelCost = (distance / vEfficiency) * fuelPrice;

    // [NEW] 1.2 Tonelada/KM
    const tonKmRate = settings.tonKmRate || 0;
    let tonKmCost = 0;
    if (tonKmRate > 0 && distance > 0) {
        const weightTons = pkg.weight / 1000;
        tonKmCost = distance * weightTons * tonKmRate;
    }

    const rawWeightCost = weightBaseCosts[String(pkg.weight)] || weightBaseCosts[weightKey] || 1500;

    const transportRate = transportRates[pkg.transportType || 'FTL'] || 1.0;
    const cargoType = pkg.cargoType || 'general';
    const cargoRate = cargoTypeRates[cargoType] || 1.0;

    // Base Freight = (Start Fee + Mileage + TonKm) * Multipliers
    const baseFreight = (rawWeightCost + mileageCost + tonKmCost) * transportRate * cargoRate;

    // 1. Base Cost Components Split
    // A. Banderazo
    breakdownDetails.push({
        label: `Banderazo / Salida`,
        value: rawWeightCost,
        type: 'base'
    });

    // B. Costo Kilométrico
    if (mileageCost > 0) {
        breakdownDetails.push({
            label: `Costo Kilométrico (${distance}km * $${vehicleKmRate})`,
            value: mileageCost,
            type: 'base'
        });
    }

    // C. Tonelada/Km
    if (tonKmCost > 0) {
        breakdownDetails.push({
            label: `Factor Carga/Distancia ($/Ton/Km)`,
            value: tonKmCost,
            type: 'base'
        });
    }

    // 2. Transporte (Adjustment)
    // We calculate the adjustment based on the combined base (Start + Mileage + TonKm)
    const combinedBase = rawWeightCost + mileageCost + tonKmCost;
    const transportAdjustment = (combinedBase * transportRate) - combinedBase;

    if (transportRate !== 1.0) {
        breakdownDetails.push({
            label: `Transp: ${pkg.transportType || 'FTL'} (${transportRate > 1 ? '+' : ''}${Math.round((transportRate - 1) * 100)}%)`,
            value: transportAdjustment,
            type: 'base'
        });
    }

    // 3. Carga (Adjustment on top of Transp)
    const intermediateBase = combinedBase * transportRate;
    const cargoAdjustment = (intermediateBase * cargoRate) - intermediateBase;

    if (cargoRate !== 1.0) {
        breakdownDetails.push({
            label: `Carga: ${pkg.cargoType || 'general'} (${cargoRate > 1 ? '+' : ''}${Math.round((cargoRate - 1) * 100)}%)`,
            value: cargoAdjustment,
            type: 'base'
        });
    }


    // --- 2. COSTOS OPERATIVOS EXTRAS (Fixed Add-ons) ---
    // "Servicios de Maniobra + Condiciones de Manejo"
    const maneuverFees = settings.maneuverFees || { loading: 500, unloading: 500 };
    const packagingFees = settings.packagingFees || { stackable: 0, stretchWrap: 200 };

    let extraFees = 0;

    if (pkg.requiresLoadingSupport) { extraFees += maneuverFees.loading; breakdownDetails.push({ label: 'Maniobra Carga (Personal)', value: maneuverFees.loading, type: 'fee' }); }
    if (pkg.requiresUnloadingSupport) { extraFees += maneuverFees.unloading; breakdownDetails.push({ label: 'Maniobra Descarga (Personal)', value: maneuverFees.unloading, type: 'fee' }); }

    if (pkg.isStackable && (packagingFees.stackable || 0) > 0) {
        extraFees += packagingFees.stackable;
        breakdownDetails.push({ label: 'Producto Estibable (Manejo)', value: packagingFees.stackable, type: 'fee' });
    }

    if (pkg.requiresStretchWrap) {
        extraFees += packagingFees.stretchWrap;
        breakdownDetails.push({ label: 'Material de Emplayado', value: packagingFees.stretchWrap, type: 'fee' });
    }


    // --- 3. RATE COST OPERATIVOS (Multipliers) ---
    // "Presentación de Carga & Cantidad"

    // A. Presentación de Carga (Rate Cost)
    const presentationRates = settings.presentationRates || {
        'Granel': 1.3,
        'Maquinaria': 1.4,
        'Paletizado / Tarimas': 1.1,
        'General': 1.0
    };
    const presentation = pkg.packageType || 'General';
    const presentationRate = presentationRates[presentation] || 1.0;

    if (presentationRate > 1.0) {
        const surcharge = baseFreight * (presentationRate - 1);
        breakdownDetails.push({ label: `Presentación: ${presentation} (+${Math.round((presentationRate - 1) * 100)}%)`, value: surcharge, type: 'surcharge' });
    }

    // B. Cantidad (Rate Cost)
    const qtyRate = settings.quantityRate || 0.05;
    const qty = pkg.packageCount || 1;

    if (qty > 1) {
        const qtySurcharge = baseFreight * ((qty - 1) * qtyRate);
        breakdownDetails.push({ label: `Cantidad: ${qty} (+${Math.round((qty - 1) * qtyRate * 100)}%)`, value: qtySurcharge, type: 'surcharge' });
    }

    // Accumulate for Total Operations Cost
    let totalSurcharges = 0;
    breakdownDetails.forEach(i => { if (i.type === 'surcharge') totalSurcharges += i.value; });
    const totalOpsCost = baseFreight + totalSurcharges + extraFees;

    // --- 4. OTROS (Pass-throughs + Imponderables) ---
    // Insurance
    const insuranceValue = pkg.value || pkg.declaredValue || 0;
    const insurance = pkg.insuranceSelection === 'own' ? 0 : insuranceValue * insuranceRate;
    breakdownDetails.push({ label: 'Seguro de Carga', value: insurance, type: 'pass-through' });

    // Tolls (Casetas)
    const tolls = pkg.tolls || 0;
    if (tolls > 0) {
        breakdownDetails.push({ label: 'Casetas y Peajes (Directo)', value: tolls, type: 'pass-through' });
    }

    // Imponderables
    const imponderablesRate = settings.imponderablesRate !== undefined ? settings.imponderablesRate : 3;
    const imponderables = totalOpsCost * (imponderablesRate / 100);

    if (imponderables > 0) {
        breakdownDetails.push({
            label: `Imponderables (${imponderablesRate}%)`,
            value: imponderables,
            type: 'imponderables'
        });
    }

    const costWithImponderables = totalOpsCost + imponderables;

    // 5. MARGIN APPLICATION
    // Price = (OpsCost + Imponderables) * Margin + PassThroughs
    const priceForService = costWithImponderables * margin;

    const totalPassThrough = insurance + tolls;
    let adjustedPriceBeforeInsurance = priceForService + tolls;

    // [NEW] Minimum Floor Logic
    const minPrice = settings.basePrice || 0;
    if (adjustedPriceBeforeInsurance < minPrice) {
        adjustedPriceBeforeInsurance = minPrice;
        // We adjust the basePrice field in return object to reflect this bump if needed, 
        // but strictly speaking 'basePrice' in the return interface is usually just the transport cost.
        // However, to ensure the total matches, we use this floor.
    }

    const priceToClient = adjustedPriceBeforeInsurance + insurance; // Insurance is usually separate or added after? 
    // Logic above: priceToClient = priceForService + totalPassThrough (insurance + tolls)
    // So if we floored 'adjustedPrice', we just add insurance on top if it wasn't part of the floor.
    // Usually "Minimum Turn" includes everything except maybe taxes. 
    // Let's assume settings.basePrice is the minimum SUB TOTAL before IVA.

    // Re-calculating to be precise:
    const calculatedSubtotal = priceForService + tolls + insurance;
    const finalSubtotal = Math.max(calculatedSubtotal, minPrice);

    // We update priceToClient to this new floor
    const finalPriceToClient = finalSubtotal;
    const iva = finalPriceToClient * 0.16;
    const finalPriceWithIva = finalPriceToClient + iva;

    // Revenue Ratio for Billable Items
    const revenueRatio = costWithImponderables > 0 ? (priceForService / costWithImponderables) : margin;

    // Convert to Billable Line Items
    // [MODIFIED] Now we separate the Margin as its own line item rather than hiding it in the ratio
    const marginAmount = priceForService - costWithImponderables;

    const billableLineItems = breakdownDetails.map(item => ({
        ...item,
        price: item.value // We show the direct calculated cost/value without margin distribution
    }));

    // Add Margin Line Item
    if (marginAmount > 0) {
        billableLineItems.push({
            label: `Margen Operativo / Utilidad`,
            value: marginAmount,
            type: 'margin',
            price: marginAmount
        });
    }

    // Backwards compatibility filling
    const operationalCost = costWithImponderables;
    const operationalCostPerKm = distance > 0 ? (operationalCost / distance) : 0;
    const capacityOccupiedPercent = (vehicle as any).capacity ? (pkg.weight / (vehicle as any).capacity) * 100 : 0;
    const billableFreight = baseFreight * revenueRatio;
    const billableFees = extraFees * revenueRatio;
    const billableTolls = tolls;

    return {
        // Pricing Interface
        basePrice: finalSubtotal - insurance - tolls, // Reverse engineered base
        fuelSurcharge: 0,
        insurance,
        urgency: serviceLevel === 'express' ? (finalSubtotal * ((settings.serviceMultipliers?.express || 1.4) - 1)) : 0,
        total: finalPriceWithIva,

        // Detailed Breakdown (Simulated/Calculated)
        fuelCost: calculatedFuelCost,
        tolls,
        driverSalary: 0,
        driverCommission: 0,
        assistantSalary: 0,
        assistantCommission: 0,
        food: 0,
        lodging: 0,
        depreciation: 0,
        otherExpenses: extraFees, // Fees cost basis
        unforeseen: imponderables,
        operationalCost: costWithImponderables,
        operationalCostPerKm,

        // UI Display Helpers (Billable/Selling Prices)
        billableFreight,
        billableFees,
        billableTolls,
        billableLineItems, // New Detailed List

        subtotal: finalPriceToClient,
        iva,
        priceToClient: finalPriceWithIva,
        priceBeforeTax: finalPriceToClient,
        capacityOccupiedPercent,
        utility: priceToClient - costWithImponderables - insurance,
        utilityPercent: ((priceToClient - costWithImponderables - insurance) / priceToClient) * 100,
        insuranceRate: insuranceRate * 100
    };
}

/**
 * ADMIN ANALYTICS: TRIP PROFITABILITY
 * Calculates the REAL profit based on actual expenses and vehicle efficiency.
 * Used in Admin Dashboard after trip completion or for detailed projections.
 */
export function calculateTripProfitability(
    pkg: Package,
    vehicle: Vehicle,
    settings: PricingSettings,
    actualValues?: {
        realDistance?: number;
        realFuelPrice?: number;
        realTolls?: number;
    }
) {
    const distance = actualValues?.realDistance || pkg.distanceKm || 0;
    const usefulLife = settings.usefulLifeKm || 500000;
    const days = pkg.travelDays || 1;

    // 1. Real Fuel Cost
    let fuelPrice = actualValues?.realFuelPrice || pkg.fuelPrice || settings.defaultFuelPrice || 25;
    if (!pkg.fuelPrice && !actualValues?.realFuelPrice && vehicle.fuelType && settings.fuelPrices) {
        fuelPrice = (settings.fuelPrices as any)[vehicle.fuelType] || fuelPrice;
    }
    const efficiency = vehicle.fuelEfficiency || 2; // Actual vehicle efficiency
    const fuelCost = (distance / efficiency) * fuelPrice;

    // 2. Real Personnel Costs
    const driverSalaryTotal = (pkg.driverSalary || 0) * days;
    const assistantSalaryTotal = (pkg.assistantSalary || 0) * days;
    const food = pkg.food || 0;
    const lodging = pkg.lodging || 0;

    // 3. Real Vehicle Depreciation
    const assetValue = vehicle.value || 1000000;
    const depreciationPerKm = assetValue / usefulLife;
    const totalDepreciation = depreciationPerKm * distance;

    // 4. Real Tolls
    const tolls = actualValues?.realTolls || pkg.tolls || 0;

    // 5. Total Real Cost
    const totalRealCost = fuelCost + driverSalaryTotal + assistantSalaryTotal + food + lodging + totalDepreciation + tolls + (pkg.otherExpenses || 0);

    return {
        revenue: 0, // To be filled with actual Quote Price
        totalRealCost,
        breakdown: {
            fuelCost,
            personnel: driverSalaryTotal + assistantSalaryTotal + food + lodging,
            depreciation: totalDepreciation,
            tolls,
            others: pkg.otherExpenses || 0
        },
        profitPerKm: 0 // (Revenue - Cost) / Distance
    };
}

export function isVehicleSuitable(v: Vehicle | VehicleDefinition, pkg: Package): boolean {
    // 1. Weight Capacity check
    if (Number(v.capacity) < (pkg.weight || 0)) return false;

    // 2. Volumetric Capacity check
    if (pkg.volume && (v as any).volumetricCapacity && Number((v as any).volumetricCapacity) < pkg.volume) return false;

    // 3. Logic based on vehicle name/category if provided in pkg context
    const vehicleTypeName = (pkg as any).selectedVehicleType;
    if (vehicleTypeName && v.id !== vehicleTypeName) return false;

    // 4. Special requirements
    const vehicleUses = (v as any).uses || [];

    if (pkg.cargoType === 'perishable') {
        const isColdChain = v.id === 'refrigerado' || vehicleUses.includes('Perecederos') || vehicleUses.includes('Refrigerado');
        if (!isColdChain) return false;
    }

    if (pkg.cargoType === 'machinery' || pkg.packageType === 'Maquinaria') {
        const isHeavyDuty = v.id === 'lowboy' || v.category === VEHICLE_CATEGORIES.PLATAFORMAS || vehicleUses.includes('Maquinaria');
        if (!isHeavyDuty) return false;
    }

    if (pkg.cargoType === 'hazardous') {
        const isChemical = v.id === 'pipa' || v.id === 'trailer' || vehicleUses.includes('Químicos');
        if (!isChemical) return false;
    }

    return true;
}
