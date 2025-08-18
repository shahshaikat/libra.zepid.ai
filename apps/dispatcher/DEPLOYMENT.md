# Dispatcher Deployment Guide - Scheme A (Wildcard Subdomain Routing)

## Overview

This dispatcher application has implemented a wildcard subdomain routing system. Users can directly access the corresponding Worker through subdomains like `*.libra.sh`.

## Architecture Process

```
User Request: https://vite-shadcn-template.libra.sh/

↓

Cloudflare DNS: *.libra.sh → libra-dispatcher Worker

↓

Dispatcher resolves subdomain: "vite-shadcn-template"

↓

Call: env.dispatcher.get("vite-shadcn-template")

↓

Forward request to user Worker
```

## Deployment Steps

### 1. Deploy Dispatcher Worker

```bash
cd apps/dispatcher
wrangler deploy
```

This will automatically apply the routing configuration in `wrangler.jsonc`:

```json
"routes": [
  {
    "pattern": "*.libra.sh/*",
    "zone_name": "libra.sh"
  }
]
```

**Important**: Using object format routing configuration is to support wildcard SSL in SaaS mode. You must specify `zone_name` to avoid 10082 error during deployment.

### 2. Configure DNS

Add the following DNS record in Cloudflare Dashboard for `libra.sh` domain:

```
Type: CNAME
Name: *
Target: libra-dispatcher.<your-account>.workers.dev
Proxy Status: Proxied (orange cloud)
```

### 3. Deploy User Worker

Deploy Worker for each project to dispatch namespace:

```bash
# Example: Deploy vite-shadcn-template project
wrangler deploy --name vite-shadcn-template --dispatch-namespace libra-dispatcher

# Example: Deploy other projects
wrangler deploy --name my-react-app --dispatch-namespace libra-dispatcher
```

### 4. Verify Deployment

After deployment, you can access:

- `https://vite-shadcn-template.libra.sh/` → Worker "vite-shadcn-template"
- `https://my-react-app.libra.sh/` → Worker "my-react-app"

## Configuration File Description

### Key Configuration in wrangler.jsonc

```json
{
  "name": "libra-dispatcher",
  "dispatch_namespaces": [
    {
      "binding": "dispatcher",
      "namespace": "libra-dispatcher"
    }
  ],
  "routes": [
    {
      "pattern": "*.libra.sh/*",
      "zone_name": "libra.sh"
    }
  ]
}
```

### Supported Domains

The current configuration supports subdomain routing for the following domains:

- `*.libra.sh` (production environment)
- `*.dispatcher.zepid.dev` (testing environment)
- `*.localhost` (local development)

## Reserved Subdomains

The following subdomains are reserved and cannot be used as Worker names:

- `dispatcher`
- `api`
- `health`
- `admin`
- `system`
- `www`
- `mail`
- `ftp`
- `cdn`
- `assets`
- `static`

## Worker Name Rules

- Only letters, numbers, and hyphens are allowed
- Length should not exceed 63 characters
- Cannot start or end with a hyphen
- Cannot use reserved names

## Error Handling

Dispatcher provides detailed error information:

- **404 Worker not found**: Worker does not exist in dispatch namespace
- **400 Invalid worker name**: Subdomain does not meet naming rules
- **400 No subdomain specified**: No subdomain provided
- **404 Unsupported domain**: Domain is not in the support list

## Monitoring and Debugging

- View Dispatcher information: `GET /dispatch`
- Health check: `GET /health`
- View logs: Cloudflare Dashboard → Workers → libra-dispatcher → Logs

## Troubleshooting

### 1. Subdomain is not accessible

Check:

- DNS configuration is correct
- Worker is deployed to the correct dispatch namespace
- Subdomain meets naming rules

### 2. Worker deployment failed

Check:

- Dispatch namespace name is correct
- Worker name meets rules
- Sufficient permissions

### 3. Routing is not effective

Check:

- Routes configuration in wrangler.jsonc
- Routing settings in Cloudflare Dashboard
- DNS proxy status is enabled

## Performance Optimization

- Use Cloudflare's global network with low latency
- Direct subdomain routing without complex path resolution
- Support HTTP/2 and HTTP/3
- Automatic SSL/TLS certificate management

## Security Considerations

- All traffic is proxied through Cloudflare with DDoS protection
- Automatic SSL/TLS encryption
- Worker isolated execution environment
- Support CSP and other security header settings