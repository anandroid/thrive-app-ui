/**
 * Session tracking utilities for managing app sessions
 * Used to ensure notification prompts appear in different sessions
 */

export const SessionTracking = {
  /**
   * Initialize session tracking
   * Should be called when the app starts (e.g., in layout or app initialization)
   */
  initializeSession: () => {
    if (typeof window === 'undefined') return;
    
    // Check if we already have a session ID
    const existingSessionId = sessionStorage.getItem('sessionId');
    
    if (!existingSessionId) {
      // Generate a new session ID
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', newSessionId);
      
      // Track session start time
      sessionStorage.setItem('sessionStartTime', Date.now().toString());
    }
  },
  
  /**
   * Get the current session ID
   */
  getCurrentSessionId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('sessionId');
  },
  
  /**
   * Check if this is a new session compared to the last notification ask
   */
  isNewSessionSinceLastAsk: (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const currentSession = sessionStorage.getItem('sessionId');
    const lastAskSession = localStorage.getItem('notificationLastAskSession');
    
    return currentSession !== lastAskSession;
  },
  
  /**
   * Get session duration in milliseconds
   */
  getSessionDuration: (): number => {
    if (typeof window === 'undefined') return 0;
    
    const startTime = sessionStorage.getItem('sessionStartTime');
    if (!startTime) return 0;
    
    return Date.now() - parseInt(startTime);
  }
};