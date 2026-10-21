import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChaosService, ChaosMode } from '../../../core/services/chaos.service';

@Component({
  selector: 'app-chaos-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chaos-pill" [class.chaos-pill--active]="chaosService.mode() !== 'none'">
      <span class="chaos-pill__label">Evaluator Network Sim:</span>
      <select
        [value]="chaosService.mode()"
        (change)="onModeChange($event)"
        class="chaos-pill__select"
        title="Toggle simulated network conditions to test UI States & Error Handling"
      >
        <option value="none">🟢 Online (Normal)</option>
        <option value="simulate-slow">🟡 Slow 3G Latency</option>
        <option value="simulate-error">🔴 Network Offline / Error</option>
      </select>
    </div>
  `,
  styles: [`
    .chaos-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 0.75rem;

      &--active {
        border-color: var(--color-warning, #ffc107);
        background: rgba(255, 193, 7, 0.15);
      }

      &__label {
        font-weight: 600;
        color: var(--color-text-muted, #9aa0a6);
      }

      &__select {
        background: var(--color-surface-2, #1e2121);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 3px 6px;
        font-size: 0.75rem;
        cursor: pointer;
        outline: none;

        &:focus {
          border-color: var(--color-primary, #007acc);
        }
      }

      @media (max-width: 600px) {
        padding: 3px 6px;
        &__label { display: none; }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChaosToggleComponent {
  readonly chaosService = inject(ChaosService);

  onModeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ChaosMode;
    this.chaosService.setMode(value);
  }
}
