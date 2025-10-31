/**
 * Security Event Logging and Monitoring
 * OWASP LLM01:2025 Compliant - Testing and Monitoring
 *
 * Centralized security event logging for tracking, monitoring,
 * and responding to potential security threats including prompt
 * injection attempts and other suspicious activities.
 *
 * @module securityLogger
 */

export type SecurityEventType =
  | 'injection_detected'
  | 'injection_blocked'
  | 'validation_failed'
  | 'rate_limit_exceeded'
  | 'suspicious_output'
  | 'system_prompt_leak_attempt'
  | 'file_upload_rejected'
  | 'multimodal_injection'
  | 'context_manipulation'
  | 'encoding_attack';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEventDetails {
  inputSample: string; // First 200 chars of input
  detectionCategory?: string;
  confidence?: number; // 0-1 scale
  blocked: boolean;
  apiEndpoint: string;
  matchedPatterns?: string[];
  sanitizationApplied?: boolean;
  userAgent?: string;
  additionalInfo?: Record<string, unknown>;
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  sessionId: string;
  details: SecurityEventDetails;
}

export interface SecurityStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  blockedEvents: number;
  topCategories: Array<{ category: string; count: number }>;
  recentEvents: SecurityEvent[];
}

/**
 * Security Logger Class
 * Singleton pattern for centralized logging
 */
