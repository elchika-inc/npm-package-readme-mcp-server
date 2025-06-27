import { logger } from '../utils/logger.js';
import { githubApi } from './github-api.js';
import { NpmPackageInfo, NpmVersionInfo } from '../types/index.js';

export interface ReadmeResult {
  content: string;
  source: 'npm' | 'github' | 'none';
}

export async function fetchReadmeContent(
  packageInfo: NpmPackageInfo,
  versionInfo: NpmVersionInfo
): Promise<ReadmeResult> {
  const packageName = versionInfo.name;
  
  // First, try to get README from npm registry
  if (packageInfo.readme) {
    logger.debug(`Got README from npm registry: ${packageName}`);
    return {
      content: packageInfo.readme,
      source: 'npm',
    };
  }

  // If no README in npm registry, try GitHub as fallback
  if (versionInfo.repository) {
    try {
      const githubReadme = await githubApi.getReadmeFromRepository(versionInfo.repository);
      if (githubReadme) {
        logger.debug(`Got README from GitHub: ${packageName}`);
        return {
          content: githubReadme,
          source: 'github',
        };
      }
    } catch (error) {
      logger.debug(`Failed to fetch README from GitHub for ${packageName}`, { error });
    }
  }

  logger.debug(`No README found for: ${packageName}`);
  return {
    content: '',
    source: 'none',
  };
}