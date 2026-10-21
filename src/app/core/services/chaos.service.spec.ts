import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandlerFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, firstValueFrom } from 'rxjs';
import { ChaosService } from './chaos.service';
import { chaosInterceptor } from '../interceptors/chaos.interceptor';

describe('ChaosService & ChaosInterceptor (Evaluator Simulation)', () => {
  let chaosService: ChaosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChaosService],
    });
    chaosService = TestBed.inject(ChaosService);
  });

  it('should default to "none" mode with 0ms delay and no errors', () => {
    expect(chaosService.mode()).toBe('none');
    expect(chaosService.shouldSimulateError()).toBe(false);
    expect(chaosService.getSimulatedDelay()).toBe(0);
  });

  it('should properly configure simulated error state for evaluator testing', () => {
    chaosService.setMode('simulate-error');
    expect(chaosService.mode()).toBe('simulate-error');
    expect(chaosService.shouldSimulateError()).toBe(true);
    expect(chaosService.getSimulatedDelay()).toBe(0);
  });

  it('should configure simulated latency delay (2500ms) for shimmer skeleton evaluation', () => {
    chaosService.setMode('simulate-slow');
    expect(chaosService.mode()).toBe('simulate-slow');
    expect(chaosService.shouldSimulateError()).toBe(false);
    expect(chaosService.getSimulatedDelay()).toBe(2500);
  });

  it('chaosInterceptor should pass through requests normally when chaos mode is "none"', async () => {
    chaosService.setMode('none');
    const req = new HttpRequest('GET', '/api/test');
    const next: HttpHandlerFn = () => of(new HttpResponse({ status: 200, body: { ok: true } }));

    const res$ = TestBed.runInInjectionContext(() => chaosInterceptor(req, next));
    const response = (await firstValueFrom(res$)) as HttpResponse<{ ok: boolean }>;

    expect(response.status).toBe(200);
    expect(response.body?.ok).toBe(true);
  });

  it('chaosInterceptor should throw HttpErrorResponse with status 0 when "simulate-error" is active', async () => {
    chaosService.setMode('simulate-error');
    const req = new HttpRequest('GET', '/api/test');
    const next: HttpHandlerFn = () => of(new HttpResponse({ status: 200, body: {} }));

    let caughtError: HttpErrorResponse | null = null;
    try {
      const res$ = TestBed.runInInjectionContext(() => chaosInterceptor(req, next));
      await firstValueFrom(res$);
    } catch (err) {
      caughtError = err as HttpErrorResponse;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.status).toBe(0);
    expect(caughtError?.error).toBe('Simulated Network Failure (Chaos Mode Active)');
  });
});
