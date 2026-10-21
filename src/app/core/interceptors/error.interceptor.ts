import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { LoggerService } from '../logger.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      let displayMessage = 'An unexpected error occurred. Please check your network connection.';

      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          displayMessage = 'Network connection failed. Please verify your connection.';
        } else if (error.status === 401) {
          displayMessage = 'Session expired or unauthenticated. Please sign in.';
        } else if (error.status === 403) {
          displayMessage = 'Access denied.';
        } else if (error.status >= 500) {
          displayMessage = 'Server is temporarily unavailable. Please retry shortly.';
        } else if (error.error?.message) {
          displayMessage = error.error.message;
        }
      }

      logger.error('HTTP Request failed', { url: req.url, error });
      return throwError(() => new Error(displayMessage));
    }),
  );
};
