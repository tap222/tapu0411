export interface AuthenticatedUser {
  userId: number;
  username: string;
  email: string;
  region: string;
  avatar_url?: string;
}

export type AuthErrorType = 'InvalidCredentials' | 'NetworkError' | 'UnknownError';

export interface AuthError {
  type: AuthErrorType;
  message: string;
}
