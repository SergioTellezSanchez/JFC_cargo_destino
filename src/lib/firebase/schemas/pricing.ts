// ============================================================================
// PRICING & SETTINGS
// ============================================================================

export interface FuelPrices {
    diesel: number;
    gasoline91: number;
    gasoline87: number;
}

export interface PricingSettings {
    // Core
    insuranceRate: number; // e.g. 1.5%
    basePrice: number; // Minimum trip cost
    usefulLifeKm: number;
    imponderablesRate?: number; // e.g. 3%

    // Fuel Costs (Configurable)
    fuelPrices?: FuelPrices;

    // 1. Base Cost Components (Configurable)
    kilometerRate?: number; // Cost per km (e.g. $15/km)
    tonKmRate?: number; // [NEW] Cost per km per ton (e.g. $2/km/ton)

    // "Costo fijo asignado a cada Peso Aproximado"
    // weightRates?: Record<string, number>; // DEPRECATED: Use vehicleDimensions for pricing

    // "Cost rate asignado a cada Tipo de Transporte"
    transportRates?: {
        FTL: number;
        PTL: number;
        LTL: number;
    };

    // "Cost rate asignado a cada Tipo de Carga"
    cargoRates?: {
        general: number; // e.g. 1.0
        hazardous: number; // e.g. 1.5
        perishable: number;
        machinery: number;
        packages: number; // "Paquetería/Diversos"
        fragile: number; // [NEW] "Muebles/Frágil"
    };

    // 2. Multipliers / Rate Cost Operativos
    // "Presentación de Carga"
    presentationRates?: Record<string, number>; // e.g. {'Granel': 1.3...}
    quantityRate?: number; // [NEW] Factor for extra quantity

    // [NEW] Financial Breakdown Factors (SCRUM-20)
    financialFactors?: {
        // GPS
        gpsMonthlyRent: number; // e.g. 500 (MXN/Month)
        gpsRentCost: number; // Legacy or fixed per trip override

        // Driver
        driverPaymentType: 'per_day' | 'percent';
        driverDailySalary: number; // MXN/Day
        driverPercent: number; // % of Trip
        driverKmPerDay: number; // e.g. 600 km/day (Efficiency)
        driverViaticosPerDay: number; // MXN/Day

        // Operational
        imponderablesToUse: number; // % (e.g. 3)

        // Vehicle Global Defaults
        tireCount: number;
        tirePrice: number; // [NEW] Cost per tire
        tireLifeKm: number; // Useful life of a tire
        vehicleValue: number; // Asset value
        vehicleUsefulLifeKm: number; // Total useful km (Depreciation)

        // Margins
        profitMarginJFC: number; // % (e.g. 10) - DEPRECATED/FALLBACK
        profitMarginJFCOutbound?: number; // % (e.g. 10) - Ida [NEW]
        profitMarginJFCReturn?: number; // % (e.g. 10) - Regreso [NEW]

        profitMarginCarrierOutbound: number; // % (e.g. 30) - Ida
        profitMarginCarrierReturn: number; // % (e.g. 10) - Regreso
    };

    // [NEW] Vehicle Config (Dimensions & Efficiency)
    // Keyed by Vehicle ID (e.g. 'van', 'rabon', 'trailer')
    // This is now the SOURCE OF TRUTH for pricing parameters.
    vehicleDimensions?: Record<string, {
        enabled: boolean; // Is this vehicle type active?

        // Physical Specs
        length: number;
        width: number;
        height: number;
        volume?: number;
        weightCapacity?: number; // Overrides global defaults if set

        // Efficiency & Fuel
        fuelType?: 'diesel' | 'gasoline87' | 'gasoline91';
        efficiency?: number; // km/l (Global or specific to fuelType)
        fuelConfig?: Record<string, { enabled: boolean; efficiency: number }>;

        // Financial / Depreciation Params (Per Vehicle Type)
        vehicleValue?: number; // Cost of the vehicle (New/Replacement)
        vehicleUsefulLifeKm?: number; // Total km before replacement

        // Tires
        tireCount?: number;
        tirePrice?: number; // Cost per tire
        tireLifeKm?: number; // Useful km per tire set

        // Calculated / Override
        pricePerKm?: number; // Optional override. If not set, calculated from above.
        minPrice?: number; // Minimum trip price for this vehicle type (pre-IVA, round trip)
    }>;

    // "Cantidad" - Multiplier based on quantity? Or simple cost per unit?
    // User said: "Cost rate que asignamos a cada Naturaleza" (Typo for Quantity?)
    // We will store a per-unit factor or fixed fee


    // 3. Operational Extras (Fixed Costs)
    maneuverFees?: {
        loading: number;
        unloading: number;
    };

    packagingFees?: {
        stackable: number; // "Producto Estibable" fee? Or discount?
        stretchWrap: number; // "Playo/Empaque"
    };

    // Legacy / Other
    defaultFuelPrice?: number;

    serviceMultipliers?: {
        express: number; // e.g. 1.4
        roundTrip: number; // e.g. 1.8
        weekend: number;
    };
}

export interface Pricing {
    basePrice: number;
    fuelSurcharge: number;
    insurance: number;
    urgency?: number;
    total: number;

    // Detailed breakdown (from logistics.ts)
    fuelCost?: number;
    tolls?: number;
    driverSalary?: number;
    driverCommission?: number;
    assistantSalary?: number;
    assistantCommission?: number;

    food?: number;
    lodging?: number;
    depreciation?: number;
    otherExpenses?: number;
    unforeseen?: number;
    operationalCost?: number;
    operationalCostPerKm?: number;
    subtotal?: number;
    iva?: number;
    priceToClient?: number;
    utility?: number;
    utilityPercent?: number;

    // Billable Breakdown (For UI & History)
    billableFreight?: number;
    billableFees?: number;
    billableTolls?: number;
    billableLineItems?: Array<{ label: string; value: number; type: string; price: number }>;
}
