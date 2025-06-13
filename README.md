# package-readme-mcp-server

An MCP server that retrieves README files and usage information for any package from the official npm registry.

## Features

- **get_package_readme**: Retrieve README and usage examples for npm packages
- **get_package_info**: Get basic information and dependencies for npm packages
- **search_packages**: Search for npm packages

## Setup

Add the following to your MCP client configuration file:

```json
{
  "mcpServers": {
    "package-readme": {
      "command": "npx",
      "args": ["package-readme-mcp-server"]
    }
  }
}
```

## Usage

### Get Package README

```
get_package_readme({ "package_name": "react" })
```

### Get Package Information

```
get_package_info({ "package_name": "express" })
```

### Search Packages

```
search_packages({ "query": "testing framework", "limit": 10 })
```

## Environment Variables

- `LOG_LEVEL`: Log level (ERROR, WARN, INFO, DEBUG)
- `CACHE_TTL`: Cache expiration time (seconds)
- `REQUEST_TIMEOUT`: Request timeout (milliseconds)
- `GITHUB_TOKEN`: GitHub API token (optional, to avoid rate limits)
