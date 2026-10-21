import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, defer, map, of, tap, throwError } from 'rxjs';
import { AuthenticatedUser } from '../models/auth.model';
import { CacheService } from '../../../common/services/cache.service';
import { CACHE_KEYS } from '../../../common/constants/common.constants';
import { environment } from '../../../../environments/environment';

interface LoginGraphQLResponse {
  data?: {
    login: {
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        region: string;
        avatar_url?: string;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isSignedIn = signal(false);
  readonly currentUser = signal<AuthenticatedUser | null>(null);
  readonly errorMessage = signal<string | null>(null);

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cacheService = inject(CacheService);

  constructor() {
    this.restoreSession();
  }

  /**
   * Restores user session from storage on application startup.
   */
  private restoreSession(): void {
    const token = this.cacheService.get<string>(CACHE_KEYS.AUTH_TOKEN, 'local');
    const user = this.cacheService.get<AuthenticatedUser>(CACHE_KEYS.AUTH_USER, 'local');

    if (token && user) {
      this.currentUser.set(user);
      this.isSignedIn.set(true);
    }
  }

  /**
   * Retrieves the current access token.
   */
  getAccessToken(): string | null {
    return this.cacheService.get<string>(CACHE_KEYS.AUTH_TOKEN, 'local');
  }

  /**
   * Authenticates user via GraphQL login mutation on the backend microservice.
   *
   * @param email User email
   * @param password Password
   */
  signInWithEmailAndPassword$(email: string, password: string): Observable<void> {
    this.errorMessage.set(null);

    const mutation = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
          user {
            id
            name
            email
            region
            avatar_url
          }
        }
      }
    `;

    return this.http
      .post<LoginGraphQLResponse>(environment.backendGraphqlUrl, {
        query: mutation,
        variables: { email, password },
      })
      .pipe(
        map((res) => {
          if (res.errors && res.errors.length > 0) {
            throw new Error(res.errors[0].message || 'Authentication failed');
          }
          if (!res.data?.login) {
            throw new Error('Invalid response from authentication server.');
          }
          return res.data.login;
        }),
        tap((authData) => {
          const user: AuthenticatedUser = {
            userId: Number(authData.user.id),
            username: authData.user.name,
            email: authData.user.email,
            region: authData.user.region,
            avatar_url: authData.user.avatar_url,
          };

          this.cacheService.set(CACHE_KEYS.AUTH_TOKEN, authData.token, 'local');
          this.cacheService.set(CACHE_KEYS.AUTH_USER, user, 'local');

          this.currentUser.set(user);
          this.isSignedIn.set(true);
        }),
        map(() => undefined),
        catchError((error: unknown) => {
          const msg = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
          this.errorMessage.set(msg);
          return throwError(() => new Error(msg));
        }),
      );
  }

  /**
   * Terminates active session and clears storage.
   */
  signOut$(): Observable<void> {
    this.errorMessage.set(null);
    return defer(() => {
      this.clearAuthState();
      void this.router.navigateByUrl('/auth/login');
      return of(undefined);
    });
  }

  /**
   * Consumes and clears any pending error message.
   */
  consumeErrorMessage(): string | null {
    const message = this.errorMessage();
    this.errorMessage.set(null);
    return message;
  }

  private clearAuthState(): void {
    this.cacheService.remove(CACHE_KEYS.AUTH_TOKEN, 'local');
    this.cacheService.remove(CACHE_KEYS.AUTH_USER, 'local');
    this.isSignedIn.set(false);
    this.currentUser.set(null);
  }
}
