/**
 * Consultation storage utilities for managing expert consultation records
 */

export interface ConsultationRecord {
  consultationId: string;
  bookingId?: string;
  threadId: string;
  thrivingId?: string;
  userConcerns: string[];
  expertName?: string;
  scheduledAt: string;
  completedAt?: string;
  summary?: string;
  recommendations?: string[];
  nextSteps?: string[];
  followUpDate?: string;
  videoRecordingUrl?: string;
}

export interface ConsultationContext {
  threadId?: string;
  messageId?: string;
  thrivingId?: string;
  thrivingTitle?: string;
  daysSinceCreated?: number;
  originThreadId?: string;
  userConcerns?: string[];
  relatedRoutines?: string[];
  requestType?: 'chat_request' | 'thriving_help';
  timestamp: string;
}

const CONSULTATIONS_KEY = 'thrive_consultations';
const CONSULTATION_CONTEXT_KEY = 'thrive_consultation_context';

/**
 * Generate a unique consultation ID
 */
export const generateConsultationId = (): string => {
  return `cons_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Store consultation context before booking
 */
export const storeConsultationContext = (context: ConsultationContext): void => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(CONSULTATION_CONTEXT_KEY, JSON.stringify(context));
  } catch (error) {
    console.error('Error storing consultation context:', error);
  }
};

/**
 * Get stored consultation context
 */
export const getConsultationContext = (): ConsultationContext | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem(CONSULTATION_CONTEXT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting consultation context:', error);
    return null;
  }
};

/**
 * Clear consultation context
 */
export const clearConsultationContext = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(CONSULTATION_CONTEXT_KEY);
  } catch (error) {
    console.error('Error clearing consultation context:', error);
  }
};

/**
 * Store a new consultation record
 */
export const storeConsultationRecord = (record: Partial<ConsultationRecord>): ConsultationRecord => {
  if (typeof window === 'undefined') {
    throw new Error('Cannot store consultation record on server side');
  }
  
  const fullRecord: ConsultationRecord = {
    consultationId: record.consultationId || generateConsultationId(),
    threadId: record.threadId || '',
    userConcerns: record.userConcerns || [],
    scheduledAt: record.scheduledAt || new Date().toISOString(),
    ...record
  };
  
  const records = getConsultationRecords();
  records.push(fullRecord);
  
  try {
    localStorage.setItem(CONSULTATIONS_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Error storing consultation record:', error);
  }
  
  return fullRecord;
};

/**
 * Get all consultation records
 */
export const getConsultationRecords = (): ConsultationRecord[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CONSULTATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting consultation records:', error);
    return [];
  }
};

/**
 * Get consultation record by ID
 */
export const getConsultationById = (consultationId: string): ConsultationRecord | null => {
  const records = getConsultationRecords();
  return records.find(record => record.consultationId === consultationId) || null;
};

/**
 * Update a consultation record
 */
export const updateConsultationRecord = (
  consultationId: string, 
  updates: Partial<ConsultationRecord>
): ConsultationRecord | null => {
  const records = getConsultationRecords();
  const index = records.findIndex(record => record.consultationId === consultationId);
  
  if (index === -1) return null;
  
  records[index] = { ...records[index], ...updates };
  
  try {
    localStorage.setItem(CONSULTATIONS_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Error updating consultation record:', error);
  }
  
  return records[index];
};

/**
 * Get consultations for a specific thread
 */
export const getConsultationsByThreadId = (threadId: string): ConsultationRecord[] => {
  const records = getConsultationRecords();
  return records.filter(record => record.threadId === threadId);
};

/**
 * Get consultations for a specific thriving
 */
export const getConsultationsByThrivingId = (thrivingId: string): ConsultationRecord[] => {
  const records = getConsultationRecords();
  return records.filter(record => record.thrivingId === thrivingId);
};

/**
 * Mark consultation as completed
 */
export const markConsultationCompleted = (
  consultationId: string,
  completionData: {
    summary?: string;
    recommendations?: string[];
    nextSteps?: string[];
    followUpDate?: string;
    expertName?: string;
    videoRecordingUrl?: string;
  }
): ConsultationRecord | null => {
  return updateConsultationRecord(consultationId, {
    ...completionData,
    completedAt: new Date().toISOString()
  });
};

/**
 * Get pending consultations (scheduled but not completed)
 */
export const getPendingConsultations = (): ConsultationRecord[] => {
  const records = getConsultationRecords();
  return records.filter(record => !record.completedAt);
};

/**
 * Get completed consultations
 */
export const getCompletedConsultations = (): ConsultationRecord[] => {
  const records = getConsultationRecords();
  return records.filter(record => record.completedAt);
};

/**
 * Clear all consultation records (for testing/reset)
 */
export const clearAllConsultations = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CONSULTATIONS_KEY);
  } catch (error) {
    console.error('Error clearing consultations:', error);
  }
};