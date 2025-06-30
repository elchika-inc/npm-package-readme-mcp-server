import { PackageReadmeMcpError } from '../types/index.js';

export function validatePackageName(packageName: string): void {
  if (!packageName || typeof packageName !== 'string') {
    throw new PackageReadmeMcpError('Package name is required', 'INVALID_PACKAGE_NAME');
  }

  const trimmed = packageName.trim();
  if (trimmed.length === 0 || trimmed.length > 214) {
    throw new PackageReadmeMcpError('Invalid package name length', 'INVALID_PACKAGE_NAME');
  }

  // Basic npm package name validation - let npm registry handle detailed validation
  if (!/^(@[a-z0-9-._~]+\/)?[a-z0-9-._~]+$/i.test(trimmed)) {
    throw new PackageReadmeMcpError('Invalid package name format', 'INVALID_PACKAGE_NAME');
  }
}

export function validateVersion(version: string): void {
  if (!version || typeof version !== 'string' || version.trim().length === 0) {
    throw new PackageReadmeMcpError('Invalid version', 'INVALID_VERSION');
  }
}

export function validateSearchQuery(query: string): void {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new PackageReadmeMcpError('Search query is required', 'INVALID_SEARCH_QUERY');
  }
}

export function validateLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 1 || limit > 250) {
    throw new PackageReadmeMcpError('Invalid limit value', 'INVALID_LIMIT');
  }
}

export function validateScore(score: number, name: string): void {
  if (typeof score !== 'number' || score < 0 || score > 1) {
    throw new PackageReadmeMcpError('Invalid score value', 'INVALID_SCORE');
  }
}