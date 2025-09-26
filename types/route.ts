// Type definitions for the Drop Flow delivery route system

export interface ProofOfDelivery {
  timestamp: string;
  note?: string;
  photoUri?: string;
}

export interface Stop {
  id: string;
  label: string;
  rawAddress: string;
  notes?: string;
  status: 'pending' | 'done' | 'skipped';
  geo?: {
    lat: number;
    lng: number;
  };
  coordinate: {
    latitude: number;
    longitude: number;
  };
  pod?: ProofOfDelivery;
}

export interface RouteOptimization {
  orderedStops: Stop[];
  decodedPolyline: { latitude: number; longitude: number }[];
  totalDistance: number; // in meters
  totalDuration: number; // in seconds
}

export interface VehicleProfile {
  lPer100: number; // Liters per 100km
  fuelPrice: number; // Price per liter
}

export interface OptimizationOptions {
  vehicle: VehicleProfile;
}
