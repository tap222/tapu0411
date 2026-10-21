import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, catchError, finalize, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/services/auth.service';

/**
 * Authentication login page component implemented per DEVELOPER_GUIDE.md Section 4.
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  readonly minPasswordLength = 8;

  // Local form template state
  email = 'ash@pokemon.com';
  password = 'pikachu123';

  // Reactive state (signals) per Developer Guide
  readonly isSubmitting = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hasSubmitted = signal(false);

  // Command stream for form submission
  private readonly submitRequests$ = new Subject<void>();
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Observable-to-Signal conversion for submission side effects
  private readonly submitAction = toSignal(
    this.submitRequests$.pipe(
      switchMap(() => {
        this.errorMessage.set(null);
        this.isSubmitting.set(true);
        return this.authService.signInWithEmailAndPassword$(this.email.trim(), this.password).pipe(
          switchMap(() => this.router.navigateByUrl('/pokedex')),
          map(() => null),
          catchError((error: unknown) => {
            this.errorMessage.set(this.formatAuthError(error));
            return of(null);
          }),
          finalize(() => this.isSubmitting.set(false)),
        );
      }),
    ),
    { initialValue: null },
  );

  ngOnInit(): void {
    const savedMessage = this.authService.consumeErrorMessage();
    if (savedMessage) {
      this.errorMessage.set(savedMessage);
    }
  }

  onSubmit(form: NgForm): void {
    if (this.isSubmitting()) return;
    this.hasSubmitted.set(true);
    if (!form.valid) {
      this.errorMessage.set('Please check your email and password.');
      return;
    }
    this.submitRequests$.next();
  }

  private formatAuthError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'Authentication failed. Please verify credentials.';
  }
}
