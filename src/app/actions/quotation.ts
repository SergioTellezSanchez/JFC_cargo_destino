'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QuotationInput {
    origin: string;
    destination: string;
    packageType: string; // Bulto, pallet, caja, pza, bote, mueble
    isLTL: boolean;
    vehicleType?: string; // CAMIONETA_CERRADA, REDILAS, CERRADA (Required if FTL)
    volume?: number; // m3
    weight?: number; // kg
}

interface QuotationResult {
    price: number;
    details: string;
    distanceKm: number;
}

export async function calculateQuotation(data: QuotationInput): Promise<QuotationResult> {
    // Mock distance calculation (In real app, use Google Maps API)
    // For now, random distance between 10 and 500 km
    const distanceKm = Math.floor(Math.random() * 490) + 10;

    // Base rates
    const baseRatePerKm = 10; // $10 per km
    const weightFactor = 0.5; // $0.5 per kg
    const volumeFactor = 100; // $100 per m3

    let price = distanceKm * baseRatePerKm;

    // Add weight and volume costs
    if (data.weight) {
        price += data.weight * weightFactor;
    }
    if (data.volume) {
        price += data.volume * volumeFactor;
    }

    // Vehicle depreciation / type factor
    // "depreciación diaria de la unidad (valor del mercado / dias de uso util)"
    // We need to fetch a vehicle or use a standard value.
    // Since we don't have a specific vehicle selected yet (it's a quotation), we use averages.

    let vehicleDepreciation = 0;

    if (!data.isLTL && data.vehicleType) {
        // FTL: Full Truck Load - User pays for the whole truck
        // Fetch average depreciation for the type
        // Mock values:
        const marketValue = 500000; // $500,000
        const usefulLifeDays = 365 * 5; // 5 years
        const dailyDepreciation = marketValue / usefulLifeDays; // ~$273 per day

        // Assume trip takes 1 day for simplicity, or calc based on distance (500km/day)
        const tripDays = Math.ceil(distanceKm / 500);
        vehicleDepreciation = dailyDepreciation * tripDays;

        price += vehicleDepreciation;

        // Add premium for FTL
        price *= 1.5;
    } else {
        // LTL: Less Than Truckload - Shared cost
        // Lower base price
        price *= 0.8;
    }

    // Save quotation to DB
    await prisma.quotation.create({
        data: {
            origin: data.origin,
            destination: data.destination,
            packageType: data.packageType,
            isLTL: data.isLTL,
            vehicleType: data.vehicleType,
            distanceKm: distanceKm,
            calculatedPrice: price,
        },
    });

    return {
        price: Math.round(price * 100) / 100,
        details: `Distance: ${distanceKm} km. Type: ${data.isLTL ? 'LTL' : 'FTL'}.`,
        distanceKm
    };
}
