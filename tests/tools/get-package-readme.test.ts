import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPackageReadme } from '../../src/tools/get-package-readme.js';
import { PackageReadmeResponse, GetPackageReadmeParams } from '../../src/types/index.js';

// Mock dependencies
vi.mock('../../src/services/npm-registry.js', () => ({
  npmRegistry: {
    getPackageInfo: vi.fn(),
    getVersionInfo: vi.fn(),
  },
}));

vi.mock('../../src/services/cache.js', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
  createCacheKey: {
    packageReadme: vi.fn(),
  },
}));

vi.mock('../../src/services/readme-fetcher.js', () => ({
  fetchReadmeContent: vi.fn(),
}));

vi.mock('../../src/services/readme-parser.js', () => ({
  readmeParser: {
    cleanMarkdown: vi.fn(),
    parseUsageExamples: vi.fn(),
  },
}));

vi.mock('../../src/services/package-info-builder.js', () => ({
  buildPackageBasicInfo: vi.fn(),
  buildRepositoryInfo: vi.fn(),
  buildInstallationInfo: vi.fn(),
  buildNotFoundResponse: vi.fn(),
}));

vi.mock('../../src/utils/validators.js', () => ({
  validatePackageName: vi.fn(),
  validateVersion: vi.fn(),
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
import { fetchReadmeContent } from '../../src/services/readme-fetcher.js';
import { readmeParser } from '../../src/services/readme-parser.js';
import {
  buildPackageBasicInfo,
  buildRepositoryInfo,
  buildInstallationInfo,
  buildNotFoundResponse,
} from '../../src/services/package-info-builder.js';
import { validatePackageName, validateVersion } from '../../src/utils/validators.js';

describe('get-package-readme tool', () => {
  const mockNpmRegistry = npmRegistry as any;
  const mockCache = cache as any;
  const mockCreateCacheKey = createCacheKey as any;
  const mockFetchReadmeContent = fetchReadmeContent as any;
  const mockReadmeParser = readmeParser as any;
  const mockBuildPackageBasicInfo = buildPackageBasicInfo as any;
  const mockBuildRepositoryInfo = buildRepositoryInfo as any;
  const mockBuildInstallationInfo = buildInstallationInfo as any;
  const mockBuildNotFoundResponse = buildNotFoundResponse as any;
  const mockValidatePackageName = validatePackageName as any;
  const mockValidateVersion = validateVersion as any;

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

      await expect(getPackageReadme({ package_name: 'invalid-name' })).rejects.toThrow('Invalid package name');
      expect(mockValidatePackageName).toHaveBeenCalledWith('invalid-name');
    });

    it('should validate version when not latest', async () => {
      const error = new Error('Invalid version');
      mockValidatePackageName.mockImplementationOnce(() => {});
      mockValidateVersion.mockImplementationOnce(() => {
        throw error;
      });

      await expect(getPackageReadme({ package_name: 'lodash', version: '4.17.21' })).rejects.toThrow('Invalid version');
      expect(mockValidateVersion).toHaveBeenCalledWith('4.17.21');
    });

    it('should not validate version for latest', async () => {
      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.getPackageInfo.mockRejectedValueOnce(new Error('Test error'));
      mockNpmRegistry.getVersionInfo.mockRejectedValueOnce(new Error('Test error'));
      mockBuildNotFoundResponse.mockReturnValueOnce({
        package_name: 'lodash',
        version: 'latest',
        description: 'Package not found',
        readme_content: '',
        usage_examples: [],
        installation: {},
        basic_info: {},
        repository: {},
        exists: false,
      });

      const result = await getPackageReadme({ package_name: 'lodash', version: 'latest' });
      expect(result.exists).toBe(false);
      expect(mockValidateVersion).not.toHaveBeenCalled();
    });

    it('should use default parameter values', async () => {
      const packageName = 'lodash';
      const mockPackageInfo = { name: packageName };
      const mockVersionInfo = { name: packageName, version: '4.17.21' };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockNpmRegistry.getVersionInfo.mockResolvedValueOnce(mockVersionInfo);
      mockFetchReadmeContent.mockResolvedValueOnce({ content: 'README content', source: 'npm' });
      mockReadmeParser.cleanMarkdown.mockReturnValueOnce('Cleaned README');
      mockReadmeParser.parseUsageExamples.mockReturnValueOnce(['example1', 'example2']);
      mockBuildInstallationInfo.mockReturnValueOnce({ npm: 'npm install lodash' });
      mockBuildPackageBasicInfo.mockReturnValueOnce({ description: 'Utility library' });
      mockBuildRepositoryInfo.mockReturnValueOnce({ type: 'git', url: 'https://github.com/lodash/lodash.git' });
      mockCache.set.mockImplementationOnce(() => {});

      const result = await getPackageReadme({ package_name: packageName });

      expect(mockReadmeParser.parseUsageExamples).toHaveBeenCalledWith('README content', true); // include_examples defaults to true
      expect(mockNpmRegistry.getVersionInfo).toHaveBeenCalledWith(packageName, 'latest'); // version defaults to 'latest'
    });
  });

  describe('caching', () => {
    it('should return cached result when available', async () => {
      const packageName = 'lodash';
      const cachedResponse: PackageReadmeResponse = {
        package_name: packageName,
        version: '4.17.21',
        description: 'Cached response',
        readme_content: 'Cached README',
        usage_examples: ['cached example'],
        installation: { npm: 'npm install lodash' },
        basic_info: { description: 'Cached description' },
        repository: { type: 'git', url: 'https://github.com/lodash/lodash.git' },
        exists: true,
      };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(cachedResponse);

      const result = await getPackageReadme({ package_name: packageName });

      expect(result).toEqual(cachedResponse);
      expect(mockNpmRegistry.getPackageInfo).not.toHaveBeenCalled();
      expect(mockNpmRegistry.getVersionInfo).not.toHaveBeenCalled();
    });

    it('should cache successful results', async () => {
      const packageName = 'lodash';
      const mockPackageInfo = { name: packageName };
      const mockVersionInfo = { name: packageName, version: '4.17.21' };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockNpmRegistry.getVersionInfo.mockResolvedValueOnce(mockVersionInfo);
      mockFetchReadmeContent.mockResolvedValueOnce({ content: 'README content', source: 'npm' });
      mockReadmeParser.cleanMarkdown.mockReturnValueOnce('Cleaned README');
      mockReadmeParser.parseUsageExamples.mockReturnValueOnce(['example1']);
      mockBuildInstallationInfo.mockReturnValueOnce({ npm: 'npm install lodash' });
      mockBuildPackageBasicInfo.mockReturnValueOnce({ description: 'Utility library' });
      mockBuildRepositoryInfo.mockReturnValueOnce({ type: 'git', url: 'https://github.com/lodash/lodash.git' });
      mockCache.set.mockImplementationOnce(() => {});

      await getPackageReadme({ package_name: packageName });

      expect(mockCache.set).toHaveBeenCalledWith('cache-key', expect.any(Object));
    });
  });

  describe('package not found handling', () => {
    it('should return not found response when package info is not available', async () => {
      const packageName = 'non-existent-package';
      const notFoundResponse: PackageReadmeResponse = {
        package_name: packageName,
        version: 'latest',
        description: 'Package not found',
        readme_content: '',
        usage_examples: [],
        installation: {},
        basic_info: {},
        repository: {},
        exists: false,
      };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.getPackageInfo.mockRejectedValueOnce(new Error('Package not found'));
      mockNpmRegistry.getVersionInfo.mockRejectedValueOnce(new Error('Package not found'));
      mockBuildNotFoundResponse.mockReturnValueOnce(notFoundResponse);

      const result = await getPackageReadme({ package_name: packageName });

      expect(result).toEqual(notFoundResponse);
      expect(mockBuildNotFoundResponse).toHaveBeenCalledWith(packageName, 'latest');
    });

    it('should return not found response when version info is not available', async () => {
      const packageName = 'existing-package';
      const version = '999.999.999';
      const notFoundResponse: PackageReadmeResponse = {
        package_name: packageName,
        version,
        description: 'Version not found',
        readme_content: '',
        usage_examples: [],
        installation: {},
        basic_info: {},
        repository: {},
        exists: false,
      };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockValidateVersion.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce({ name: packageName });
      mockNpmRegistry.getVersionInfo.mockRejectedValueOnce(new Error('Version not found'));
      mockBuildNotFoundResponse.mockReturnValueOnce(notFoundResponse);

      const result = await getPackageReadme({ package_name: packageName, version });

      expect(result).toEqual(notFoundResponse);
      expect(mockBuildNotFoundResponse).toHaveBeenCalledWith(packageName, version);
    });
  });

  describe('successful README retrieval', () => {
    it('should return README with minimal data', async () => {
      const packageName = 'simple-package';
      const mockPackageInfo = { name: packageName };
      const mockVersionInfo = { name: packageName, version: '1.0.0' };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockNpmRegistry.getVersionInfo.mockResolvedValueOnce(mockVersionInfo);
      mockFetchReadmeContent.mockResolvedValueOnce({ content: 'Simple README', source: 'npm' });
      mockReadmeParser.cleanMarkdown.mockReturnValueOnce('Simple README');
      mockReadmeParser.parseUsageExamples.mockReturnValueOnce([]);
      mockBuildInstallationInfo.mockReturnValueOnce({ npm: 'npm install simple-package' });
      mockBuildPackageBasicInfo.mockReturnValueOnce({ description: 'Simple package' });
      mockBuildRepositoryInfo.mockReturnValueOnce({});
      mockCache.set.mockImplementationOnce(() => {});

      const result = await getPackageReadme({ package_name: packageName });

      expect(result).toEqual({
        package_name: packageName,
        version: '1.0.0',
        description: 'Simple package',
        readme_content: 'Simple README',
        usage_examples: [],
        installation: { npm: 'npm install simple-package' },
        basic_info: { description: 'Simple package' },
        repository: {},
        exists: true,
      });
    });

    it('should return README with complete data and examples', async () => {
      const packageName = 'complete-package';
      const version = '2.1.0';
      const mockPackageInfo = {
        name: packageName,
        description: 'Complete package description',
      };
      const mockVersionInfo = {
        name: packageName,
        version,
        description: 'Version description',
      };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockValidateVersion.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockNpmRegistry.getVersionInfo.mockResolvedValueOnce(mockVersionInfo);
      mockFetchReadmeContent.mockResolvedValueOnce({
        content: '# Complete Package\n\n## Usage\n```js\nconst pkg = require("complete-package");\n```',
        source: 'github',
      });
      mockReadmeParser.cleanMarkdown.mockReturnValueOnce('# Complete Package\n\n## Usage\n```js\nconst pkg = require("complete-package");\n```');
      mockReadmeParser.parseUsageExamples.mockReturnValueOnce(['const pkg = require("complete-package");']);
      mockBuildInstallationInfo.mockReturnValueOnce({
        npm: 'npm install complete-package',
        yarn: 'yarn add complete-package',
      });
      mockBuildPackageBasicInfo.mockReturnValueOnce({
        description: 'Version description',
        author: 'Test Author',
        license: 'MIT',
      });
      mockBuildRepositoryInfo.mockReturnValueOnce({
        type: 'git',
        url: 'https://github.com/user/complete-package.git',
      });
      mockCache.set.mockImplementationOnce(() => {});

      const params: GetPackageReadmeParams = {
        package_name: packageName,
        version,
        include_examples: true,
      };

      const result = await getPackageReadme(params);

      expect(result).toEqual({
        package_name: packageName,
        version,
        description: 'Version description',
        readme_content: '# Complete Package\n\n## Usage\n```js\nconst pkg = require("complete-package");\n```',
        usage_examples: ['const pkg = require("complete-package");'],
        installation: {
          npm: 'npm install complete-package',
          yarn: 'yarn add complete-package',
        },
        basic_info: {
          description: 'Version description',
          author: 'Test Author',
          license: 'MIT',
        },
        repository: {
          type: 'git',
          url: 'https://github.com/user/complete-package.git',
        },
        exists: true,
      });
    });

    it('should exclude examples when include_examples is false', async () => {
      const packageName = 'no-examples-package';
      const mockPackageInfo = { name: packageName };
      const mockVersionInfo = { name: packageName, version: '1.0.0' };

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockNpmRegistry.getVersionInfo.mockResolvedValueOnce(mockVersionInfo);
      mockFetchReadmeContent.mockResolvedValueOnce({
        content: '# Package with examples\n```js\nconsole.log("example");\n```',
        source: 'npm',
      });
      mockReadmeParser.cleanMarkdown.mockReturnValueOnce('# Package with examples\n```js\nconsole.log("example");\n```');
      mockReadmeParser.parseUsageExamples.mockReturnValueOnce([]);
      mockBuildInstallationInfo.mockReturnValueOnce({ npm: 'npm install no-examples-package' });
      mockBuildPackageBasicInfo.mockReturnValueOnce({ description: 'Package description' });
      mockBuildRepositoryInfo.mockReturnValueOnce({});
      mockCache.set.mockImplementationOnce(() => {});

      const result = await getPackageReadme({
        package_name: packageName,
        include_examples: false,
      });

      expect(mockReadmeParser.parseUsageExamples).toHaveBeenCalledWith(
        '# Package with examples\n```js\nconsole.log("example");\n```',
        false
      );
      expect(result.usage_examples).toEqual([]);
    });
  });

  describe('README processing', () => {
    it('should clean README markdown content', async () => {
      const packageName = 'markdown-package';
      const mockPackageInfo = { name: packageName };
      const mockVersionInfo = { name: packageName, version: '1.0.0' };
      const rawReadme = '# Package\n\n<script>alert("xss")</script>\n\nContent';
      const cleanedReadme = '# Package\n\nContent';

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockNpmRegistry.getVersionInfo.mockResolvedValueOnce(mockVersionInfo);
      mockFetchReadmeContent.mockResolvedValueOnce({ content: rawReadme, source: 'npm' });
      mockReadmeParser.cleanMarkdown.mockReturnValueOnce(cleanedReadme);
      mockReadmeParser.parseUsageExamples.mockReturnValueOnce([]);
      mockBuildInstallationInfo.mockReturnValueOnce({ npm: 'npm install markdown-package' });
      mockBuildPackageBasicInfo.mockReturnValueOnce({ description: 'Package description' });
      mockBuildRepositoryInfo.mockReturnValueOnce({});
      mockCache.set.mockImplementationOnce(() => {});

      const result = await getPackageReadme({ package_name: packageName });

      expect(mockReadmeParser.cleanMarkdown).toHaveBeenCalledWith(rawReadme);
      expect(result.readme_content).toBe(cleanedReadme);
    });

    it('should parse usage examples from README', async () => {
      const packageName = 'examples-package';
      const mockPackageInfo = { name: packageName };
      const mockVersionInfo = { name: packageName, version: '1.0.0' };
      const readmeWithExamples = '# Package\n\n```js\nconst pkg = require("examples-package");\npkg.doSomething();\n```';
      const parsedExamples = ['const pkg = require("examples-package");', 'pkg.doSomething();'];

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockNpmRegistry.getVersionInfo.mockResolvedValueOnce(mockVersionInfo);
      mockFetchReadmeContent.mockResolvedValueOnce({ content: readmeWithExamples, source: 'npm' });
      mockReadmeParser.cleanMarkdown.mockReturnValueOnce(readmeWithExamples);
      mockReadmeParser.parseUsageExamples.mockReturnValueOnce(parsedExamples);
      mockBuildInstallationInfo.mockReturnValueOnce({ npm: 'npm install examples-package' });
      mockBuildPackageBasicInfo.mockReturnValueOnce({ description: 'Package description' });
      mockBuildRepositoryInfo.mockReturnValueOnce({});
      mockCache.set.mockImplementationOnce(() => {});

      const result = await getPackageReadme({ package_name: packageName });

      expect(mockReadmeParser.parseUsageExamples).toHaveBeenCalledWith(readmeWithExamples, true);
      expect(result.usage_examples).toEqual(parsedExamples);
    });
  });

  describe('error handling', () => {
    it('should handle npm registry errors', async () => {
      const packageName = 'error-package';
      const error = new Error('Registry error');

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.getPackageInfo.mockRejectedValueOnce(error);
      mockNpmRegistry.getVersionInfo.mockRejectedValueOnce(error);
      mockBuildNotFoundResponse.mockReturnValueOnce({
        package_name: packageName,
        version: 'latest',
        description: 'Package not found',
        readme_content: '',
        usage_examples: [],
        installation: {},
        basic_info: {},
        repository: {},
        exists: false,
      });

      const result = await getPackageReadme({ package_name: packageName });
      expect(result.exists).toBe(false);
    });

    it('should handle README fetching errors', async () => {
      const packageName = 'readme-error-package';
      const mockPackageInfo = { name: packageName };
      const mockVersionInfo = { name: packageName, version: '1.0.0' };
      const error = new Error('README fetch error');

      mockValidatePackageName.mockImplementationOnce(() => {});
      mockCreateCacheKey.packageReadme.mockReturnValueOnce('cache-key');
      mockCache.get.mockReturnValueOnce(null);
      mockNpmRegistry.getPackageInfo.mockResolvedValueOnce(mockPackageInfo);
      mockNpmRegistry.getVersionInfo.mockResolvedValueOnce(mockVersionInfo);
      mockFetchReadmeContent.mockRejectedValueOnce(error);

      await expect(getPackageReadme({ package_name: packageName })).rejects.toThrow('README fetch error');
    });
  });
});