import { BasePackageServer, ToolDefinition, ResponseFormatter, createLogger } from '@elchika-inc/package-readme-shared';
import { getPackageReadme } from './tools/get-package-readme.js';
import { getPackageInfo } from './tools/get-package-info.js';
import { searchPackages } from './tools/search-packages.js';
import {
  validateGetPackageReadmeParams,
  validateGetPackageInfoParams,
  validateSearchPackagesParams,
} from './utils/parameter-validators.js';

const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  get_readme_from_npm: {
    name: 'get_readme_from_npm',
    description: 'Get package README and usage examples from npm registry',
    inputSchema: {
      type: 'object',
      properties: {
        package_name: {
          type: 'string',
          description: 'The name of the npm package',
        },
        version: {
          type: 'string',
          description: 'The version of the package (default: "latest")',
          default: 'latest',
        },
        include_examples: {
          type: 'boolean',
          description: 'Whether to include usage examples (default: true)',
          default: true,
        },
      },
      required: ['package_name'],
    },
  },
  get_package_info_from_npm: {
    name: 'get_package_info_from_npm',
    description: 'Get package basic information and dependencies from npm registry',
    inputSchema: {
      type: 'object',
      properties: {
        package_name: {
          type: 'string',
          description: 'The name of the npm package',
        },
        include_dependencies: {
          type: 'boolean',
          description: 'Whether to include dependencies (default: true)',
          default: true,
        },
        include_dev_dependencies: {
          type: 'boolean',
          description: 'Whether to include development dependencies (default: false)',
          default: false,
        },
      },
      required: ['package_name'],
    },
  },
  search_packages_from_npm: {
    name: 'search_packages_from_npm',
    description: 'Search for packages in npm registry',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)',
          default: 20,
          minimum: 1,
          maximum: 250,
        },
        quality: {
          type: 'number',
          description: 'Minimum quality score (0-1)',
          minimum: 0,
          maximum: 1,
        },
        popularity: {
          type: 'number',
          description: 'Minimum popularity score (0-1)',
          minimum: 0,
          maximum: 1,
        },
      },
      required: ['query'],
    },
  },
};

export class PackageReadmeMcpServer extends BasePackageServer {
  protected logger = createLogger({ silent: true });

  constructor() {
    super({
      name: 'package-readme-mcp',
      version: '1.0.0',
    });
  }

  protected getToolDefinitions(): Record<string, ToolDefinition> {
    return TOOL_DEFINITIONS;
  }

  protected async handleToolCall(name: string, args: unknown): Promise<unknown> {
    try {
      switch (name) {
        case 'get_readme_from_npm':
          return await getPackageReadme(validateGetPackageReadmeParams(args));
        
        case 'get_package_info_from_npm':
          return await getPackageInfo(validateGetPackageInfoParams(args));
        
        case 'search_packages_from_npm':
          return await searchPackages(validateSearchPackagesParams(args));
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      this.logger.error(`Tool execution failed: ${name}`, { error: String(error) });
      throw error;
    }
  }


}

export default PackageReadmeMcpServer;