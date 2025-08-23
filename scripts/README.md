# Zepid Scripts

Modern configuration management and deployment scripts, avoiding traditional text processing tools like `sed` and `perl`.

## Config Processor (config-processor.ts)

A simple configuration file processor for replacing `{{PLACEHOLDER}}` placeholders in template files.

### Usage

```bash
# Basic usage
bun config-processor.ts <template-path> <output-path>

# Example: processing wrangler configuration
bun config-processor.ts wrangler.jsonc.example wrangler.jsonc
```

### Features

- ✅ **Simple and straightforward**: only replaces placeholders, no complex validation logic
- ✅ **Cross-platform**: uses Node.js/Bun, no dependency on sed/perl
- ✅ **Environment variable support**: automatically reads values from `process.env`
- ✅ **Default values**: provides reasonable default values for common configurations
- ✅ **Error prompts**: clear warning messages displaying unprocessed placeholders

### Supported Placeholders

#### Cloudflare Resources

- `{{DATABASE_ID}}` - Cloudflare D1 database ID
- `{{KV_NAMESPACE_ID}}` - Cloudflare KV namespace ID
- `{{HYPERDRIVE_ID}}` - Cloudflare Hyperdrive connection ID

#### Application Configuration

- `{{NEXT_PUBLIC_APP_URL}}` - application main domain (default: https://zepid.dev)
- `{{NEXT_PUBLIC_CDN_URL}}` - CDN domain (default: https://cdn.zepid.dev)

## Environment Variable Initialization (init-env.ts)

A tool for pushing local environment variables to GitHub Secrets.

LIBRA_GITHUB_REPO=libra-beta
ENV_FILE_PATH=.env

### Usage

1. Configure environment variables
2. Run the script:

```bash
cd scripts
bun run init-env
```

### Notes

- The script reads the specified `.env` file (default is `.env` in the project root directory)
- All non-empty environment variables will be pushed to GitHub Secrets
- For security reasons, the script will not display the actual values of environment variables, only the variable names and value lengths
- Existing Secrets with the same name will be overwritten
- The script automatically loads variables from the `.env` file into environment variables, with existing environment variables taking precedence