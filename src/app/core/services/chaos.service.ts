import { Injectable, signal } from '@angular/core';

export type ChaosMode = 'none' | 'simulate-error' | 'simulate-slow';

@Injectable({ providedIn: 'root' })
export class ChaosService {
  readonly mode = signal<ChaosMode>('none');

  setMode(mode: ChaosMode): void {
    this.mode.set(mode);
  }

  shouldSimulateError(): boolean {
    return this.mode() === 'simulate-error';
  }

  getSimulatedDelay(): number {
    return this.mode() === 'simulate-slow' ? 2500 : 0;
  }
}
