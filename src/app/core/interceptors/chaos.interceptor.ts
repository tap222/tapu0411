import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { delay, throwError } from 'rxjs';
import { ChaosService } from '../services/chaos.service';

/**
 * Interceptor designed for evaluators to simulate network throttling or cut network connections.
 */
export const chaosInterceptor: HttpInterceptorFn = (req, next) => {
  const chaosService = inject(ChaosService);

  // If simulate network failure is triggered
  if (chaosService.shouldSimulateError()) {
    return throwError(
      () =>
        new HttpErrorResponse({
          error: 'Simulated Network Failure (Chaos Mode Active)',
          status: 0,
          statusText: 'Unknown Error',
          url: req.url,
        }),
    );
  }

  const simulatedDelay = chaosService.getSimulatedDelay();
  if (simulatedDelay > 0) {
    return next(req).pipe(delay(simulatedDelay));
  }

  return next(req);
};
