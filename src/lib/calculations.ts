/**
 * Logistics Calculations Module
 * 
 * This module contains all calculation functions for pricing, costs, and vehicle suitability.
 * It uses the unified schema from firebase/schema.ts
 */



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

    // Split Distance
    distanceOutbound?: number;
    distanceReturn?: number;

    // Optional cargo fields
    volume?: number; // m³
    type?: 'general' | 'fragile' | 'dangerous';
    packageType?: string;
    description?: string;
    value?: number; // for insurance
    declaredValue?: number;

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
    tollsOutbound?: number;
    tollsReturn?: number;
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

// ============================================================================
// FINANCIAL BREAKDOWN
// ============================================================================

export interface TripCost {
    // Operational
    fuel: number;
    tires: number;
    gps: number;
    depreciation: number;
    driverBase: number;
    driverViaticos: number;
    tolls: number;
    maneuvers: number;
    operationalTotal: number;

    // Financial
    imponderables: number;
    subBase: number;

    // Margins
    jfcUtility: number;
    carrierMargin: number;

    // Final
    clientTotal: number;
}

export interface LogisticsCostBreakdown extends Pricing {
    breakdown: {
        outbound: TripCost;
        returnTrip: TripCost;
        summary: {
            totalOperational: number;
            totalImponderables: number;
            totalJFCUtility: number;
            totalCarrierMargin: number;
        };
    };
}

/**
 * Helper: Safe Division to prevent Infinity/NaN
 */
const safeDiv = (num: number, den: number, fallback = 0): number => {
    return (den && den !== 0 && isFinite(den)) ? num / den : fallback;
};

/**
 * QUOTING LOGIC (Vehicle-Centric)
 */
