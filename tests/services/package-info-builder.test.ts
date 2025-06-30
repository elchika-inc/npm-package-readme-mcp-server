import { describe, it, expect } from 'vitest';
import {
  buildPackageBasicInfo,
  buildRepositoryInfo,
  buildInstallationInfo,
  buildNotFoundResponse,
} from '../../src/services/package-info-builder.js';
import { NpmPackageInfo, NpmVersionInfo } from '../../src/types/index.js';

describe('package-info-builder', () => {
  describe('buildPackageBasicInfo', () => {
    it('should build basic package info from version info', () => {
      const versionInfo: NpmVersionInfo = {
        name: 'test-package',
        version: '1.0.0',
        description: 'A test package',
        main: 'index.js',
        types: 'index.d.ts',
        homepage: 'https://example.com',
        bugs: { url: 'https://github.com/test/test/issues' },
        license: 'MIT',
        author: 'Test Author',
        contributors: ['Contributor 1', 'Contributor 2'],
        keywords: ['test', 'example'],
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
        bundledDependencies: [],
        engines: {},
        os: [],
        cpu: [],
        dist: {
          shasum: 'abc123',
          tarball: 'https://registry.npmjs.org/test-package/-/test-package-1.0.0.tgz',
          integrity: 'sha512-abc123',
          signatures: [],
          unpackedSize: 1000,
          fileCount: 10,
        },
        scripts: {},
        repository: {
          type: 'git',
          url: 'https://github.com/test/test.git',
        },
      };

      const packageInfo: NpmPackageInfo = {
        name: 'test-package',
        'dist-tags': { latest: '1.0.0' },
        versions: { '1.0.0': versionInfo },
        maintainers: [],
        time: { '1.0.0': '2023-01-01T00:00:00.000Z' },
        users: {},
        description: 'Package description',
        homepage: 'https://package.com',
        keywords: ['package'],
        license: 'Apache-2.0',
        author: 'Package Author',
        bugs: { url: 'https://github.com/package/package/issues' },
        repository: {
          type: 'git',
          url: 'https://github.com/package/package.git',
        },
        readme: 'README content',
        readmeFilename: 'README.md',
      };

      const result = buildPackageBasicInfo(versionInfo, packageInfo);

      expect(result).toEqual({
        name: 'test-package',
        version: '1.0.0',
        description: 'A test package',
        main: 'index.js',
        types: 'index.d.ts',
        homepage: 'https://example.com',
        bugs: 'https://github.com/test/test/issues',
        license: 'MIT',
        author: 'Test Author',
        contributors: ['Contributor 1', 'Contributor 2'],
        keywords: ['test', 'example'],
      });
    });

    it('should fallback to package info when version info is missing', () => {
      const versionInfo: NpmVersionInfo = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
        bundledDependencies: [],
        engines: {},
        os: [],
        cpu: [],
        dist: {
          shasum: 'abc123',
          tarball: 'https://registry.npmjs.org/test-package/-/test-package-1.0.0.tgz',
          integrity: 'sha512-abc123',
          signatures: [],
          unpackedSize: 1000,
          fileCount: 10,
        },
        scripts: {},
      };

      const packageInfo: NpmPackageInfo = {
        name: 'test-package',
        'dist-tags': { latest: '1.0.0' },
        versions: { '1.0.0': versionInfo },
        maintainers: [],
        time: { '1.0.0': '2023-01-01T00:00:00.000Z' },
        users: {},
        description: 'Package description from package info',
        homepage: 'https://package.com',
        keywords: ['package'],
        license: 'Apache-2.0',
        author: 'Package Author',
        bugs: { url: 'https://github.com/package/package/issues' },
        repository: {
          type: 'git',
          url: 'https://github.com/package/package.git',
        },
        readme: 'README content',
        readmeFilename: 'README.md',
      };

      const result = buildPackageBasicInfo(versionInfo, packageInfo);

      expect(result.description).toBe('Package description from package info');
      expect(result.homepage).toBe('https://package.com');
      expect(result.license).toBe('Apache-2.0');
      expect(result.author).toBe('Package Author');
      expect(result.keywords).toEqual(['package']);
    });

    it('should handle bugs as string', () => {
      const versionInfo: NpmVersionInfo = {
        name: 'test-package',
        version: '1.0.0',
        bugs: 'https://github.com/test/test/issues',
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
        bundledDependencies: [],
        engines: {},
        os: [],
        cpu: [],
        dist: {
          shasum: 'abc123',
          tarball: 'https://registry.npmjs.org/test-package/-/test-package-1.0.0.tgz',
          integrity: 'sha512-abc123',
          signatures: [],
          unpackedSize: 1000,
          fileCount: 10,
        },
        scripts: {},
      };

      const packageInfo: NpmPackageInfo = {
        name: 'test-package',
        'dist-tags': { latest: '1.0.0' },
        versions: { '1.0.0': versionInfo },
        maintainers: [],
        time: { '1.0.0': '2023-01-01T00:00:00.000Z' },
        users: {},
        description: 'Package description',
        maintainers: [],
        readme: 'README content',
        readmeFilename: 'README.md',
      };

      const result = buildPackageBasicInfo(versionInfo, packageInfo);
      expect(result.bugs).toBe('https://github.com/test/test/issues');
    });

    it('should use default values when nothing is available', () => {
      const versionInfo: NpmVersionInfo = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
        bundledDependencies: [],
        engines: {},
        os: [],
        cpu: [],
        dist: {
          shasum: 'abc123',
          tarball: 'https://registry.npmjs.org/test-package/-/test-package-1.0.0.tgz',
          integrity: 'sha512-abc123',
          signatures: [],
          unpackedSize: 1000,
          fileCount: 10,
        },
        scripts: {},
      };

      const packageInfo: NpmPackageInfo = {
        name: 'test-package',
        'dist-tags': { latest: '1.0.0' },
        versions: { '1.0.0': versionInfo },
        maintainers: [],
        time: { '1.0.0': '2023-01-01T00:00:00.000Z' },
        users: {},
        readme: 'README content',
        readmeFilename: 'README.md',
      };

      const result = buildPackageBasicInfo(versionInfo, packageInfo);

      expect(result.description).toBe('No description available');
      expect(result.license).toBe('Unknown');
      expect(result.author).toBe('Unknown');
      expect(result.keywords).toEqual([]);
      expect(result.main).toBeUndefined();
      expect(result.types).toBeUndefined();
      expect(result.homepage).toBeUndefined();
      expect(result.bugs).toBeUndefined();
      expect(result.contributors).toBeUndefined();
    });
  });

  describe('buildRepositoryInfo', () => {
    it('should build repository info when available', () => {
      const versionInfo: NpmVersionInfo = {
        name: 'test-package',
        version: '1.0.0',
        repository: {
          type: 'git',
          url: 'https://github.com/test/test.git',
          directory: 'packages/core',
        },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
        bundledDependencies: [],
        engines: {},
        os: [],
        cpu: [],
        dist: {
          shasum: 'abc123',
          tarball: 'https://registry.npmjs.org/test-package/-/test-package-1.0.0.tgz',
          integrity: 'sha512-abc123',
          signatures: [],
          unpackedSize: 1000,
          fileCount: 10,
        },
        scripts: {},
      };

      const result = buildRepositoryInfo(versionInfo);

      expect(result).toEqual({
        type: 'git',
        url: 'https://github.com/test/test.git',
        directory: 'packages/core',
      });
    });

    it('should handle repository without directory', () => {
      const versionInfo: NpmVersionInfo = {
        name: 'test-package',
        version: '1.0.0',
        repository: {
          type: 'git',
          url: 'https://github.com/test/test.git',
        },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
        bundledDependencies: [],
        engines: {},
        os: [],
        cpu: [],
        dist: {
          shasum: 'abc123',
          tarball: 'https://registry.npmjs.org/test-package/-/test-package-1.0.0.tgz',
          integrity: 'sha512-abc123',
          signatures: [],
          unpackedSize: 1000,
          fileCount: 10,
        },
        scripts: {},
      };

      const result = buildRepositoryInfo(versionInfo);

      expect(result).toEqual({
        type: 'git',
        url: 'https://github.com/test/test.git',
        directory: undefined,
      });
    });

    it('should return undefined when no repository info', () => {
      const versionInfo: NpmVersionInfo = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
        bundledDependencies: [],
        engines: {},
        os: [],
        cpu: [],
        dist: {
          shasum: 'abc123',
          tarball: 'https://registry.npmjs.org/test-package/-/test-package-1.0.0.tgz',
          integrity: 'sha512-abc123',
          signatures: [],
          unpackedSize: 1000,
          fileCount: 10,
        },
        scripts: {},
      };

      const result = buildRepositoryInfo(versionInfo);
      expect(result).toBeUndefined();
    });
  });

  describe('buildInstallationInfo', () => {
    it('should build installation info', () => {
      const result = buildInstallationInfo('test-package');

      expect(result).toEqual({
        command: 'install test-package',
        alternatives: [
          'yarn add test-package',
          'pnpm add test-package',
        ],
      });
    });

    it('should handle scoped packages', () => {
      const result = buildInstallationInfo('@babel/core');

      expect(result).toEqual({
        command: 'install @babel/core',
        alternatives: [
          'yarn add @babel/core',
          'pnpm add @babel/core',
        ],
      });
    });
  });

  describe('buildNotFoundResponse', () => {
    it('should build not found response', () => {
      const result = buildNotFoundResponse('nonexistent-package', '1.0.0');

      expect(result).toEqual({
        package_name: 'nonexistent-package',
        version: '1.0.0',
        description: 'Package not found',
        readme_content: '',
        usage_examples: [],
        installation: {
          command: 'install nonexistent-package',
          alternatives: [
            'yarn add nonexistent-package',
            'pnpm add nonexistent-package',
          ],
        },
        basic_info: {
          name: 'nonexistent-package',
          version: '1.0.0',
          description: 'Package not found',
          license: 'Unknown',
          author: 'Unknown',
          keywords: [],
        },
        exists: false,
      });
    });

    it('should default to latest version when not specified', () => {
      const result = buildNotFoundResponse('nonexistent-package', '');

      expect(result.version).toBe('latest');
      expect(result.basic_info.version).toBe('latest');
    });

    it('should handle undefined version', () => {
      const result = buildNotFoundResponse('nonexistent-package', undefined as any);

      expect(result.version).toBe('latest');
      expect(result.basic_info.version).toBe('latest');
    });
  });
});