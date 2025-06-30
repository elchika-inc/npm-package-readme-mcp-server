import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubApiClient } from '../../src/services/github-api.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('GitHubApiClient', () => {
  let client: GitHubApiClient;
  const mockFetch = fetch as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client without token', () => {
      const testClient = new GitHubApiClient();
      expect(testClient['token']).toBeUndefined();
      expect(testClient['timeout']).toBe(30000);
    });

    it('should create client with token and custom timeout', () => {
      const testClient = new GitHubApiClient('test-token', 15000);
      expect(testClient['token']).toBe('test-token');
      expect(testClient['timeout']).toBe(15000);
    });
  });

  describe('parseRepositoryUrl', () => {
    beforeEach(() => {
      client = new GitHubApiClient();
    });

    it('should parse HTTPS GitHub URLs', () => {
      const testCases = [
        'https://github.com/owner/repo',
        'https://github.com/owner/repo.git',
        'https://github.com/owner/repo/',
        'https://github.com/owner/repo.git/',
        'https://github.com/owner/repo/tree/main',
      ];

      for (const url of testCases) {
        const result = client.parseRepositoryUrl(url);
        expect(result).toEqual({ owner: 'owner', repo: 'repo' });
      }
    });

    it('should parse HTTP GitHub URLs', () => {
      const result = client.parseRepositoryUrl('http://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse git+https URLs', () => {
      const result = client.parseRepositoryUrl('git+https://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse git:// URLs', () => {
      const result = client.parseRepositoryUrl('git://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse SSH URLs', () => {
      const result = client.parseRepositoryUrl('git@github.com:owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should handle scoped package names', () => {
      const result = client.parseRepositoryUrl('https://github.com/babel/babel');
      expect(result).toEqual({ owner: 'babel', repo: 'babel' });
    });

    it('should return null for non-GitHub URLs', () => {
      const testCases = [
        'https://gitlab.com/owner/repo',
        'https://bitbucket.org/owner/repo',
        'not-a-url',
        '',
      ];

      for (const url of testCases) {
        const result = client.parseRepositoryUrl(url);
        expect(result).toBeNull();
      }
    });

    it('should handle malformed URLs gracefully', () => {
      const result = client.parseRepositoryUrl('https://github.com/');
      expect(result).toBeNull();
    });
  });

  describe('getReadme', () => {
    beforeEach(() => {
      client = new GitHubApiClient('test-token', 5000);
    });

    it('should fetch README successfully', async () => {
      const mockReadmeContent = '# Test Repository\n\nThis is a test README.';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockReadmeContent),
      });

      const result = await client.getReadme('owner', 'repo');
      expect(result).toBe(mockReadmeContent);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/readme',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'package-readme-mcp/1.0.0',
            'Authorization': 'token test-token',
          }),
        })
      );
    });

    it('should make request without authorization when no token provided', async () => {
      const clientWithoutToken = new GitHubApiClient();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('# README'),
      });

      await clientWithoutToken.getReadme('owner', 'repo');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/readme',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(client.getReadme('owner', 'nonexistent')).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      const mockAbortError = new Error('AbortError');
      mockAbortError.name = 'AbortError';
      
      mockFetch.mockRejectedValueOnce(mockAbortError);

      await expect(client.getReadme('owner', 'repo')).rejects.toThrow();
    });

    it('should URL encode owner and repo names', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('# README'),
      });

      await client.getReadme('owner/with/slashes', 'repo@with@ats');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner%2Fwith%2Fslashes/repo%40with%40ats/readme',
        expect.any(Object)
      );
    });
  });

  describe('getReadmeFromRepository', () => {
    beforeEach(() => {
      client = new GitHubApiClient('test-token');
    });

    it('should fetch README from repository info', async () => {
      const repository = {
        type: 'git' as const,
        url: 'https://github.com/owner/repo.git',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('# Repository README'),
      });

      const result = await client.getReadmeFromRepository(repository);
      expect(result).toBe('# Repository README');
    });

    it('should return null for non-git repositories', async () => {
      const repository = {
        type: 'svn' as any,
        url: 'https://svn.example.com/repo',
      };

      const result = await client.getReadmeFromRepository(repository);
      expect(result).toBeNull();
    });

    it('should return null for non-GitHub repositories', async () => {
      const repository = {
        type: 'git' as const,
        url: 'https://gitlab.com/owner/repo.git',
      };

      const result = await client.getReadmeFromRepository(repository);
      expect(result).toBeNull();
    });

    it('should return null when README fetch fails', async () => {
      const repository = {
        type: 'git' as const,
        url: 'https://github.com/owner/repo.git',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await client.getReadmeFromRepository(repository);
      expect(result).toBeNull();
    });

    it('should handle repository with directory', async () => {
      const repository = {
        type: 'git' as const,
        url: 'https://github.com/owner/monorepo.git',
        directory: 'packages/core',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('# Monorepo README'),
      });

      const result = await client.getReadmeFromRepository(repository);
      expect(result).toBe('# Monorepo README');
    });
  });

  describe('rate limiting methods', () => {
    beforeEach(() => {
      client = new GitHubApiClient();
    });

    it('should return false for isRateLimited (not implemented)', () => {
      expect(client.isRateLimited()).toBe(false);
    });

    it('should return null for getRateLimitStatus (not implemented)', () => {
      expect(client.getRateLimitStatus()).toBeNull();
    });
  });
});