export type Role = "admin" | "barber";

export interface AppUser {
  uid: string;
  email: string;
  role: Role;
  displayName?: string;
  createdAt?: number;
  disabled?: boolean;
}

export interface SchoolClass {
  id: string;
  name: string;
  createdAt: number;
}

export interface Student {
  id: string;
  fullName: string;
  className: string;
  secretCode: string;
  photoURL?: string;
  paymentAmount: number;
  paymentDate?: number;
  remainingCuts: number;
  totalCutsUsed: number;
  paid: boolean;
  createdAt: number;
}

export interface Shaving {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  barberId: string;
  barberName: string;
  pricePerShave: number;
  createdAt: number;
}

export interface Settings {
  haircutPrice: number; // RWF per shave (barber earning)
  termPayment: number; // RWF per term (student pays)
  allowedCutsPerTerm: number;
}
