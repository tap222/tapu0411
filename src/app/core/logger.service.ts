import { Injectable } from '@angular/core';

/**
 * Structured application logger conforming to DEVELOPER_GUIDE.md
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  info(message: string, context?: Record<string, unknown>): void {
    console.info(`[INFO] ${message}`, context ? JSON.stringify(context) : '');
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : '');
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, context ?? '');
  }

  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`[DEBUG] ${message}`, context ? JSON.stringify(context) : '');
  }
}
