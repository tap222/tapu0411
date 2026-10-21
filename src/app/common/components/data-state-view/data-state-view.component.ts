import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-data-state-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="state-container">
      <!-- 1. LOADING STATE -->
      @if (isLoading()) {
        <div class="state-container__loading" role="status" aria-live="polite">
          <ng-content select="[loadingState]">
            <div class="state-container__default-spinner">
              <div class="spinner"></div>
              <p>Loading data...</p>
            </div>
          </ng-content>
        </div>
      }
      <!-- 2. ERROR STATE -->
      @else if (error()) {
        <div class="state-container__error" role="alert">
          <div class="error-box">
            <div class="error-box__icon">⚠️</div>
            <h3 class="error-box__title">Something went wrong</h3>
            <p class="error-box__message">{{ error() }}</p>
            <button type="button" class="error-box__retry-btn" (click)="retry.emit()">
              <img src="assets/icons/ic_refresh.svg" width="16" height="16" alt="" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      }
      <!-- 3. EMPTY STATE -->
      @else if (isEmpty()) {
        <div class="state-container__empty">
          <ng-content select="[emptyState]">
            <div class="empty-box">
              <div class="empty-box__icon">🔍</div>
              <h3 class="empty-box__title">{{ emptyTitle() }}</h3>
              <p class="empty-box__message">{{ emptyMessage() }}</p>
            </div>
          </ng-content>
        </div>
      }
      <!-- 4. SUCCESS STATE -->
      @else {
        <ng-content></ng-content>
      }
    </div>
  `,
  styles: [`
    .state-container {
      width: 100%;
      min-height: 120px;
      display: flex;
      flex-direction: column;

      &__loading, &__error, &__empty {
        padding: 32px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }

      &__default-spinner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        color: var(--color-text-muted, #9aa0a6);

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.15);
          border-top-color: var(--color-primary, #007acc);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      }
    }

    .error-box, .empty-box {
      text-align: center;
      max-width: 400px;
      padding: 24px;
      background: var(--color-surface-2, #1e2121);
      border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
      border-radius: 8px;

      &__icon {
        font-size: 2.2rem;
        margin-bottom: 8px;
      }
      &__title {
        margin: 0 0 8px;
        font-size: 1.1rem;
        font-weight: 600;
        color: #fff;
      }
      &__message {
        margin: 0 0 16px;
        font-size: 0.9rem;
        color: var(--color-text-muted, #9aa0a6);
      }
      &__retry-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 18px;
        background: var(--color-primary, #007acc);
        color: #fff;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: var(--color-primary-hover, #0062a3);
        }
        img {
          filter: brightness(0) invert(1);
        }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataStateViewComponent {
  readonly isLoading = input<boolean>(false);
  readonly isEmpty = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly emptyTitle = input<string>('No results found');
  readonly emptyMessage = input<string>('Try adjusting your search query or filters.');

  readonly retry = output<void>();
}
