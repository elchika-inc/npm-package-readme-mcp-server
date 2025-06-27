import { logger } from '../utils/logger.js';
import { validatePackageName, validateVersion } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { npmRegistry } from '../services/npm-registry.js';
import { readmeParser } from '../services/readme-parser.js';
import { fetchReadmeContent } from '../services/readme-fetcher.js';
import {
  buildPackageBasicInfo,
  buildRepositoryInfo,
  buildInstallationInfo,
  buildNotFoundResponse,
} from '../services/package-info-builder.js';
import {
  GetPackageReadmeParams,
  PackageReadmeResponse,
} from '../types/index.js';

export async function getPackageReadme(params: GetPackageReadmeParams): Promise<PackageReadmeResponse> {
  const { package_name, version = 'latest', include_examples = true } = params;

  logger.info(`Fetching package README: ${package_name}@${version}`);

  // Validate inputs
  validatePackageName(package_name);
  if (version !== 'latest') {
    validateVersion(version);
  }

  // Check cache first
  const cacheKey = createCacheKey.packageReadme(package_name, version);
  const cached = cache.get<PackageReadmeResponse>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for package README: ${package_name}@${version}`);
    return cached;
  }

  try {
    const { packageInfo, versionInfo } = await getPackageAndVersionInfo(package_name, version);
    
    if (!packageInfo || !versionInfo) {
      logger.debug(`Package not found: ${package_name}`);
      return buildNotFoundResponse(package_name, version);
    }
    
    logger.debug(`Package info retrieved for: ${package_name}`);
    const actualVersion = versionInfo.version;

    // Get README content
    const { content: readmeContent, source: readmeSource } = await fetchReadmeContent(packageInfo, versionInfo);

    // Process README content
    const cleanedReadme = readmeParser.cleanMarkdown(readmeContent);
    const usageExamples = readmeParser.parseUsageExamples(readmeContent, include_examples);

    // Build response components
    const installation = buildInstallationInfo(package_name);
    const basicInfo = buildPackageBasicInfo(versionInfo, packageInfo);
    const repository = buildRepositoryInfo(versionInfo);

    // Create response
    const response: PackageReadmeResponse = {
      package_name,
      version: actualVersion,
      description: basicInfo.description,
      readme_content: cleanedReadme,
      usage_examples: usageExamples,
      installation,
      basic_info: basicInfo,
      repository,
      exists: true,
    };

    // Cache the response
    cache.set(cacheKey, response);

    logger.info(`Successfully fetched package README: ${package_name}@${actualVersion} (README source: ${readmeSource})`);
    return response;

  } catch (error) {
    logger.error(`Failed to fetch package README: ${package_name}@${version}`, { error });
    throw error;
  }
}

async function getPackageAndVersionInfo(packageName: string, version: string) {
  try {
    logger.debug(`Getting package info for: ${packageName}`);
    const packageInfo = await npmRegistry.getPackageInfo(packageName);
    const versionInfo = await npmRegistry.getVersionInfo(packageName, version);
    return { packageInfo, versionInfo };
  } catch (error) {
    return { packageInfo: null, versionInfo: null };
  }
}