import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type StorageType = 'local' | 'session';

interface CacheEntry<T> {
  value: T;
  timestamp?: number;
  ttl?: number;
}

/**
 * Service for managing multi-tier in-app memory and persistent browser storage caching.
 * Implements patterns defined in DEVELOPER_GUIDE.md Section 5.
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
  /** In-memory cache map surviving navigation within session */
  public inAppCache: Record<string, { value: unknown; timestamp: number; ttl?: number }> = {};
  private readonly platformId = inject(PLATFORM_ID);

  private getStorage(storageType: StorageType): Storage | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return storageType === 'local' ? localStorage : sessionStorage;
  }

  /**
   * Retrieves an item from browser storage (localStorage or sessionStorage).
   * Validates TTL expiration if provided.
   *
   * @param key Storage lookup key
   * @param storageType Storage target ('local' or 'session')
   * @returns Cached value or null if expired/not found
   */
  get<T>(key: string, storageType: StorageType = 'local'): T | null {
    const storage = this.getStorage(storageType);
    if (!storage) return null;

    const cachedRaw = storage.getItem(key);
    if (cachedRaw) {
      try {
        const cached: CacheEntry<T> = JSON.parse(cachedRaw);
        if (cached.timestamp && cached.ttl && Date.now() - cached.timestamp > cached.ttl) {
          this.remove(key, storageType);
          return null;
        }
        return cached.value;
      } catch {
        this.remove(key, storageType);
      }
    }
    return null;
  }

  /**
   * Stores an item into browser storage with an optional TTL expiration in milliseconds.
   *
   * @param key Storage lookup key
   * @param value Value to cache
   * @param storageType Storage target ('local' or 'session')
   * @param ttl Optional expiration duration in milliseconds
   */
  set<T>(key: string, value: T, storageType: StorageType = 'local', ttl?: number): void {
    const storage = this.getStorage(storageType);
    if (!storage) return;

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    try {
      storage.setItem(key, JSON.stringify(entry));
    } catch {
      // Graceful fallback for quota exceeded or private browsing
    }
  }

  /**
   * Removes an item from browser storage.
   *
   * @param key Storage lookup key
   * @param storageType Storage target ('local' or 'session')
   */
  remove(key: string, storageType: StorageType = 'local'): void {
    const storage = this.getStorage(storageType);
    if (!storage) return;
    storage.removeItem(key);
  }

  /**
   * Retrieves an item from in-memory cache.
   *
   * @param key Lookup key
   * @returns Value or null if not found/expired
   */
  getInApp<T>(key: string): T | null {
    const entry = this.inAppCache[key];
    if (!entry) return null;

    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.removeInApp(key);
      return null;
    }
    return entry.value as T;
  }

  /**
   * Stores an item into in-memory cache.
   *
   * @param key Lookup key
   * @param value Value to cache
   * @param ttl Optional TTL in milliseconds
   */
  setInApp<T>(key: string, value: T, ttl?: number): void {
    this.inAppCache[key] = {
      value,
      timestamp: Date.now(),
      ttl,
    };
  }

  /**
   * Removes an item from in-memory cache.
   *
   * @param key Lookup key
   */
  removeInApp(key: string): void {
    delete this.inAppCache[key];
  }

  /**
   * Clears all in-app memory cache entries.
   */
  clearInApp(): void {
    this.inAppCache = {};
  }
}