export function calculateLogisticsCosts(
    pkg: Package,
    vehicle: Vehicle | VehicleDefinition,
    settings: PricingSettings,
    serviceLevel: 'standard' | 'express' = 'standard'
): LogisticsCostBreakdown {

    // 1. EXTRACT FINANCIAL FACTORS (With fallbacks)
    const ff = settings.financialFactors || {
        gpsMonthlyRent: 1500,
        gpsRentCost: 100,
        driverPaymentType: 'per_day' as const,
        driverDailySalary: 800,
        driverPercent: 15,
        driverKmPerDay: 600,
        driverViaticosPerDay: 500,
        imponderablesToUse: 3.0,
        tireCount: 6,
        tirePrice: 5000,
        tireLifeKm: 100000,
        vehicleValue: 1000000,
        vehicleUsefulLifeKm: 500000,
        profitMarginJFC: 10.0,
        profitMarginJFCOutbound: 10.0,
        profitMarginJFCReturn: 5.0,
        profitMarginCarrierOutbound: 30.0,
        profitMarginCarrierReturn: 10.0
    };

    const distance = Math.max(0, pkg.distanceKm || 0);

    // 2. RESOLVE VEHICLE SETTINGS (Source of Truth)
    const vConfig: any = (settings.vehicleDimensions as any)?.[vehicle.id] || {};

    // 3. RESOLVE FUEL & EFFICIENCY (Single Pass)
    const FUEL_TYPES = ['diesel', 'gasoline87', 'gasoline91'] as const;
    const activeFuelId = vConfig.fuelConfig
        ? FUEL_TYPES.find(f => vConfig.fuelConfig[f]?.enabled)
        : undefined;
    const activeFuelConfig = activeFuelId ? vConfig.fuelConfig[activeFuelId] : undefined;

    const vEfficiency = Math.max(
        activeFuelConfig?.efficiency || vConfig.efficiency || (vehicle as any).fuelEfficiency || 3.5,
        0.1
    );

    const fuelType = activeFuelId || vConfig.fuelType || (vehicle as any).fuelType || 'diesel';
    const fuelPrice = (settings.fuelPrices as any)?.[fuelType] || settings.defaultFuelPrice || 25;

    // 4. PRE-CALCULATE TRIP DAYS (Total for the service)
    const dOut = pkg.distanceOutbound ?? distance;
    const dRet = pkg.distanceReturn ?? distance;
    const totalDistance = dOut + dRet;
    const kmPerDay = ff.driverKmPerDay || 600;
    const totalDays = pkg.travelDays || Math.max(1, Math.ceil(safeDiv(totalDistance, kmPerDay, 1)));
    const ratioOut = totalDistance > 0 ? dOut / totalDistance : 1;
    const ratioRet = totalDistance > 0 ? dRet / totalDistance : 0;

    // 5. HELPER: CALCULATE A SINGLE LEG
    const calculateLeg = (dist: number, isReturn: boolean, legRatio: number): TripCost => {
        if (dist === 0) {
            return {
                fuel: 0, tires: 0, gps: 0, depreciation: 0, driverBase: 0, driverViaticos: 0, tolls: 0, maneuvers: 0,
                operationalTotal: 0, imponderables: 0, subBase: 0, jfcUtility: 0, carrierMargin: 0, clientTotal: 0
            };
        }

        // --- A. DIRECT OPERATIONAL COSTS ---

        // 1. Fuel (Per Km)
        const fuel = safeDiv(dist, vEfficiency) * fuelPrice;

        // 2. Tires (Per Km)
        const tireCount = vConfig.tireCount || (vehicle as any).tireCount || ff.tireCount || 6;
        const tirePriceUnit = vConfig.tirePrice || ff.tirePrice || 5000;
        const tireLife = vConfig.tireLifeKm || ff.tireLifeKm || 100000;
        const tires = dist * safeDiv(tireCount * tirePriceUnit, tireLife);

        // 3. Depreciation (Per Km)
        const vehicleVal = vConfig.vehicleValue || (vehicle as any).value || ff.vehicleValue || 1000000;
        const usefulLife = vConfig.vehicleUsefulLifeKm || (vehicle as any).usefulLifeKm || ff.vehicleUsefulLifeKm || 500000;
        const depreciation = dist * safeDiv(vehicleVal, usefulLife);

        // 4. GPS (Time-based, proportional to leg)
        const gpsMonthly = ff.gpsMonthlyRent || 1500;
        const gps = safeDiv(gpsMonthly, 30) * totalDays * legRatio;

        // 5. Driver (Time-based, proportional to leg)
        let driverBase = 0;
        if (ff.driverPaymentType !== 'percent') {
            driverBase = (ff.driverDailySalary || 800) * totalDays * legRatio;
        }
        const driverViaticos = (ff.driverViaticosPerDay || 500) * totalDays * legRatio;

        // 6. Tolls & Maneuvers
        const legTolls = isReturn ? (pkg.tollsReturn || 0) : (pkg.tollsOutbound || 0);
        const maneuvers = isReturn ? 0 : (
            (pkg.requiresLoadingSupport ? (settings.maneuverFees?.loading || 0) : 0) +
            (pkg.requiresUnloadingSupport ? (settings.maneuverFees?.unloading || 0) : 0)
        );

        let operationalTotal = fuel + tires + depreciation + gps + driverBase + driverViaticos + legTolls + maneuvers;

        // Handle Percent Driver Pay
        if (ff.driverPaymentType === 'percent') {
            const driverPct = (ff.driverPercent || 15) / 100;
            if (driverPct > 0 && driverPct < 1) {
                const otherCosts = operationalTotal;
                operationalTotal = safeDiv(otherCosts, (1 - driverPct));
                driverBase = operationalTotal * driverPct;
            }
        }

        // --- B. FINANCIAL LAYER ---
        const imponderables = operationalTotal * ((ff.imponderablesToUse || 3.0) / 100);
        const subBase = operationalTotal + imponderables;

        // --- C. MARGINS (Always directional from financialFactors) ---

        // 1. Carrier Margin (% stored as integer, e.g. 30 = 30%)
        const carrierMarginPct = isReturn
            ? (ff.profitMarginCarrierReturn || 0)
            : (ff.profitMarginCarrierOutbound || 0);
        const carrierMargin = subBase * (carrierMarginPct / 100);
        const priceToCarrier = subBase + carrierMargin;

        // 2. JFC Utility (% stored as integer, e.g. 10 = 10%)
        const jfcMarginPct = isReturn
            ? (ff.profitMarginJFCReturn ?? ff.profitMarginJFC ?? 0)
            : (ff.profitMarginJFCOutbound ?? ff.profitMarginJFC ?? 0);
        const jfcUtility = priceToCarrier * (jfcMarginPct / 100);

        // Final Client Total for this Leg
        const clientTotal = priceToCarrier + jfcUtility;

        return {
            fuel, tires, gps, depreciation, driverBase, driverViaticos, tolls: legTolls, maneuvers,
            operationalTotal, imponderables, subBase, jfcUtility, carrierMargin, clientTotal
        };
    };

    // 6. EXECUTE CALCULATIONS

    const outbound = calculateLeg(dOut, false, ratioOut);
    const returnTrip = calculateLeg(dRet, true, ratioRet);

    const totalClientPrice = outbound.clientTotal + returnTrip.clientTotal;

    // 6. APPLY MINIMUM (Per-Vehicle Minimum Price)
    // Reuse vConfig (resolved at line 207) — same source that reads fuel, tires, etc.
    const vehicleMinimum = vConfig.minPrice || settings.basePrice || 1500;
    const minimumApplied = totalClientPrice < vehicleMinimum;
    const finalPricePreIva = Math.max(totalClientPrice, vehicleMinimum);

    const totalIva = finalPricePreIva * 0.16;
    const finalPriceTotal = finalPricePreIva + totalIva;

    // 7. BILLABLE ITEMS GENERATION
    const billableLineItems = [];

    // Pass-throughs
    const totalTolls = outbound.tolls + returnTrip.tolls;
    const insuranceValue = pkg.value || pkg.declaredValue || 0;
    const insurance = (pkg.insuranceSelection === 'own' ? 0 : (settings.insuranceRate || 0) * insuranceValue / 100);

    const totalManeuvers = outbound.maneuvers + returnTrip.maneuvers;

    // Base Freight Display = Final Price - (Services + Tolls + Insurance)
    const baseFreightDisplay = finalPricePreIva - totalManeuvers - totalTolls;

    const finalBillingWithInsurance = finalPricePreIva + insurance;
    const totalIvaWithInsurance = finalBillingWithInsurance * 0.16;

    billableLineItems.push({
        label: 'Flete Base (Transporte Global)',
        value: baseFreightDisplay,
        type: 'base',
        price: baseFreightDisplay
    });

    if (totalManeuvers > 0) {
        billableLineItems.push({ label: 'Maniobras', value: totalManeuvers, type: 'fee', price: totalManeuvers });
    }
    if (totalTolls > 0) {
        billableLineItems.push({ label: 'Casetas', value: totalTolls, type: 'pass-through', price: totalTolls });
    }
    if (insurance > 0) {
        billableLineItems.push({ label: 'Seguro', value: insurance, type: 'pass-through', price: insurance });
    }

    return {
        basePrice: finalPricePreIva,
        fuelSurcharge: 0,
        insurance,
        urgency: 0,
        total: finalBillingWithInsurance + totalIvaWithInsurance,
        subtotal: finalBillingWithInsurance,
        iva: totalIvaWithInsurance,
        priceToClient: finalBillingWithInsurance + totalIvaWithInsurance,

        breakdown: {
            outbound,
            returnTrip,
            summary: {
                totalOperational: outbound.operationalTotal + returnTrip.operationalTotal,
                totalImponderables: outbound.imponderables + returnTrip.imponderables,
                totalJFCUtility: outbound.jfcUtility + returnTrip.jfcUtility,
                totalCarrierMargin: outbound.carrierMargin + returnTrip.carrierMargin
            }
        },

        // Legacy Fields (Filled with totals)
        fuelCost: outbound.fuel + returnTrip.fuel,
        tolls: totalTolls,
        driverSalary: outbound.driverBase,
        driverCommission: 0,
        assistantSalary: 0,
        assistantCommission: 0,
        food: outbound.driverViaticos + returnTrip.driverViaticos,
        lodging: 0,
        depreciation: outbound.depreciation + returnTrip.depreciation,
        otherExpenses: outbound.gps,
        unforeseen: outbound.imponderables + returnTrip.imponderables,
        operationalCost: outbound.operationalTotal + returnTrip.operationalTotal,
        billableLineItems,
        minimumApplied,
        vehicleMinimum,
    } as any;
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
    const tolls = actualValues?.realTolls || ((pkg.tollsOutbound || 0) + (pkg.tollsReturn || 0));

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

// ============================================================================
// DEFAULT PRICING SETTINGS (Seed Data)
// ============================================================================

export const DEFAULT_SETTINGS: PricingSettings = {
    fuelPrices: { diesel: 24.50, gasoline87: 22.10, gasoline91: 24.20 },
    maneuverFees: { loading: 1500, unloading: 1500 },
    tonKmRate: 2.50,
    basePrice: 1500.00,
    usefulLifeKm: 800000,
    vehicleDimensions: {
        'van': { enabled: true, length: 3.0, width: 1.8, height: 1.8, tireCount: 4, tirePrice: 3800, vehicleValue: 450000, vehicleUsefulLifeKm: 500000, minPrice: 3000, fuelConfig: { gasoline87: { enabled: true, efficiency: 6.5 }, diesel: { enabled: false, efficiency: 7.5 } } },
        'rabon': { enabled: true, length: 6.5, width: 2.5, height: 2.4, tireCount: 6, tirePrice: 5500, vehicleValue: 850000, vehicleUsefulLifeKm: 600000, minPrice: 5000, fuelConfig: { diesel: { enabled: true, efficiency: 4.5 } } },
        'torton': { enabled: true, length: 8.5, width: 2.5, height: 2.7, tireCount: 10, tirePrice: 9200, vehicleValue: 1800000, vehicleUsefulLifeKm: 800000, minPrice: 7000, fuelConfig: { diesel: { enabled: true, efficiency: 3.5 } } },
        'trailer': { enabled: true, length: 13.5, width: 2.6, height: 2.8, tireCount: 18, tirePrice: 10500, vehicleValue: 2400000, vehicleUsefulLifeKm: 1000000, minPrice: 9000, fuelConfig: { diesel: { enabled: true, efficiency: 2.2 } } },
        'full': { enabled: true, length: 13.5, width: 2.6, height: 2.8, tireCount: 34, tirePrice: 10500, vehicleValue: 3500000, vehicleUsefulLifeKm: 1000000, minPrice: 15000, fuelConfig: { diesel: { enabled: true, efficiency: 1.8 } } },
        'plataforma': { enabled: true, length: 13.5, width: 2.6, height: 1.5, tireCount: 18, tirePrice: 10500, vehicleValue: 1200000, vehicleUsefulLifeKm: 1000000, minPrice: 9000, fuelConfig: { diesel: { enabled: true, efficiency: 2.2 } } },
        // Ensure all types from VEHICLE_TYPES are present
        'lowboy': { enabled: true, length: 12.0, width: 2.6, height: 1.0, tireCount: 18, tirePrice: 12000, vehicleValue: 2800000, vehicleUsefulLifeKm: 1000000, minPrice: 12000, fuelConfig: { diesel: { enabled: true, efficiency: 1.5 } } },
        'tren': { enabled: true, length: 20.0, width: 2.6, height: 2.8, tireCount: 42, tirePrice: 10500, vehicleValue: 4500000, vehicleUsefulLifeKm: 1000000, minPrice: 18000, fuelConfig: { diesel: { enabled: true, efficiency: 1.6 } } },
        'megacamion': { enabled: true, length: 25.0, width: 2.6, height: 2.8, tireCount: 42, tirePrice: 10500, vehicleValue: 5000000, vehicleUsefulLifeKm: 1000000, minPrice: 20000, fuelConfig: { diesel: { enabled: true, efficiency: 1.7 } } },
        'refrigerado': { enabled: true, length: 13.5, width: 2.6, height: 2.8, tireCount: 18, tirePrice: 10500, vehicleValue: 2800000, vehicleUsefulLifeKm: 800000, minPrice: 12000, fuelConfig: { diesel: { enabled: true, efficiency: 2.0 } } },
        'pipa': { enabled: true, length: 12.0, width: 2.5, height: 2.5, tireCount: 18, tirePrice: 10500, vehicleValue: 2600000, vehicleUsefulLifeKm: 800000, minPrice: 10000, fuelConfig: { diesel: { enabled: true, efficiency: 2.1 } } },
        'granelera': { enabled: true, length: 12.0, width: 2.5, height: 2.5, tireCount: 18, tirePrice: 10500, vehicleValue: 1500000, vehicleUsefulLifeKm: 800000, minPrice: 8000, fuelConfig: { diesel: { enabled: true, efficiency: 3.0 } } },
        'ganadera': { enabled: true, length: 13.5, width: 2.6, height: 2.8, tireCount: 18, tirePrice: 10500, vehicleValue: 2200000, vehicleUsefulLifeKm: 800000, minPrice: 10000, fuelConfig: { diesel: { enabled: true, efficiency: 2.1 } } },
        'madrina': { enabled: true, length: 18.0, width: 2.6, height: 3.0, tireCount: 18, tirePrice: 10500, vehicleValue: 3500000, vehicleUsefulLifeKm: 1000000, minPrice: 12000, fuelConfig: { diesel: { enabled: true, efficiency: 2.0 } } },
        'plataforma_ext': { enabled: true, length: 18.0, width: 2.6, height: 1.5, tireCount: 18, tirePrice: 12000, vehicleValue: 1500000, vehicleUsefulLifeKm: 1000000, minPrice: 10000, fuelConfig: { diesel: { enabled: true, efficiency: 2.0 } } },
    },
    transportRates: { 'FTL': 1.0, 'PTL': 1.15, 'LTL': 1.4 },
    cargoRates: { 'general': 1.0, 'hazardous': 1.25, 'perishable': 1.2, 'fragile': 1.15, 'machinery': 1.1, 'packages': 1.0 },
    insuranceRate: 0.15,
};
