export interface PricingSettings {
    insuranceRate: number;
    profitMargin: number;
    basePrice: number;
    usefulLifeKm: number;
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
}

export interface Package {
    weight: number; // in kg
    volume?: number; // in m3
    declaredValue: number;
    distanceKm: number;
    type?: string;
    packageType?: string;
    loadType?: string;
}

export function calculateLogisticsCosts(pkg: Package, vehicle: Vehicle, settings: PricingSettings, serviceLevel: 'standard' | 'express' = 'standard') {
    const insuranceRate = (settings.insuranceRate || 1.5) / 100;
    const margin = settings.profitMargin || 1.4;
    const basePrice = settings.basePrice || 1000;
    const usefulLife = settings.usefulLifeKm || 500000;

    const costPerKm = Number(vehicle?.costPerKm) || 15;
    const assetValue = Number(vehicle?.value) || 1000000;
    const depreciationPerKm = assetValue / usefulLife;

    const distance = pkg.distanceKm || 100;

    // Additional premium for special suspension
    let suspensionPremium = 0;
    if (vehicle?.suspensionType?.includes('Neumática')) {
        suspensionPremium = basePrice * 0.10; // 10% premium for air suspension
    }

    const operationalCost = (costPerKm + depreciationPerKm) * distance;
    const totalBaseCost = basePrice + operationalCost + suspensionPremium;

    const serviceMult = serviceLevel === 'express' ? 1.4 : 1.0;
    const priceBeforeInsurance = (totalBaseCost * margin) * serviceMult;
    const insurance = (pkg.declaredValue || 0) * insuranceRate;
    const priceToClient = priceBeforeInsurance + insurance;

    const iva = priceToClient * 0.16;
    const finalPrice = priceToClient + iva;

    const utility = finalPrice - (totalBaseCost + insurance + iva);
    const utilityPercent = (utility / finalPrice) * 100;

    return {
        operationalCost,
        insurance,
        totalCost: totalBaseCost + insurance,
        priceToClient: finalPrice, // Including IVA for the user view
        priceBeforeTax: priceToClient,
        iva,
        utility,
        utilityPercent,
        depreciation: depreciationPerKm * distance,
        basePrice,
        suspensionPremium,
        serviceFee: (totalBaseCost * margin) * (serviceMult - 1)
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
