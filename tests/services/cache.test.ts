import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryCache, createCacheKey } from '../../src/services/cache.js';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({
      ttl: 1000, // 1 second for testing
      maxSize: 1024, // 1KB for testing
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should handle different data types', () => {
      const obj = { name: 'test', count: 42 };
      const arr = [1, 2, 3];
      
      cache.set('object', obj);
      cache.set('array', arr);
      cache.set('number', 123);
      cache.set('boolean', true);

      expect(cache.get('object')).toEqual(obj);
      expect(cache.get('array')).toEqual(arr);
      expect(cache.get('number')).toBe(123);
      expect(cache.get('boolean')).toBe(true);
    });

    it('should handle custom TTL', async () => {
      cache.set('key1', 'value1', 100); // 0.1 seconds
      expect(cache.get('key1')).toBe('value1');

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.get('key1')).toBeNull();
    });

    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', 100);
      expect(cache.get('key1')).toBe('value1');

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.get('key1')).toBeNull();
    });

    it('should update timestamp on access (LRU)', async () => {
      cache.set('key1', 'value1', 200);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(cache.get('key1')).toBe('value1'); // Access updates timestamp
      
      await new Promise(resolve => setTimeout(resolve, 150)); // Should still be valid
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('delete', () => {
    it('should delete existing entries', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });

    it('should return false for non-existent entries', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing entries', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent entries', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired entries', async () => {
      cache.set('key1', 'value1', 100);
      expect(cache.has('key1')).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.has('key1')).toBe(false);
    });

    it('should clean up expired entries when checking', async () => {
      cache.set('key1', 'value1', 100);
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.size()).toBe(1); // Still there
      cache.has('key1'); // This should trigger cleanup
      expect(cache.size()).toBe(0); // Now cleaned up
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', { complex: 'object', with: 'data' });

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.hitRate).toBe(0); // Not implemented yet
    });
  });

  describe('automatic cleanup', () => {
    it('should periodically clean up expired entries', async () => {
      // Create a short-lived cache for testing
      const testCache = new MemoryCache({ ttl: 50 });
      testCache.set('key1', 'value1');
      testCache.set('key2', 'value2');
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Expire entries
      expect(testCache.size()).toBe(2); // Still there before cleanup
      
      // Wait for cleanup interval (5 minutes is too long for test, so we'll manually trigger)
      testCache['cleanup']();
      expect(testCache.size()).toBe(0); // Cleaned up
      
      testCache.destroy();
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when size limit is exceeded', () => {
      // Create a cache with very small size limit
      const smallCache = new MemoryCache({ maxSize: 1 }); // Very small limit
      
      // Add first entry
      smallCache.set('a', 'x');
      expect(smallCache.has('a')).toBe(true);
      
      // Add second entry - should trigger eviction of 'a'
      smallCache.set('b', 'y');
      
      expect(smallCache.has('a')).toBe(false); // Should be evicted
      expect(smallCache.has('b')).toBe(true);  // Should remain
      
      smallCache.destroy();
    });
  });

  describe('constructor defaults', () => {
    it('should use default values when no options provided', () => {
      const defaultCache = new MemoryCache();
      
      // Default TTL should be 1 hour, so entry should still be there after short time
      defaultCache.set('key', 'value');
      expect(defaultCache.get('key')).toBe('value');
      
      defaultCache.destroy();
    });

    it('should use provided options', async () => {
      const customCache = new MemoryCache({
        ttl: 100,
        maxSize: 512,
      });
      
      customCache.set('key', 'value');
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(customCache.get('key')).toBeNull();
      
      customCache.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const testCache = new MemoryCache();
      testCache.set('key', 'value');
      
      expect(testCache.size()).toBe(1);
      testCache.destroy();
      expect(testCache.size()).toBe(0);
    });
  });
});

describe('createCacheKey', () => {
  describe('packageInfo', () => {
    it('should create consistent cache keys', () => {
      const key1 = createCacheKey.packageInfo('lodash', '4.17.21');
      const key2 = createCacheKey.packageInfo('lodash', '4.17.21');
      expect(key1).toBe(key2);
      expect(key1).toBe('pkg_info:lodash:4.17.21');
    });

    it('should create different keys for different packages', () => {
      const key1 = createCacheKey.packageInfo('lodash', '4.17.21');
      const key2 = createCacheKey.packageInfo('express', '4.17.21');
      expect(key1).not.toBe(key2);
    });

    it('should create different keys for different versions', () => {
      const key1 = createCacheKey.packageInfo('lodash', '4.17.21');
      const key2 = createCacheKey.packageInfo('lodash', '4.17.20');
      expect(key1).not.toBe(key2);
    });
  });

  describe('packageReadme', () => {
    it('should create consistent readme cache keys', () => {
      const key1 = createCacheKey.packageReadme('lodash', 'latest');
      const key2 = createCacheKey.packageReadme('lodash', 'latest');
      expect(key1).toBe(key2);
      expect(key1).toBe('pkg_readme:lodash:latest');
    });
  });

  describe('searchResults', () => {
    it('should create consistent search cache keys', () => {
      const key1 = createCacheKey.searchResults('react', 20);
      const key2 = createCacheKey.searchResults('react', 20);
      expect(key1).toBe(key2);
    });

    it('should include quality and popularity when provided', () => {
      const key1 = createCacheKey.searchResults('react', 20, 0.8, 0.9);
      const key2 = createCacheKey.searchResults('react', 20);
      expect(key1).not.toBe(key2);
      expect(key1).toContain('q:0.8');
      expect(key1).toContain('p:0.9');
    });

    it('should handle special characters in query', () => {
      const key = createCacheKey.searchResults('@babel/core', 10);
      expect(key).toContain('search:');
      expect(key).toContain('10');
    });
  });

  describe('downloadStats', () => {
    it('should create date-specific cache keys', () => {
      const key1 = createCacheKey.downloadStats('lodash', 'last-day');
      const key2 = createCacheKey.downloadStats('lodash', 'last-day');
      expect(key1).toBe(key2);
      expect(key1).toContain(new Date().toISOString().split('T')[0]);
    });

    it('should create different keys for different periods', () => {
      const key1 = createCacheKey.downloadStats('lodash', 'last-day');
      const key2 = createCacheKey.downloadStats('lodash', 'last-week');
      expect(key1).not.toBe(key2);
    });
  });
});