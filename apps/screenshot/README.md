# Zepid Screenshot Service - Queue-based Screenshot Service

A modern, queue-based screenshot service for the Zepid platform, built on Cloudflare Workers with Queues and R2 storage.

## Architecture

This service provides asynchronous screenshot capture for project previews using a simplified queue-based architecture:

- **Queue Processing**: Uses Cloudflare Queues for asynchronous screenshot job processing
- **Simplified Design**: No complex state management - direct database updates when complete
- **Batch Processing**: Efficient batch processing with configurable concurrency limits
- **Error Handling**: Comprehensive error handling with dead letter queue support
- **Monitoring**: Built-in health checks and logging

## Features

### Core Functionality
- **Asynchronous Screenshot Capture**: Queue-based processing eliminates timeout limitations
- **Sandbox Integration**: Reuses existing sandbox infrastructure for project preparation
- **CDN Storage**: Automatic upload and management of screenshots in CDN
- **Direct Database Updates**: Updates project previewImageUrl when screenshot completes

### Technical Features
- **Producer-Consumer Pattern**: Scalable architecture for high-throughput processing
- **Retry Logic**: Automatic retry with exponential backoff for failed screenshots
- **Dead Letter Queue**: Failed jobs are moved to DLQ for manual inspection
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Health Monitoring**: Comprehensive health checks and metrics

## API Endpoints

### Screenshot Operations
- `POST /screenshot` - Submit a new screenshot request
- `GET /screenshot-status?id=<screenshotId>` - Get basic screenshot status (simplified)
- `GET /health` - Service health check

### Request Format
```json
{
  "projectId": "string",
  "planId": "string", 
  "orgId": "string",
  "userId": "string",
  "previewUrl": "string (optional)"
}
```

### Response Format
```json
{
  "success": boolean,
  "screenshotId": "string",
  "message": "string"
}
```

## Development

### Prerequisites
- Node.js 18+
- Bun package manager
- Cloudflare account with Workers enabled
- Wrangler CLI

### Setup
1. Copy configuration:
   ```bash
   cp wrangler.jsonc.example wrangler.jsonc
   ```

2. Update configuration with your credentials

3. Install dependencies:
   ```bash
   bun install
   ```

4. Start development server:
   ```bash
   bun run dev
   ```

### Testing
```bash
# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Type checking
bun run typecheck
```

### Deployment
```bash
# Deploy to development
bun run deploy:dev

# Deploy to production
bun run deploy:prod
```

## Configuration

### Environment Variables
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `MAX_SCREENSHOT_TIMEOUT` - Maximum screenshot timeout (ms)
- `MAX_CONCURRENT_SCREENSHOTS` - Maximum concurrent screenshots

### Queue Configuration
- `SCREENSHOT_QUEUE_NAME` - Main processing queue
- `SCREENSHOT_DLQ_NAME` - Dead letter queue for failed jobs
- Max retries: 2
- Max concurrency: 3

## Integration

This service is designed to replace the synchronous screenshot handling in `updateContainerContent`. Instead of calling `handleAsyncScreenshot` directly, the API will submit requests to this service.

### Migration Path
1. Deploy screenshot service
2. Update `updateContainerContent` to call screenshot service API
3. Remove old `handleAsyncScreenshot` logic
4. Monitor and validate functionality

## Monitoring

The service provides comprehensive monitoring through:
- Cloudflare Workers Analytics
- Custom metrics and logging
- Health check endpoints
- Queue backlog monitoring

## License

AGPL-3.0-only
