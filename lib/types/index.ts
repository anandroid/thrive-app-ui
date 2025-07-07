// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'practitioner' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Service types
export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: ServiceCategory;
  practitionerId: string;
}

export type ServiceCategory = 
  | 'massage'
  | 'acupuncture'
  | 'reiki'
  | 'meditation'
  | 'yoga'
  | 'counseling'
  | 'nutrition'
  | 'herbalism';

// Appointment types
export interface Appointment {
  id: string;
  userId: string;
  practitionerId: string;
  serviceId: string;
  date: Date;
  status: AppointmentStatus;
  notes?: string;
}

export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

// Practitioner types
export interface Practitioner extends User {
  bio: string;
  specialties: ServiceCategory[];
  certifications: Certification[];
  availability: AvailabilitySlot[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: Date;
}

export interface AvailabilitySlot {
  dayOfWeek: number; // 0-6 (Sunday to Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}