import {
  GetPackageReadmeParams,
  GetPackageInfoParams,
  SearchPackagesParams,
} from '../types/index.js';

export function validateGetPackageReadmeParams(args: unknown): GetPackageReadmeParams {
  if (!args || typeof args !== 'object') {
    throw new Error('Arguments must be an object');
  }

  const params = args as Record<string, unknown>;

  if (!params.package_name || typeof params.package_name !== 'string') {
    throw new Error('package_name is required and must be a string');
  }

  const result: GetPackageReadmeParams = {
    package_name: params.package_name,
  };
  
  if (params.version !== undefined) {
    if (typeof params.version !== 'string') {
      throw new Error('version must be a string');
    }
    result.version = params.version;
  }
  
  if (params.include_examples !== undefined) {
    if (typeof params.include_examples !== 'boolean') {
      throw new Error('include_examples must be a boolean');
    }
    result.include_examples = params.include_examples;
  }
  
  return result;
}

export function validateGetPackageInfoParams(args: unknown): GetPackageInfoParams {
  if (!args || typeof args !== 'object') {
    throw new Error('Arguments must be an object');
  }

  const params = args as Record<string, unknown>;

  if (!params.package_name || typeof params.package_name !== 'string') {
    throw new Error('package_name is required and must be a string');
  }

  const result: GetPackageInfoParams = {
    package_name: params.package_name,
  };
  
  if (params.include_dependencies !== undefined) {
    if (typeof params.include_dependencies !== 'boolean') {
      throw new Error('include_dependencies must be a boolean');
    }
    result.include_dependencies = params.include_dependencies;
  }
  
  if (params.include_dev_dependencies !== undefined) {
    if (typeof params.include_dev_dependencies !== 'boolean') {
      throw new Error('include_dev_dependencies must be a boolean');
    }
    result.include_dev_dependencies = params.include_dev_dependencies;
  }
  
  return result;
}

export function validateSearchPackagesParams(args: unknown): SearchPackagesParams {
  if (!args || typeof args !== 'object') {
    throw new Error('Arguments must be an object');
  }

  const params = args as Record<string, unknown>;

  if (!params.query || typeof params.query !== 'string') {
    throw new Error('query is required and must be a string');
  }

  if (params.limit !== undefined) {
    if (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 250) {
      throw new Error('limit must be a number between 1 and 250');
    }
  }

  if (params.quality !== undefined) {
    if (typeof params.quality !== 'number' || params.quality < 0 || params.quality > 1) {
      throw new Error('quality must be a number between 0 and 1');
    }
  }

  if (params.popularity !== undefined) {
    if (typeof params.popularity !== 'number' || params.popularity < 0 || params.popularity > 1) {
      throw new Error('popularity must be a number between 0 and 1');
    }
  }

  const result: SearchPackagesParams = {
    query: params.query,
  };
  
  if (params.limit !== undefined) {
    result.limit = params.limit;
  }
  
  if (params.quality !== undefined) {
    result.quality = params.quality;
  }
  
  if (params.popularity !== undefined) {
    result.popularity = params.popularity;
  }
  
  return result;
}