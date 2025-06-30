import { 
  NpmPackageInfo, 
  NpmVersionInfo, 
  NpmSearchResponse,
  VersionNotFoundError,
} from '../types/index.js';

export class NpmRegistryClient {
  private readonly baseUrl = 'https://registry.npmjs.org';
  private readonly searchUrl = 'https://registry.npmjs.org/-/v1/search';

  async packageExists(packageName: string): Promise<boolean> {
    try {
      await this.getPackageInfo(packageName);
      return true;
    } catch {
      return false;
    }
  }

  async getPackageInfo(packageName: string): Promise<NpmPackageInfo> {
    const url = `${this.baseUrl}/${encodeURIComponent(packageName)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Package not found: ${packageName}`);
    }
    
    return response.json();
  }

  async getVersionInfo(packageName: string, version: string): Promise<NpmVersionInfo> {
    const packageInfo = await this.getPackageInfo(packageName);
    
    const actualVersion = version === 'latest' 
      ? packageInfo['dist-tags'].latest 
      : (packageInfo['dist-tags'][version] || version);

    const versionInfo = packageInfo.versions[actualVersion];
    if (!versionInfo) {
      throw new VersionNotFoundError(packageName, version);
    }

    return versionInfo;
  }

  async searchPackages(query: string, limit: number = 20): Promise<NpmSearchResponse> {
    const url = `${this.searchUrl}?text=${encodeURIComponent(query)}&size=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Search failed: ${query}`);
    }
    
    return response.json();
  }

  async getAllDownloadStats(): Promise<{ last_day: number; last_week: number; last_month: number; }> {
    return { last_day: 0, last_week: 0, last_month: 0 };
  }
}

export const npmRegistry = new NpmRegistryClient();