import { PackageReadmeMcpError } from '../types/index.js';

export function validatePackageName(packageName: string): void {
  if (!packageName || typeof packageName !== 'string') {
    throw new PackageReadmeMcpError('Package name is required and must be a string', 'INVALID_PACKAGE_NAME');
  }

  const trimmed = packageName.trim();
  if (trimmed.length === 0) {
    throw new PackageReadmeMcpError('Package name cannot be empty', 'INVALID_PACKAGE_NAME');
  }

  if (trimmed.length > 214) {
    throw new PackageReadmeMcpError('Package name cannot exceed 214 characters', 'INVALID_PACKAGE_NAME');
  }

  // npm package name validation rules
  if (!/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(trimmed)) {
    throw new PackageReadmeMcpError(
      'Package name contains invalid characters. Must start with lowercase letters, numbers, or hyphens and can contain dots, underscores, and tildes',
      'INVALID_PACKAGE_NAME'
    );
  }

  // Check for invalid sequences
  if (trimmed.includes('..') || trimmed.includes('_-') || trimmed.includes('-_')) {
    throw new PackageReadmeMcpError('Package name contains invalid character sequences', 'INVALID_PACKAGE_NAME');
  }

  if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
    throw new PackageReadmeMcpError('Package name cannot start or end with a dot', 'INVALID_PACKAGE_NAME');
  }
}

export function validateVersion(version: string): void {
  if (!version || typeof version !== 'string') {
    throw new PackageReadmeMcpError('Version must be a string', 'INVALID_VERSION');
  }

  const trimmed = version.trim();
  if (trimmed.length === 0) {
    throw new PackageReadmeMcpError('Version cannot be empty', 'INVALID_VERSION');
  }

  // Allow "latest" and other dist-tags
  if (trimmed === 'latest' || trimmed === 'next' || trimmed === 'beta' || trimmed === 'alpha') {
    return;
  }

  // Validate semantic version
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  if (!semverRegex.test(trimmed)) {
    throw new PackageReadmeMcpError(
      'Version must be a valid semantic version (e.g., 1.0.0) or a dist-tag (e.g., latest)',
      'INVALID_VERSION'
    );
  }
}

export function validateSearchQuery(query: string): void {
  if (!query || typeof query !== 'string') {
    throw new PackageReadmeMcpError('Search query is required and must be a string', 'INVALID_SEARCH_QUERY');
  }

  const trimmed = query.trim();
  if (trimmed.length === 0) {
    throw new PackageReadmeMcpError('Search query cannot be empty', 'INVALID_SEARCH_QUERY');
  }

  if (trimmed.length > 250) {
    throw new PackageReadmeMcpError('Search query cannot exceed 250 characters', 'INVALID_SEARCH_QUERY');
  }
}

export function validateLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 1 || limit > 250) {
    throw new PackageReadmeMcpError('Limit must be an integer between 1 and 250', 'INVALID_LIMIT');
  }
}

export function validateScore(score: number, name: string): void {
  if (typeof score !== 'number' || score < 0 || score > 1) {
    throw new PackageReadmeMcpError(`${name} must be a number between 0 and 1`, 'INVALID_SCORE');
  }
}