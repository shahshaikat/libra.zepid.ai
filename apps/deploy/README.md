# Zepid Deploy V2 - Queue-based Deployment Service

A modern, queue-based deployment service for the Zepid platform, built on Cloudflare Workers with Queues and R2 storage.

## Architecture

This service replaces the original Workflow-based deployment system with a more scalable queue-based architecture:

- **Queue Processing**: Uses Cloudflare Queues for asynchronous deployment job processing
- **State Management**: Hybrid storage using D1 for metadata and R2 for detailed logs/artifacts
- **Batch Processing**: Efficient batch processing with configurable concurrency limits
- **Error Handling**: Comprehensive error handling with dead letter queue support
- **Monitoring**: Built-in health checks and deployment status tracking

## Features

- ✅ Queue-based deployment processing
- ✅ Batch processing with concurrency control
- ✅ Comprehensive error handling and retry logic
- ✅ R2 storage for logs and artifacts
- ✅ D1 database for state management
- ✅ HTTP API for deployment management
- ✅ Health checks and monitoring endpoints
- ✅ Dead letter queue for failed deployments
- ✅ Deployment quota management
- ✅ TypeScript support with full type safety

## Quick Start

### Prerequisites

- Node.js 18+ and Bun
- Cloudflare account with Workers, Queues, R2, and D1 enabled
- Wrangler CLI installed and configured

### Installation

```bash
# Install dependencies
bun install

# Generate Cloudflare types
bun run cf-typegen

# Start development server
bun run dev
```

### Configuration

1. Update `wrangler.jsonc` with your Cloudflare account details
2. Create required R2 buckets:
   - `libra-deployment-logs`
   - `libra-deployment-artifacts`
3. Set up the deployment queue and dead letter queue
4. Configure environment variables

### Deployment

```bash
# Deploy to development
bun run deploy:dev

# Deploy to production
bun run deploy:prod
```

## API Endpoints

### Deployment Management

- `POST /deploy` - Queue a new deployment
- `GET /deploy/:id/status` - Get deployment status
- `GET /deploy/:id/logs` - Get deployment logs

### Monitoring

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check with dependency status
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Status and Statistics

- `GET /status` - Service status and statistics
- `GET /status/deployments` - List recent deployments
- `GET /status/queue` - Queue status and metrics
- `POST /status/cleanup` - Cleanup old deployment data

## Queue Configuration

The service uses two queues:

- **deployment-queue**: Main queue for deployment jobs
  - Max batch size: 10
  - Max batch timeout: 30 seconds
  - Max retries: 3

- **deployment-dlq**: Dead letter queue for failed jobs
  - Stores jobs that exceed retry limits
  - Used for debugging and manual intervention

## Storage

### D1 Database

Stores deployment metadata and state for quick queries:
- Deployment status and progress
- Error information
- Basic metadata

### R2 Storage

Stores detailed logs and artifacts:
- Step-by-step deployment logs
- Build artifacts and outputs
- Deployment history
- Error details and stack traces

## Development

### Project Structure

```
src/
├── api/                 # HTTP API routes and middleware
├── deployment/          # Deployment workflow and steps
│   └── steps/          # Individual deployment steps
├── queue/              # Queue consumer and producer
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
```

### Key Components

- **QueueDeploymentWorkflow**: Main deployment orchestrator
- **DeploymentStateManager**: State persistence and retrieval
- **Queue Consumer**: Batch processing of deployment jobs

### Testing

```bash
# Run type checking
bun run typecheck

# Run tests (when implemented)
bun run test

# Run tests with coverage
bun run test:coverage
```

## Migration from V1

This service is designed to be a drop-in replacement for the original Workflow-based deployment service:

1. **API Compatibility**: HTTP endpoints remain the same
2. **Response Format**: Response formats are maintained for backward compatibility
3. **Error Codes**: Error codes and messages are consistent
4. **Deployment Flow**: The six-step deployment process is preserved

### Key Differences

- **Asynchronous Processing**: Deployments are queued instead of processed immediately
- **Better Scalability**: Queue-based processing allows for better resource utilization
- **Enhanced Monitoring**: More detailed logging and monitoring capabilities
- **Improved Error Handling**: Better error categorization and retry logic

## Configuration

### Environment Variables

Required:
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with appropriate permissions

Optional:
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `MAX_CONCURRENT_DEPLOYMENTS`: Maximum concurrent deployments (default: 5)
- `MAX_DEPLOYMENT_TIMEOUT`: Maximum deployment timeout in ms (default: 600000)

### Queue Settings

Configure in `wrangler.jsonc`:
- `max_batch_size`: Maximum messages per batch (default: 10)
- `max_batch_timeout`: Maximum batch wait time in seconds (default: 30)
- `max_retries`: Maximum retry attempts (default: 3)

## Monitoring and Observability

The service includes comprehensive monitoring:

- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Health Checks**: Multiple health check endpoints for different use cases
- **Metrics**: Deployment statistics and queue metrics
- **Error Tracking**: Detailed error logging with context

## Security

- **Input Validation**: All inputs are validated and sanitized
- **Error Handling**: Errors are logged but sensitive information is not exposed
- **Quota Management**: Deployment quotas are enforced per organization
- **Access Control**: Integration with existing authentication system

## Support

For issues and questions:
1. Check the logs in R2 storage
2. Use the health check endpoints to diagnose issues
3. Review the deployment status API for detailed error information
4. Check the dead letter queue for failed deployments

## License

AGPL-3.0-only - See LICENSE file for details.
