export interface PricingSettings {
    insuranceRate: number;
    profitMargin: number;
    basePrice: number;
    usefulLifeKm: number;
    defaultFuelPrice?: number;
}

export interface Vehicle {
    id: string;
    name: string;
    capacity: number; // in kg
    volumetricCapacity: number; // in m3
    costPerKm: number;
    value: number;
    usefulLifeKm: number;
    suspensionType: string;
    plate?: string;
    company?: string;
    fuelEfficiency?: number; // km/l
    depreciationPerDay?: number;
}

export interface Package {
    weight: number; // in kg
    volume?: number; // in m3
    declaredValue: number;
    distanceKm: number;
    type?: string;
    packageType?: string;
    loadType?: string;
    // New detailed fields
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
    seller?: string;
    clientName?: string;
    folio?: string;
}

export function calculateLogisticsCosts(pkg: Package, vehicle: Vehicle, settings: PricingSettings, serviceLevel: 'standard' | 'express' = 'standard') {
    const insuranceRate = (settings.insuranceRate || 1.5) / 100;
    const margin = settings.profitMargin || 1.4;
    const basePrice = settings.basePrice || 1000;
    const usefulLife = settings.usefulLifeKm || 500000;

    const distance = pkg.distanceKm || 0;
    const days = pkg.travelDays || 1;

    // Fuel calculation
    const fuelPrice = pkg.fuelPrice || settings.defaultFuelPrice || 25;
    const efficiency = pkg.fuelEfficiency || vehicle.fuelEfficiency || 2;
    const fuelCost = (distance / efficiency) * fuelPrice;

    // Personnel costs (Total for the trip)
    const driverSalaryTotal = (pkg.driverSalary || 0) * days;
    const assistantSalaryTotal = (pkg.assistantSalary || 0) * days;
    const driverCommission = pkg.driverCommission || 0;
    const assistantCommission = pkg.assistantCommission || 0;
    const food = pkg.food || 0;
    const lodging = pkg.lodging || 0;

    // Depreciation
    const assetValue = Number(vehicle?.value) || 1000000;
    const depreciationPerKm = assetValue / usefulLife;
    const depreciationKmTotal = depreciationPerKm * distance;
    const depreciationDayTotal = (vehicle.depreciationPerDay || 0) * days;
    const totalDepreciation = Math.max(depreciationKmTotal, depreciationDayTotal);

    // Tolls and others
    const tolls = pkg.tolls || 0;
    const otherExpenses = pkg.otherExpenses || 0;

    // Operational Cost (Sum of all direct costs)
    const totalOperationalCost =
        fuelCost +
        tolls +
        driverSalaryTotal +
        driverCommission +
        assistantSalaryTotal +
        assistantCommission +
        food +
        lodging +
        totalDepreciation +
        otherExpenses;

    // Capacity calculation
    const capacityOccupiedPercent = (pkg.weight / (vehicle.capacity || 1)) * 100;

    // Unforeseen (Imponderables)
    const unforeseenPercent = pkg.unforeseenPercent || 0;
    const unforeseenAmount = totalOperationalCost * (unforeseenPercent / 100);

    // Subtotal before margin and insurance
    const costWithUnforeseen = totalOperationalCost + unforeseenAmount;

    // Applying margin (Profit)
    const serviceMult = serviceLevel === 'express' ? 1.4 : 1.0;
    const priceBeforeInsurance = (costWithUnforeseen * margin * serviceMult);

    // Insurance
    const insurance = (pkg.declaredValue || 0) * insuranceRate;

    // Total final
    const priceToClient = priceBeforeInsurance + insurance;
    const iva = priceToClient * 0.16;
    const finalPriceWithIva = priceToClient + iva;

    return {
        fuelCost,
        tolls,
        driverSalary: driverSalaryTotal,
        driverCommission,
        assistantSalary: assistantSalaryTotal,
        assistantCommission,
        food,
        lodging,
        depreciation: totalDepreciation,
        otherExpenses,
        unforeseen: unforeseenAmount,
        operationalCost: totalOperationalCost,
        insurance,
        subtotal: priceToClient,
        iva,
        priceToClient: finalPriceWithIva,
        priceBeforeTax: priceToClient,
        capacityOccupiedPercent,
        utility: priceToClient - costWithUnforeseen - insurance,
        insuranceRate: insuranceRate * 100
    };
}

export function isVehicleSuitable(v: Vehicle, pkg: Package): boolean {
    // 1. Weight Capacity check
    if (Number(v.capacity) < (pkg.weight || 0)) return false;

    // 2. Volumetric Capacity check
    if (pkg.volume && Number(v.volumetricCapacity) < pkg.volume) return false;

    const vehicleTypeName = (pkg as any).loadTypeDetails?.vehicleType;
    if (vehicleTypeName && v.name !== vehicleTypeName) return false;

    if (pkg.loadType === 'full-truck' && Number(v.capacity) < 7000) return false;
    if (pkg.loadType === 'van' && Number(v.capacity) >= 7000) return false;

    // 4. Special requirements for sensitive cargo
    const isSensitive = pkg.packageType === 'Productos Químicos' ||
        pkg.packageType === 'Perecederos' ||
        pkg.packageType === 'Electrónicos' ||
        pkg.packageType === 'Maquinaria';

    if (isSensitive) {
        const hasPremiumSuspension = v.suspensionType?.includes('Neumática') ||
            v.suspensionType?.includes('Hidráulica');
        if (!hasPremiumSuspension) return false;
    }

    return true;
}
