import { NextResponse } from 'next/server';
import { VEHICLE_TYPES } from '@/lib/calculations';

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function POST(request: Request) {
    if (!GOOGLE_API_KEY) {
        return NextResponse.json({ error: 'Google Maps API Key not configured' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { origin, destination, vehicleType } = body; // Expects { lat, lng } objects

        if (!origin || !destination) {
            return NextResponse.json({ error: 'Origin and Destination are required' }, { status: 400 });
        }

        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'routes.travelAdvisory.tollInfo,routes.distanceMeters,routes.duration,routes.routeLabels,routes.legs.steps.navigationInstruction',
            },
            body: JSON.stringify({
                origin: {
                    location: {
                        latLng: {
                            latitude: origin.lat,
                            longitude: origin.lng
                        }
                    }
                },
                destination: {
                    location: {
                        latLng: {
                            latitude: destination.lat,
                            longitude: destination.lng
                        }
                    }
                },
                travelMode: 'DRIVE',
                extraComputations: ['TOLLS'],
                // Optional: valid vehicle types if needed, but DRIVE defaults to standard car
                // routingPreference: 'TRAFFIC_AWARE', 
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google Routes API Error:', errorText);
            return NextResponse.json({ error: 'Failed to fetch usage from Google', details: errorText }, { status: response.status });
        }

        const data = await response.json();

        // Parse Tolls
        let totalTolls = 0;
        const route = data.routes?.[0];

        if (route?.travelAdvisory?.tollInfo?.estimatedPrice) {
            for (const price of route.travelAdvisory.tollInfo.estimatedPrice) {
                if (price.currencyCode === 'MXN') {
                    totalTolls += Number(price.units) + (price.nanos ? price.nanos / 1e9 : 0);
                }
            }
        }

        // Calculate multiplier based on vehicle type and axles
        let multiplier = 1.0;
        if (vehicleType) {
            const vehicleInfo = VEHICLE_TYPES.find(v => v.id === vehicleType);
            if (vehicleInfo && vehicleInfo.axles) {
                if (vehicleInfo.axles === 2) {
                    // Vans pay like cars (1x), Rabón pays more (1.5x)
                    multiplier = vehicleInfo.id === 'van' ? 1.0 : 1.5; 
                } else if (vehicleInfo.axles === 3) {
                    multiplier = 2.0; // Torton
                } else if (vehicleInfo.axles === 4) {
                    multiplier = 2.5;
                } else if (vehicleInfo.axles === 5) {
                    multiplier = 3.0; // Trailer
                } else if (vehicleInfo.axles === 6) {
                    multiplier = 3.5;
                } else if (vehicleInfo.axles > 6) {
                    multiplier = 4.0; // Full / Tren
                }
            }
        }

        const adjustedTolls = totalTolls * multiplier;

        return NextResponse.json({
            tolls: adjustedTolls,
            distanceMeters: route?.distanceMeters,
            duration: route?.duration,
            rawTolls: totalTolls,
            multiplier,
            raw: route // Optional: for debugging
        });

    } catch (error) {
        console.error('Server error calculating tolls:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
