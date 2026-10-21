import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" (click)="notificationService.dismiss(toast.id)">
          <span class="toast__icon">
            @switch (toast.type) {
              @case ('success') { ✓ }
              @case ('error') { ✕ }
              @case ('warning') { ⚠ }
              @default { ℹ }
            }
          </span>
          <span class="toast__message">{{ toast.message }}</span>
          <button type="button" class="toast__close" aria-label="Dismiss">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 420px;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      border-radius: 8px;
      background: var(--color-surface-2, #1e2121);
      color: #fff;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      border-left: 4px solid var(--color-primary, #007acc);
      cursor: pointer;
      font-size: 0.875rem;
      animation: slideIn 0.25s ease-out;

      &--success {
        border-left-color: var(--color-success, #28a745);
        .toast__icon { color: var(--color-success, #28a745); }
      }
      &--error {
        border-left-color: var(--color-danger, #dc3545);
        .toast__icon { color: var(--color-danger, #dc3545); }
      }
      &--warning {
        border-left-color: var(--color-warning, #ffc107);
        .toast__icon { color: var(--color-warning, #ffc107); }
      }
      &--info {
        border-left-color: var(--color-primary, #007acc);
        .toast__icon { color: var(--color-primary, #007acc); }
      }

      &__icon {
        font-weight: bold;
        font-size: 1rem;
      }
      &__message {
        flex: 1;
        line-height: 1.4;
      }
      &__close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0 4px;
        &:hover { color: #fff; }
      }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly notificationService = inject(NotificationService);
}
