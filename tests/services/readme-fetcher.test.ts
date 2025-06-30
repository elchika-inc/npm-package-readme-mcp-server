import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchReadmeContent } from '../../src/services/readme-fetcher.js';
import { NpmPackageInfo, NpmVersionInfo } from '../../src/types/index.js';

// Mock the github-api module
vi.mock('../../src/services/github-api.js', () => ({
  githubApi: {
    getReadmeFromRepository: vi.fn(),
  },
}));

import { githubApi } from '../../src/services/github-api.js';

describe('readme-fetcher', () => {
  const mockGithubApi = githubApi as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('fetchReadmeContent', () => {
    it('should return README from npm registry when available', async () => {
      const packageInfo: NpmPackageInfo = {
        name: 'test-package',
        'dist-tags': { latest: '1.0.0' },
        versions: {},
        maintainers: [],
        time: {},
        users: {},
        readme: '# Test Package\n\nThis is a test package.',
        readmeFilename: 'README.md',
      };

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

      const result = await fetchReadmeContent(packageInfo, versionInfo);

      expect(result).toEqual({
        content: '# Test Package\n\nThis is a test package.',
        source: 'npm',
      });
      expect(mockGithubApi.getReadmeFromRepository).not.toHaveBeenCalled();
    });

    it('should fallback to GitHub when npm README is not available', async () => {
      const packageInfo: NpmPackageInfo = {
        name: 'test-package',
        'dist-tags': { latest: '1.0.0' },
        versions: {},
        maintainers: [],
        time: {},
        users: {},
      };

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

      mockGithubApi.getReadmeFromRepository.mockResolvedValueOnce('# GitHub README\n\nFrom GitHub repo.');

      const result = await fetchReadmeContent(packageInfo, versionInfo);

      expect(result).toEqual({
        content: '# GitHub README\n\nFrom GitHub repo.',
        source: 'github',
      });
      expect(mockGithubApi.getReadmeFromRepository).toHaveBeenCalledWith({
        type: 'git',
        url: 'https://github.com/test/test.git',
      });
    });

    it('should return empty content when no README is available', async () => {
      const packageInfo: NpmPackageInfo = {
        name: 'test-package',
        'dist-tags': { latest: '1.0.0' },
        versions: {},
        maintainers: [],
        time: {},
        users: {},
      };

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

      const result = await fetchReadmeContent(packageInfo, versionInfo);

      expect(result).toEqual({
        content: '',
        source: 'none',
      });
      expect(mockGithubApi.getReadmeFromRepository).not.toHaveBeenCalled();
    });

    it('should return empty content when no repository info is available', async () => {
      const packageInfo: NpmPackageInfo = {
        name: 'test-package',
        'dist-tags': { latest: '1.0.0' },
        versions: {},
        maintainers: [],
        time: {},
        users: {},
      };

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

      const result = await fetchReadmeContent(packageInfo, versionInfo);

      expect(result).toEqual({
        content: '',
        source: 'none',
      });
      expect(mockGithubApi.getReadmeFromRepository).not.toHaveBeenCalled();
    });

    it('should handle GitHub API errors gracefully', async () => {
      const packageInfo: NpmPackageInfo = {
        name: 'test-package',
        'dist-tags': { latest: '1.0.0' },
        versions: {},
        maintainers: [],
        time: {},
        users: {},
      };

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

      mockGithubApi.getReadmeFromRepository.mockRejectedValueOnce(new Error('GitHub API error'));

      const result = await fetchReadmeContent(packageInfo, versionInfo);

      expect(result).toEqual({
        content: '',
        source: 'none',
      });
    });

    it('should prefer npm README over GitHub when both are available', async () => {
      const packageInfo: NpmPackageInfo = {
        name: 'test-package',
        'dist-tags': { latest: '1.0.0' },
        versions: {},
        maintainers: [],
        time: {},
        users: {},
        readme: '# NPM README\n\nFrom npm registry.',
        readmeFilename: 'README.md',
      };

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

      mockGithubApi.getReadmeFromRepository.mockResolvedValueOnce('# GitHub README\n\nFrom GitHub repo.');

      const result = await fetchReadmeContent(packageInfo, versionInfo);

      expect(result).toEqual({
        content: '# NPM README\n\nFrom npm registry.',
        source: 'npm',
      });
      expect(mockGithubApi.getReadmeFromRepository).not.toHaveBeenCalled();
    });

    it('should handle empty GitHub README response', async () => {
      const packageInfo: NpmPackageInfo = {
        name: 'test-package',
        'dist-tags': { latest: '1.0.0' },
        versions: {},
        maintainers: [],
        time: {},
        users: {},
      };

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

      mockGithubApi.getReadmeFromRepository.mockResolvedValueOnce(null);

      const result = await fetchReadmeContent(packageInfo, versionInfo);

      expect(result).toEqual({
        content: '',
        source: 'none',
      });
      expect(mockGithubApi.getReadmeFromRepository).toHaveBeenCalledWith({
        type: 'git',
        url: 'https://github.com/test/test.git',
      });
    });
  });
});