export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  licenseValidUntil?: string;
}

export interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  status: string;
  mileage: number | string;
  nextInspection?: string;
  nextInsurance?: string;
  nextService?: string;
  notes?: string;
}

export interface Reservation {
  id: number;
  vehicleId: number;
  userId: number;
  startAt: string;
  endAt: string;
  purpose?: string;
  destination?: string;
  status: string;
  notes?: string;
  plate?: string;
  brand?: string;
  model?: string;
  driverName?: string;
  startMileage?: number;
  endMileage?: number;
  pickupAt?: string;
  dropoffAt?: string;
  fuelStart?: string;
  fuelEnd?: string;
}

