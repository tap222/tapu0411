import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { CacheService } from './cache.service';

describe('CacheService - Multi-Tier In-Memory Caching', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CacheService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    cacheService = TestBed.inject(CacheService);
  });

  it('should set and get values from in-memory cache', () => {
    cacheService.setInApp('test_key', { name: 'Pikachu', id: 25 });
    const cached = cacheService.getInApp<{ name: string; id: number }>('test_key');

    expect(cached).toEqual({ name: 'Pikachu', id: 25 });
  });

  it('should return null when key does not exist', () => {
    const cached = cacheService.getInApp('non_existent');
    expect(cached).toBeNull();
  });

  it('should remove items correctly', () => {
    cacheService.setInApp('temp_key', 'temp_value');
    cacheService.removeInApp('temp_key');

    expect(cacheService.getInApp('temp_key')).toBeNull();
  });

  it('should expire cached values when TTL is exceeded', () => {
    cacheService.setInApp('expiring_key', 'value', 50);

    // Fast-forward or verify with expired timestamp
    cacheService.inAppCache['expiring_key'].timestamp = Date.now() - 1000;

    const result = cacheService.getInApp('expiring_key');
    expect(result).toBeNull();
  });
});
