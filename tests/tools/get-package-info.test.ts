import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPackageInfo } from '../../src/tools/get-package-info.js';
import { PackageInfoResponse, GetPackageInfoParams } from '../../src/types/index.js';

// Mock dependencies
vi.mock('../../src/services/npm-registry.js', () => ({
  npmRegistry: {
    packageExists: vi.fn(),
    getPackageInfo: vi.fn(),
  },
}));

vi.mock('../../src/services/cache.js', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
  createCacheKey: {
    packageInfo: vi.fn(),
  },
}));

vi.mock('../../src/utils/validators.js', () => ({
  validatePackageName: vi.fn(),
}));

vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { npmRegistry } from '../../src/services/npm-registry.js';
import { cache, createCacheKey } from '../../src/services/cache.js';
import { validatePackageName } from '../../src/utils/validators.js';

describe('get-package-info tool', () => {
  const mockNpmRegistry = npmRegistry as any;
  const mockCache = cache as any;
  const mockCreateCacheKey = createCacheKey as any;
  const mockValidatePackageName = validatePackageName as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('parameter validation', () => {
    it('should validate package name', async () => {
      const error = new Error('Invalid package name');
      mockValidatePackageName.mockImplementationOnce(() => {
        throw error;
      });

      await expect(getPackageInfo({ package_name: 'invalid-name' })).rejects.toThrow('Invalid package name');
      expect(mockValidatePackageName).toHaveBeenCalledWith('invalid-name');
    });

    it('should use default parameter values', async () => {
      const packageName = 'lodash';
      const mockPackageInfo = {
        name: packageName,
        'dist-tags': { latest: '4.17.21' },
        versions: {
          '4.17.21': {
            name: packageName,
            version: '4.17.21',
            description: 'A utility library',
            dependencies: { 'test-dep': '^1.0.0' },
            devDependencies: { 'test-dev-dep': '^1.0.0' },
          },
        },
      };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageInfo.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.packageExists.mockResolvedValueOnce(true);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockCache.set.mockImplementationOnce(() => {});

      const result = await getPackageInfo({ package_name: packageName });

      expect(result.dependencies).toBeDefined(); // include_dependencies defaults to true
      expect(result.dev_dependencies).toBeUndefined(); // include_dev_dependencies defaults to false
    });
  });

  describe('caching', () => {
    it('should return cached result when available', async () => {
      const packageName = 'lodash';
      const cachedResponse: PackageInfoResponse = {
        package_name: packageName,
        latest_version: '4.17.21',
        description: 'Cached response',
        author: 'Test Author',
        license: 'MIT',
        keywords: ['utility'],
        download_stats: { last_day: 100, last_week: 700, last_month: 3000 },
        exists: true,
      };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageInfo.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(cachedResponse);

      const result = await getPackageInfo({ package_name: packageName });

      expect(result).toEqual(cachedResponse);
      expect(mockNpmRegistry.packageExists).not.toHaveBeenCalled();
      expect(mockNpmRegistry.getPackageInfo).not.toHaveBeenCalled();
    });

    it('should cache successful results', async () => {
      const packageName = 'lodash';
      const mockPackageInfo = {
        name: packageName,
        'dist-tags': { latest: '4.17.21' },
        versions: {
          '4.17.21': {
            name: packageName,
            version: '4.17.21',
            description: 'A utility library',
          },
        },
      };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageInfo.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.packageExists.mockResolvedValueOnce(true);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockCache.set.mockImplementationOnce(() => {});

      await getPackageInfo({ package_name: packageName });

      expect(mockCache.set).toHaveBeenCalledWith('cache-key', expect.any(Object));
    });
  });

  describe('package existence check', () => {
    it('should return not found response when package does not exist', async () => {
      const packageName = 'non-existent-package';

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageInfo.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.packageExists.mockResolvedValueOnce(false);

      const result = await getPackageInfo({ package_name: packageName });

      expect(result).toEqual({
        package_name: packageName,
        latest_version: 'unknown',
        description: 'Package not found',
        author: 'Unknown',
        license: 'Unknown',
        keywords: [],
        download_stats: {
          last_day: 0,
          last_week: 0,
          last_month: 0,
        },
        exists: false,
      });
      expect(mockNpmRegistry.getPackageInfo).not.toHaveBeenCalled();
    });
  });

  describe('successful package info retrieval', () => {
    it('should return package info with minimal data', async () => {
      const packageName = 'simple-package';
      const mockPackageInfo = {
        name: packageName,
        'dist-tags': { latest: '1.0.0' },
        versions: {
          '1.0.0': {
            name: packageName,
            version: '1.0.0',
          },
        },
      };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageInfo.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.packageExists.mockResolvedValueOnce(true);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockCache.set.mockImplementationOnce(() => {});

      const result = await getPackageInfo({ package_name: packageName });

      expect(result).toEqual({
        package_name: packageName,
        latest_version: '1.0.0',
        description: 'No description available',
        author: 'Unknown',
        license: 'Unknown',
        keywords: [],
        download_stats: {
          last_day: 0,
          last_week: 0,
          last_month: 0,
        },
        exists: true,
      });
    });

    it('should return package info with complete data', async () => {
      const packageName = 'complete-package';
      const mockPackageInfo = {
        name: packageName,
        'dist-tags': { latest: '2.1.0' },
        description: 'Package description',
        author: { name: 'John Doe', email: 'john@example.com' },
        license: 'MIT',
        keywords: ['utility', 'helper'],
        versions: {
          '2.1.0': {
            name: packageName,
            version: '2.1.0',
            description: 'Version description',
            author: 'Jane Smith',
            license: 'Apache-2.0',
            keywords: ['tool'],
            dependencies: { 'dep1': '^1.0.0', 'dep2': '^2.0.0' },
            devDependencies: { 'dev-dep1': '^1.0.0' },
            repository: {
              type: 'git',
              url: 'https://github.com/user/repo.git',
              directory: 'packages/main',
            },
          },
        },
      };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageInfo.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.packageExists.mockResolvedValueOnce(true);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockCache.set.mockImplementationOnce(() => {});

      const params: GetPackageInfoParams = {
        package_name: packageName,
        include_dependencies: true,
        include_dev_dependencies: true,
      };

      const result = await getPackageInfo(params);

      expect(result).toEqual({
        package_name: packageName,
        latest_version: '2.1.0',
        description: 'Version description',
        author: 'Jane Smith',
        license: 'Apache-2.0',
        keywords: ['tool'],
        dependencies: { 'dep1': '^1.0.0', 'dep2': '^2.0.0' },
        dev_dependencies: { 'dev-dep1': '^1.0.0' },
        repository: {
          type: 'git',
          url: 'https://github.com/user/repo.git',
          directory: 'packages/main',
        },
        download_stats: {
          last_day: 0,
          last_week: 0,
          last_month: 0,
        },
        exists: true,
      });
    });

    it('should handle author as object with email', async () => {
      const packageName = 'author-test-package';
      const mockPackageInfo = {
        name: packageName,
        'dist-tags': { latest: '1.0.0' },
        versions: {
          '1.0.0': {
            name: packageName,
            version: '1.0.0',
            author: {
              name: 'Test Author',
              email: 'test@example.com',
            },
          },
        },
      };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageInfo.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.packageExists.mockResolvedValueOnce(true);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockCache.set.mockImplementationOnce(() => {});

      const result = await getPackageInfo({ package_name: packageName });

      expect(result.author).toBe('Test Author <test@example.com>');
    });

    it('should exclude dependencies when include_dependencies is false', async () => {
      const packageName = 'no-deps-package';
      const mockPackageInfo = {
        name: packageName,
        'dist-tags': { latest: '1.0.0' },
        versions: {
          '1.0.0': {
            name: packageName,
            version: '1.0.0',
            dependencies: { 'dep1': '^1.0.0' },
            devDependencies: { 'dev-dep1': '^1.0.0' },
          },
        },
      };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageInfo.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.packageExists.mockResolvedValueOnce(true);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockCache.set.mockImplementationOnce(() => {});

      const result = await getPackageInfo({
        package_name: packageName,
        include_dependencies: false,
        include_dev_dependencies: false,
      });

      expect(result.dependencies).toBeUndefined();
      expect(result.dev_dependencies).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle missing latest version', async () => {
      const packageName = 'bad-package';
      const mockPackageInfo = {
        name: packageName,
        'dist-tags': { latest: '1.0.0' },
        versions: {}, // Missing version info
      };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageInfo.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.packageExists.mockResolvedValueOnce(true);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);

      await expect(getPackageInfo({ package_name: packageName })).rejects.toThrow(
        'Latest version 1.0.0 not found for package bad-package'
      );
    });

    it('should handle npm registry errors', async () => {
      const packageName = 'error-package';
      const error = new Error('Registry error');

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageInfo.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.packageExists.mockRejectedValueOnce(error);

      await expect(getPackageInfo({ package_name: packageName })).rejects.toThrow('Registry error');
    });
  });
});