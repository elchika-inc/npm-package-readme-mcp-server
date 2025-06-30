import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NpmRegistryClient } from '../../src/services/npm-registry.js';

// Mock fetch
global.fetch = vi.fn();

describe('NpmRegistryClient', () => {
  let client: NpmRegistryClient;

  beforeEach(() => {
    client = new NpmRegistryClient();
    vi.clearAllMocks();
  });

  describe('packageExists', () => {
    it('should return true for existing package', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ name: 'lodash' })
      });

      const result = await client.packageExists('lodash');
      expect(result).toBe(true);
    });

    it('should return false for non-existing package', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await client.packageExists('non-existing-package');
      expect(result).toBe(false);
    });
  });

  describe('getPackageInfo', () => {
    it('should fetch package info successfully', async () => {
      const mockPackageInfo = { name: 'lodash', 'dist-tags': { latest: '4.17.21' } };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPackageInfo)
      });

      const result = await client.getPackageInfo('lodash');
      expect(result).toEqual(mockPackageInfo);
    });

    it('should throw error for non-existing package', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(client.getPackageInfo('non-existing')).rejects.toThrow('Package not found');
    });
  });

  describe('searchPackages', () => {
    it('should search packages successfully', async () => {
      const mockSearchResults = { objects: [], total: 0 };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResults)
      });

      const result = await client.searchPackages('lodash');
      expect(result).toEqual(mockSearchResults);
    });

    it('should throw error for failed search', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(client.searchPackages('invalid')).rejects.toThrow('Search failed');
    });
  });

  describe('getAllDownloadStats', () => {
    it('should return zero stats', async () => {
      const result = await client.getAllDownloadStats();
      expect(result).toEqual({
        last_day: 0,
        last_week: 0,
        last_month: 0
      });
    });
  });
});