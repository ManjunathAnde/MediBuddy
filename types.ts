
export enum AuthMode {
  SIGN_IN = 'SIGN_IN',
  SIGN_UP = 'SIGN_UP',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD'
}

export interface User {
  name: string;
  email: string;
  uid?: string;
  photoURL?: string;
}

export interface DoctorInfo {
  name: string;
  email: string;
  phone: string;
  specialty?: string;
}

export interface PharmacistInfo {
  name: string;
  email: string;
  phone?: string;
  pharmacyName: string;
}

export interface Prescription {
  id: string;
  prescriptionURL: string;
  doctorName: string;
  prescriptionDate: any; // Timestamp or Date
  notes?: string;
  medicationsListed?: string[];
  uploadedAt: any;
}

export interface UserProfile extends User {
  doctorInfo?: DoctorInfo;
  pharmacistInfo?: PharmacistInfo;
  createdAt?: any;
}

export interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  general?: string;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeSlot {
  id: TimeOfDay;
  label: string;
  defaultTime: string; // e.g., "08:00"
  enabled: boolean;
  customTime?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  // Firestore stores times as string array ["09:00", "20:00"]
  // UI needs TimeSlots. We map between them.
  times: string[]; 
  timeSlots: TimeSlot[]; // Helper for UI, derived from times
  specialInstructions: string; // Changed from instructions to match schema
  stock: number; // mapped to 'stockcount' in DB
  lowStockThreshold: number; // mapped to 'alertThreshhold' in DB
  prescribedBy?: string;
}

export interface MedicationLog {
  id: string;
  medicationID: string;
  medicationName: string;
  scheduledTime: string;
  actualTime: string;
  taken: boolean;
  skipped: boolean;
  date: string;
  timestamp: any;
}

// Local state for fast lookup: "medId_timeOfDay" -> string (Log ID)
// We store the ID so we can delete it if unchecked
export interface Logbook {
  [key: string]: string;
}

export type ScreenView = 'home' | 'medications' | 'calendar' | 'learn' | 'profile' | 'prescriptions' | 'alerts';
