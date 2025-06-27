import {
  NpmPackageInfo,
  NpmVersionInfo,
  PackageBasicInfo,
  RepositoryInfo,
  InstallationInfo,
} from '../types/index.js';

export function buildPackageBasicInfo(
  versionInfo: NpmVersionInfo,
  packageInfo: NpmPackageInfo
): PackageBasicInfo {
  return {
    name: versionInfo.name,
    version: versionInfo.version,
    description: versionInfo.description || packageInfo.description || 'No description available',
    main: versionInfo.main || undefined,
    types: versionInfo.types || undefined,
    homepage: versionInfo.homepage || packageInfo.homepage || undefined,
    bugs: typeof versionInfo.bugs === 'string' ? versionInfo.bugs : versionInfo.bugs?.url || undefined,
    license: versionInfo.license || packageInfo.license || 'Unknown',
    author: versionInfo.author || packageInfo.author || 'Unknown',
    contributors: versionInfo.contributors || undefined,
    keywords: versionInfo.keywords || packageInfo.keywords || [],
  };
}

export function buildRepositoryInfo(versionInfo: NpmVersionInfo): RepositoryInfo | undefined {
  if (!versionInfo.repository) {
    return undefined;
  }

  return {
    type: versionInfo.repository.type,
    url: versionInfo.repository.url,
    directory: versionInfo.repository.directory || undefined,
  };
}

export function buildInstallationInfo(packageName: string): InstallationInfo {
  return {
    command: `install ${packageName}`,
    alternatives: [`yarn add ${packageName}`, `pnpm add ${packageName}`],
  };
}

export function buildNotFoundResponse(packageName: string, version: string) {
  return {
    package_name: packageName,
    version: version || 'latest',
    description: 'Package not found',
    readme_content: '',
    usage_examples: [],
    installation: buildInstallationInfo(packageName),
    basic_info: {
      name: packageName,
      version: version || 'latest',
      description: 'Package not found',
      license: 'Unknown',
      author: 'Unknown',
      keywords: [],
    },
    exists: false,
  };
}