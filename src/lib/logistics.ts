export interface FuelPrices {
    diesel: number;
    gasoline91: number;
    gasoline87: number;
}

export interface PricingSettings {
    insuranceRate: number;
    profitMargin: number;
    basePrice: number;
    usefulLifeKm: number;
    defaultFuelPrice?: number;
    fuelPrices?: FuelPrices;
}

export interface Vehicle {
    id: string;
    name: string;
    category?: string;
    capacity: number; // in kg
    volumetricCapacity: number; // in m3
    costPerKm: number;
    value: number;
    usefulLifeKm: number;
    suspensionType: string;
    plate?: string;
    company?: string;
    fuelEfficiency?: number; // km/l
    fuelType?: keyof FuelPrices;
    depreciationPerDay?: number;
    description?: string;
    uses?: string[];
    dimensions?: { l: number; w: number; h: number };
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

export const VEHICLE_CATEGORIES = {
    RIGIDOS: 'Camiones unitarios (Rígidos)',
    ARTICULADOS: 'Camiones articulados',
    ESPECIALIZADOS: 'Unidades especializadas',
    PLATAFORMAS: 'Plataformas abiertas'
} as const;

export interface VehicleDefinition {
    id: string;
    name: string;
    category: string;
    capacity: number; // kg
    description: string;
    uses: string[];
    dimensions?: { l: number; w: number; h: number };
    fuelType?: keyof FuelPrices;
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

export function calculateLogisticsCosts(pkg: Package, vehicle: Vehicle | VehicleDefinition, settings: PricingSettings, serviceLevel: 'standard' | 'express' = 'standard') {
    const insuranceRate = (settings.insuranceRate || 1.5) / 100;
    const margin = settings.profitMargin || 1.4;
    const basePrice = settings.basePrice || 1000;
    const usefulLife = settings.usefulLifeKm || 500000;

    const distance = pkg.distanceKm || 0;
    const days = pkg.travelDays || 1;

    // Fuel calculation
    let fuelPrice = pkg.fuelPrice || settings.defaultFuelPrice || 25;
    const v = vehicle as any;
    if (!pkg.fuelPrice && v.fuelType && settings.fuelPrices) {
        fuelPrice = (settings.fuelPrices as any)[v.fuelType] || fuelPrice;
    }
    const efficiency = pkg.fuelEfficiency || v.fuelEfficiency || 2;
    const fuelCost = (distance / efficiency) * fuelPrice;

    // Personnel costs (Total for the trip)
    const driverSalaryTotal = (pkg.driverSalary || 0) * days;
    const assistantSalaryTotal = (pkg.assistantSalary || 0) * days;
    const driverCommission = pkg.driverCommission || 0;
    const assistantCommission = pkg.assistantCommission || 0;
    const food = pkg.food || 0;
    const lodging = pkg.lodging || 0;

    // Depreciation
    const assetValue = Number((vehicle as any).value) || 1000000;
    const depreciationPerKm = assetValue / usefulLife;
    const depreciationKmTotal = depreciationPerKm * distance;
    const depreciationDayTotal = ((vehicle as any).depreciationPerDay || 0) * days;
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
        utilityPercent: ((priceToClient - costWithUnforeseen - insurance) / priceToClient) * 100,
        insuranceRate: insuranceRate * 100
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

    // 4. Special requirements for sensitive cargo
    const vehicleUses = (v as any).uses || [];

    if (pkg.packageType === 'Perecederos') {
        const isColdChain = v.id === 'refrigerado' || vehicleUses.includes('Perecederos') || vehicleUses.includes('Refrigerado');
        if (!isColdChain) return false;
    }

    if (pkg.packageType === 'Maquinaria') {
        const isHeavyDuty = v.id === 'lowboy' || v.category === VEHICLE_CATEGORIES.PLATAFORMAS || vehicleUses.includes('Maquinaria');
        if (!isHeavyDuty) return false;
    }

    if (pkg.packageType === 'Productos Químicos') {
        const isChemical = v.id === 'pipa' || v.id === 'trailer' || vehicleUses.includes('Químicos');
        if (!isChemical) return false;
    }

    return true;
}
