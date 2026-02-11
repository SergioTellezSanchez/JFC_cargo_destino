import { useState, useEffect, useMemo } from 'react';
import { calculateLogisticsCosts, VEHICLE_TYPES, isVehicleSuitable } from '@/lib/calculations';
import type { LogisticsCostBreakdown, Package } from '@/lib/calculations';
import type { Vehicle, PricingSettings } from '@/lib/firebase/schema';

interface UseQuoteCalculatorProps {
    weight: number;
    // Split Distance
    distanceOutbound?: number;
    distanceReturn?: number;
    // Fallback/Legacy
    distance?: number;

    settings: PricingSettings | null;
    manualVehicleId?: string; // If user manually selects a vehicle
    // Optional extra package data
    volume?: number;
    cargoType?: string;
    description?: string;
    dimensions?: { length: number; width: number; height: number };
    value?: number;
    insuranceSelection?: 'jfc' | 'own';
    requiresLoadingSupport?: boolean;
    requiresUnloadingSupport?: boolean;
    // Added for Simulator parity
    transportType?: 'FTL' | 'PTL' | 'LTL';
    isStackable?: boolean;
    requiresStretchWrap?: boolean;
    tollsOutbound?: number;
    tollsReturn?: number;
}

interface UseQuoteCalculatorResult {
    result: LogisticsCostBreakdown | null;
    selectedVehicle: Vehicle | null; // The vehicle actually used (auto or manual)
    error: string | null;
    isCalculating: boolean;
    recommendedVehicleId: string | null; // The one we would suggest
}

export function useQuoteCalculator({
    weight,
    distance,
    settings,
    manualVehicleId,
    volume,
    cargoType,
    description,
    dimensions,
    value,
    insuranceSelection,
    requiresLoadingSupport,
    requiresUnloadingSupport,
    tollsOutbound,
    tollsReturn,
    // Restored Props
    transportType,
    isStackable,
    requiresStretchWrap,

    // New Props
    distanceOutbound,
    distanceReturn,
}: UseQuoteCalculatorProps): UseQuoteCalculatorResult {
    const [result, setResult] = useState<LogisticsCostBreakdown | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [recommendedVehicleId, setRecommendedVehicleId] = useState<string | null>(null);

    // Resolve Distances
    // If distanceReturn is provided, use it. If not, default to distanceOutbound.
    // If neither, fallback to 'distance' (legacy).
    const distOut = distanceOutbound ?? distance ?? 0;
    const distRet = distanceReturn ?? distanceOutbound ?? distance ?? 0;

    // 1. Determine Recommended Vehicle (Auto-Selection)
    // Runs whenever weight/volume changes
    useEffect(() => {
        if (!weight || weight <= 0) {
            setRecommendedVehicleId(null);
            return;
        }

        // Sort vehicles by capacity (smallest that fits)
        // We filter by 'isSuitable' which checks weight, volume, cargo type
        const suitable = VEHICLE_TYPES.filter(v => isVehicleSuitable(v, {
            weight,
            distanceKm: distOut, // Use outbound for suitability check
            volume,
            cargoType: cargoType as any
        } as Package));

        // Sort by capacity ascending (cheapest theoretical)
        suitable.sort((a, b) => a.capacity - b.capacity);

        if (suitable.length > 0) {
            setRecommendedVehicleId(suitable[0].id);
        } else {
            setRecommendedVehicleId(null); // No vehicle fits
        }
    }, [weight, volume, cargoType, distOut]);

    // 2. Resolve Active Vehicle
    // Manual overrides recommended
    const activeVehicleId = manualVehicleId || recommendedVehicleId;

    // 3. Perform Calculation
    useEffect(() => {
        // Validation: Needs settings, vehicle, and at least some distance
        if (!settings || !activeVehicleId || (distOut <= 0 && distRet <= 0)) {
            setResult(null);
            setSelectedVehicle(null);
            return;
        }

        setIsCalculating(true);
        setError(null);

        try {
            // Find definitions
            const vehicleDef = VEHICLE_TYPES.find(v => v.id === activeVehicleId);

            if (!vehicleDef) {
                throw new Error(`Vehicle definition not found for ID: ${activeVehicleId}`);
            }

            setSelectedVehicle(vehicleDef as any);

            // Create Package Context
            const pkg: Package = {
                weight,
                distanceKm: distOut, // Legacy field, mostly for single-leg logic if any remains

                // New Split References
                distanceOutbound: distOut,
                distanceReturn: distRet,

                volume,
                cargoType: cargoType as any,
                description,
                value,
                declaredValue: value,
                insuranceSelection,
                requiresLoadingSupport,
                requiresUnloadingSupport,
                // Add any other mapped props
                transportType: transportType || 'FTL',
                isStackable: isStackable,
                requiresStretchWrap: requiresStretchWrap,
                tollsOutbound: tollsOutbound || 0,
                tollsReturn: tollsReturn || 0,
            };

            const calculated = calculateLogisticsCosts(pkg, vehicleDef, settings);
            setResult(calculated);

        } catch (err: any) {
            console.error('Quote Calculation Error:', err);
            setError(err.message || 'Error executing calculation');
            setResult(null);
        } finally {
            setIsCalculating(false);
        }
    }, [
        settings,
        activeVehicleId,
        distOut,
        distRet,
        weight,
        volume,
        value,
        insuranceSelection,
        requiresLoadingSupport,
        requiresUnloadingSupport,
        transportType,
        isStackable,
        requiresStretchWrap,
        tollsOutbound,
        tollsReturn,
    ]);

    return {
        result,
        selectedVehicle,
        error,
        isCalculating,
        recommendedVehicleId
    };
}
