import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ChaosToggleComponent } from '../chaos-toggle/chaos-toggle.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ChaosToggleComponent],
  template: `
    <header class="app-header">
      <div class="app-header__left">
        <a routerLink="/pokedex" class="app-header__brand">
          <span class="pokeball-icon"></span>
          <span class="brand-text">Mini<strong>Pokédex</strong></span>
        </a>

        <nav class="app-header__nav">
          <a routerLink="/pokedex" routerLinkActive="active" class="nav-link">Catalog</a>
          <a routerLink="/teams" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">Teams</a>
          <a routerLink="/teams/new" routerLinkActive="active" class="nav-link nav-link--highlight">+ Build Team</a>
        </nav>
      </div>

      <div class="app-header__right">
        <!-- Evaluator Chaos Simulator -->
        <app-chaos-toggle />

        <!-- User Profile / Auth State -->
        @if (authService.isSignedIn()) {
          <div class="user-badge">
            <span class="user-badge__name">👤 {{ authService.currentUser()?.username }}</span>
            <span class="user-badge__region">({{ authService.currentUser()?.region }})</span>
            <button type="button" class="logout-btn" (click)="onLogout()" title="Sign out">
              Logout
            </button>
          </div>
        } @else {
          <a routerLink="/auth/login" class="login-btn">
            Sign In
          </a>
        }
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      height: 64px;
      background: var(--color-surface-2, #1e2121);
      border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 1000;

      &__left, &__right {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      &__brand {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        color: #fff;
        font-size: 1.25rem;
        font-weight: 500;

        strong {
          color: #ff3e3e;
        }

        .pokeball-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(to bottom, #f00 50%, #fff 50%);
          border: 2px solid #222;
          position: relative;
          display: inline-block;

          &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background: #fff;
            border: 2px solid #222;
            border-radius: 50%;
          }
        }
      }

      &__nav {
        display: flex;
        align-items: center;
        gap: 8px;

        .nav-link {
          padding: 6px 14px;
          border-radius: 6px;
          color: var(--color-text-muted, #9aa0a6);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;

          &:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.05);
          }

          &.active {
            color: #fff;
            background: rgba(0, 122, 204, 0.2);
            border: 1px solid rgba(0, 122, 204, 0.4);
          }

          &--highlight {
            color: var(--color-accent, #ffb414);
            font-weight: 600;
            &:hover {
              color: #ffc107;
            }
          }
        }
      }
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #fff;

      &__region {
        color: var(--color-text-muted, #9aa0a6);
        font-size: 0.75rem;
      }
    }

    .logout-btn, .login-btn {
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }

    .logout-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: var(--color-text-muted, #9aa0a6);
      &:hover {
        background: rgba(220, 53, 69, 0.2);
        color: #ff6b6b;
        border-color: #ff6b6b;
      }
    }

    .login-btn {
      background: var(--color-primary, #007acc);
      border: none;
      color: #fff;
      &:hover {
        background: var(--color-primary-hover, #0062a3);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly authService = inject(AuthService);

  onLogout(): void {
    this.authService.signOut$().subscribe();
  }
}
