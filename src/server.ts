import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { logger } from './utils/logger.js';
import { getPackageReadme } from './tools/get-package-readme.js';
import { getPackageInfo } from './tools/get-package-info.js';
import { searchPackages } from './tools/search-packages.js';
import {
  GetPackageReadmeParams,
  GetPackageInfoParams,
  SearchPackagesParams,
  PackageReadmeMcpError,
} from './types/index.js';

const TOOL_DEFINITIONS = {
  get_package_readme: {
    name: 'get_package_readme',
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
  get_package_info: {
    name: 'get_package_info',
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
  search_packages: {
    name: 'search_packages',
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
} as const;

export class PackageReadmeMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'package-readme-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Object.values(TOOL_DEFINITIONS),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      

      try {
        // Validate that args is an object
        if (!args || typeof args !== 'object') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Tool arguments must be an object'
          );
        }

        switch (name) {
          case 'get_package_readme':
            return await this.handleGetPackageReadme(args as unknown as GetPackageReadmeParams);
          
          case 'get_package_info':
            return await this.handleGetPackageInfo(args as unknown as GetPackageInfoParams);
          
          case 'search_packages':
            return await this.handleSearchPackages(args as unknown as SearchPackagesParams);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        logger.error(`Tool execution failed: ${name}`, { error, args });
        
        if (error instanceof PackageReadmeMcpError) {
          throw new McpError(
            this.mapErrorCode(error.code),
            error.message,
            error.details
          );
        }
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Internal error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleGetPackageReadme(params: GetPackageReadmeParams) {
    // Validate required parameters
    if (!params.package_name || typeof params.package_name !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'package_name is required and must be a string'
      );
    }

    const result = await getPackageReadme(params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGetPackageInfo(params: GetPackageInfoParams) {
    // Validate required parameters
    if (!params.package_name || typeof params.package_name !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'package_name is required and must be a string'
      );
    }

    const result = await getPackageInfo(params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSearchPackages(params: SearchPackagesParams) {
    // Validate required parameters
    if (!params.query || typeof params.query !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'query is required and must be a string'
      );
    }

    // Validate optional parameters
    if (params.limit !== undefined && (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 250)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'limit must be a number between 1 and 250'
      );
    }

    if (params.quality !== undefined && (typeof params.quality !== 'number' || params.quality < 0 || params.quality > 1)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'quality must be a number between 0 and 1'
      );
    }

    if (params.popularity !== undefined && (typeof params.popularity !== 'number' || params.popularity < 0 || params.popularity > 1)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'popularity must be a number between 0 and 1'
      );
    }

    const result = await searchPackages(params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private mapErrorCode(code: string): ErrorCode {
    switch (code) {
      case 'PACKAGE_NOT_FOUND':
      case 'VERSION_NOT_FOUND':
        return ErrorCode.InvalidRequest;
      case 'INVALID_PACKAGE_NAME':
      case 'INVALID_VERSION':
      case 'INVALID_SEARCH_QUERY':
      case 'INVALID_LIMIT':
      case 'INVALID_SCORE':
        return ErrorCode.InvalidParams;
      case 'RATE_LIMIT_EXCEEDED':
        return ErrorCode.InternalError; // Could be a custom error code
      case 'NETWORK_ERROR':
        return ErrorCode.InternalError;
      default:
        return ErrorCode.InternalError;
    }
  }

  async run(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
    } catch (error) {
      logger.error('Failed to start server transport', { error });
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
}

export default PackageReadmeMcpServer;