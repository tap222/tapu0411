// Cache configuration per DEVELOPER_GUIDE.md
export const IMAGE_CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
export const IMAGE_CACHE_MAX_RETRIES = 3;
export const IMAGE_CACHE_RETRY_DELAY_MS = 1000;

// API configuration
export const API_REQUEST_TIMEOUT_MS = 30 * 1000; // 30 seconds
export const API_MAX_PAGE_SIZE = 100;

// Pagination & Virtual scroll defaults
export const DEFAULT_PAGE_SIZE = 25;

// Cache keys
export const CACHE_KEYS = {
  POKEMON_LIST: 'pokedex_pokemon_list_cache',
  AUTH_TOKEN: 'pokedex_auth_token',
  AUTH_USER: 'pokedex_auth_user',
  ACTIVE_TEAM: 'pokedex_active_team',
} as const;