export class SecurityLogger {
  private static instance: SecurityLogger;
  private events: SecurityEvent[] = [];
  private maxEvents: number = 1000; // Keep last 1000 events
  private listeners: Map<string, (event: SecurityEvent) => void> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Log a security event
   */
  public logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    // Add to events array
    this.events.push(fullEvent);

    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events.shift(); // Remove oldest event
    }

    // Console logging for development
    this.logToConsole(fullEvent);

    // Notify listeners
    this.notifyListeners(fullEvent);

    // Report critical/high severity events
    if (fullEvent.severity === 'critical' || fullEvent.severity === 'high') {
      this.reportHighSeverityEvent(fullEvent);
    }

    // Persist to storage (optional)
    if (this.shouldPersist(fullEvent)) {
      this.persistEvent(fullEvent);
    }
  }

  /**
   * Log to browser console with appropriate styling
   */
  private logToConsole(event: SecurityEvent): void {
    const severityColors = {
      low: 'color: #3b82f6', // blue
      medium: 'color: #f59e0b', // orange
      high: 'color: #ef4444', // red
      critical: 'color: #dc2626; font-weight: bold', // dark red, bold
    };

    const style = severityColors[event.severity];
    const timestamp = event.timestamp.toISOString();

    console.log(
      `%c[SECURITY ${event.severity.toUpperCase()}] ${timestamp}`,
      style,
    );
    console.log(`  Event: ${event.eventType}`);
    console.log(`  Session: ${event.sessionId}`);
    console.log(`  Details:`, event.details);

    if (event.severity === 'critical') {
      console.error('🚨 CRITICAL SECURITY EVENT:', event);
    }
  }

  /**
   * Get all events, optionally filtered
   */
  public getEvents(filter?: Partial<SecurityEvent>): SecurityEvent[] {
    if (!filter) {
      return [...this.events];
    }

    return this.events.filter((event) =>
      Object.entries(filter).every(([key, value]) => {
        const eventValue = event[key as keyof SecurityEvent];
        return eventValue === value;
      }),
    );
  }

  /**
   * Get events by time range
   */
  public getEventsByTimeRange(startTime: Date, endTime: Date): SecurityEvent[] {
    return this.events.filter(
      (event) => event.timestamp >= startTime && event.timestamp <= endTime,
    );
  }

  /**
   * Get events by severity
   */
  public getEventsBySeverity(severity: SecuritySeverity): SecurityEvent[] {
    return this.events.filter((event) => event.severity === severity);
  }

  /**
   * Get events by type
   */
  public getEventsByType(eventType: SecurityEventType): SecurityEvent[] {
    return this.events.filter((event) => event.eventType === eventType);
  }

  /**
   * Get recent events (last N)
   */
  public getRecentEvents(count: number = 10): SecurityEvent[] {
    return this.events.slice(-count).reverse();
  }

  /**
   * Get statistics about security events
   */
  public getStats(): SecurityStats {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    let blockedEvents = 0;

    for (const event of this.events) {
      // Count by type
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;

      // Count by severity
      eventsBySeverity[event.severity] =
        (eventsBySeverity[event.severity] || 0) + 1;

      // Count blocked events
      if (event.details.blocked) {
        blockedEvents++;
      }

      // Count by category
      if (event.details.detectionCategory) {
        categoryCounts[event.details.detectionCategory] =
          (categoryCounts[event.details.detectionCategory] || 0) + 1;
      }
    }

    // Get top categories
    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      blockedEvents,
      topCategories,
      recentEvents: this.getRecentEvents(5),
    };
  }

  /**
   * Clear all events (for testing or privacy)
   */
  public clearEvents(): void {
    this.events = [];
    console.log('[SECURITY] All events cleared');
  }

  /**
   * Export events as JSON
   */
  public exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Import events from JSON
   */
  public importEvents(json: string): void {
    try {
      const imported = JSON.parse(json);
      if (Array.isArray(imported)) {
        this.events = imported.map((e) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
        console.log(`[SECURITY] Imported ${this.events.length} events`);
      }
    } catch (error) {
      console.error('[SECURITY] Failed to import events:', error);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if event should be persisted
   */
  private shouldPersist(event: SecurityEvent): boolean {
    // Persist high and critical severity events
    return event.severity === 'high' || event.severity === 'critical';
  }

  /**
   * Persist event to localStorage
   */
  private persistEvent(event: SecurityEvent): void {
    try {
      const key = `security_event_${event.id}`;
      localStorage.setItem(key, JSON.stringify(event));

      // Clean up old persisted events (keep last 100)
      this.cleanupPersistedEvents();
    } catch (error) {
      console.warn('[SECURITY] Failed to persist event:', error);
    }
  }

  /**
   * Clean up old persisted events
   */
  private cleanupPersistedEvents(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith('security_event_'),
      );

      if (keys.length > 100) {
        // Remove oldest events
        keys
          .slice(0, keys.length - 100)
          .forEach((key) => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('[SECURITY] Failed to cleanup persisted events:', error);
    }
  }

  /**
   * Report high severity events
   */
  private reportHighSeverityEvent(event: SecurityEvent): void {
    // This is where you'd integrate with external monitoring services
    // Examples: Sentry, Datadog, custom endpoint, etc.

    // For now, just log to console
    console.warn(
      `[SECURITY ALERT] High severity event: ${event.eventType}`,
      event,
    );

    // Example integration points:
    // - Send to Sentry: Sentry.captureException(...)
    // - Send to custom endpoint: fetch('/api/security-events', {...})
    // - Send to analytics: analytics.track('security_event', {...})
  }

  /**
   * Add event listener
   */
  public addEventListener(
    id: string,
    callback: (event: SecurityEvent) => void,
  ): void {
    this.listeners.set(id, callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Notify all listeners of new event
   */
  private notifyListeners(event: SecurityEvent): void {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[SECURITY] Listener error:', error);
      }
    });
  }
}

/**
 * Singleton instance export
 */
export const securityLogger = SecurityLogger.getInstance();

/**
 * Convenience functions for common logging scenarios
 */

export function logInjectionDetected(
  sessionId: string,
  input: string,
  category: string,
  confidence: number,
  blocked: boolean,
  apiEndpoint: string,
): void {
  securityLogger.logEvent({
    eventType: blocked ? 'injection_blocked' : 'injection_detected',
    severity:
      confidence > 0.8 ? 'critical' : confidence > 0.5 ? 'high' : 'medium',
    sessionId,
    details: {
      inputSample: input.substring(0, 200),
      detectionCategory: category,
      confidence,
      blocked,
      apiEndpoint,
    },
  });
}

export function logValidationFailed(
  sessionId: string,
  input: string,
  reason: string,
  apiEndpoint: string,
): void {
  securityLogger.logEvent({
    eventType: 'validation_failed',
    severity: 'medium',
    sessionId,
    details: {
      inputSample: input.substring(0, 200),
      blocked: true,
      apiEndpoint,
      additionalInfo: { reason },
    },
  });
}

export function logRateLimitExceeded(
  sessionId: string,
  apiEndpoint: string,
  userId?: string,
): void {
  securityLogger.logEvent({
    eventType: 'rate_limit_exceeded',
    severity: 'medium',
    sessionId,
    userId,
    details: {
      inputSample: '',
      blocked: true,
      apiEndpoint,
    },
  });
}

export function logSuspiciousOutput(
  sessionId: string,
  output: string,
  reason: string,
  apiEndpoint: string,
): void {
  if (!output || output.length === 0) return;
  securityLogger.logEvent({
    eventType: 'suspicious_output',
    severity: 'high',
    sessionId,
    details: {
      inputSample: output.substring(0, 200),
      blocked: false,
      apiEndpoint,
      additionalInfo: { reason },
    },
  });
}

export function logFileUploadRejected(
  sessionId: string,
  fileName: string,
  reason: string,
  apiEndpoint: string,
): void {
  securityLogger.logEvent({
    eventType: 'file_upload_rejected',
    severity: 'medium',
    sessionId,
    details: {
      inputSample: `File: ${fileName}`,
      blocked: true,
      apiEndpoint,
      additionalInfo: { reason },
    },
  });
}

/**
 * Get current session ID (generate if not exists)
 */
export function getSessionId(): string {
  const key = 'security_session_id';
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

/**
 * Security dashboard hook for React components
 */
export function useSecurityStats() {
  return securityLogger.getStats();
}

/**
 * Export for use in security dashboard
 */
export function getSecurityDashboardData() {
  const stats = securityLogger.getStats();
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentEvents = securityLogger.getEventsByTimeRange(
    last24Hours,
    new Date(),
  );

  return {
    stats,
    recentEvents,
    criticalEvents: securityLogger.getEventsBySeverity('critical'),
    highSeverityEvents: securityLogger.getEventsBySeverity('high'),
  };
}
