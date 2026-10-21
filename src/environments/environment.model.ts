export interface Environment {
  production: boolean;
  pokeApiGraphqlUrl: string;
  backendGraphqlUrl: string;
  cacheTtlMs: number;
  requestTimeoutMs: number;
  imageCacheDurationMs: number;
  imageCacheMaxRetries: number;
  imageCacheRetryDelayMs: number;
  defaultPageSize: number;
}
