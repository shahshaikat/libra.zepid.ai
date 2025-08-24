# Sandbox Templates

This document describes how to create custom sandbox templates. By specifying an `e2b.Dockerfile`, we will create a new sandbox template and provide a template ID. You can then use this template ID with the SDK to create new sandboxes based on your custom template.

## Steps to Create a Custom Sandbox

### Table of Contents

- [Sandbox Templates](#sandbox-templates)
  - [Steps to Create a Custom Sandbox](#steps-to-create-a-custom-sandbox)
    - [Table of Contents](#table-of-contents)
    - [1. Install E2B CLI](#1-install-e2b-cli)
    - [2. Initialize Sandbox Template](#2-initialize-sandbox-template)
    - [3. Customize `e2b.Dockerfile`](#3-customize-e2bdockerfile)
    - [4. Build Sandbox Template](#4-build-sandbox-template)
    - [5. Start Custom Sandbox](#5-start-custom-sandbox)
  - [Docker Build and Daytona Snapshot Commands](#docker-build-and-daytona-snapshot-commands)
    - [Docker Build Commands](#docker-build-commands)
    - [Daytona Snapshot Creation Commands](#daytona-snapshot-creation-commands)
    - [Using Daytona Snapshot Push Command](#using-daytona-snapshot-push-command)
- [File Structure](#file-structure)

### 1. Install E2B CLI

**Using Homebrew (macOS)**

```bash

brew install e2b

```

**Using NPM**

```bash

bun i -g @e2b/cli

```

### 2. Initialize Sandbox Template

The following command will create a basic `e2b.Dockerfile` in the current directory:

```bash

e2b template init

```

### 3. Customize `e2b.Dockerfile`

You can now customize the sandbox template by editing the `e2b.Dockerfile` file.

### 4. Build Sandbox Template

Now you can build the sandbox template using Docker and the E2B CLI.

The E2B CLI will invoke Docker to build the image and then push it to E2B cloud.

The Docker image will then be converted into a micro VM that can be launched as a sandbox via the SDK.

```bash

e2b template build --cpu-count 2 -n "vite-shadcn-template-zepid" --memory-mb 1024 -c "/compile_page.sh"

```

This process will take some time. Finally, you will see the created template ID, which you need to use with the SDK to create a sandbox.

### 5. Start Custom Sandbox

Now you can use the template ID to create a sandbox via the SDK.

```javascript {{ language: 'js' }}

import { sandbox } from '@e2b/code-interpreter'

// Template ID obtained from the previous step

const templateID = 'id-of-your-template' // $HighlightLine

// Pass the template ID to the `Sandbox.create` method

const sandbox = await Sandbox.create(templateID) // $HighlightLine

// The template has cowsay installed, so we can use it

const execution = await sandbox.runCode(`

import cowsay

cowsay.say('Hello from E2B!')

`)

console.log(execution.stdout)

```

## Docker Build and Daytona Snapshot Commands

### Docker Build Commands

```bash

docker buildx build --platform linux/amd64 -t vite-shadcn-template-zepid:1.0.0 -f ./daytona.Dockerfile .

```

### Daytona Snapshot Creation Commands

<!-- ```bash

daytona snapshot create vite-shadcn-template-zepid-debug --dockerfile ./daytona.Dockerfile

``` -->

### Using Daytona Snapshot Push Command

daytona snapshot push vite-shadcn-template-zepid:1.0.0 --entrypoint "bun run dev --host 0.0.0.0" --name vite-shadcn-template-zepid:1.0.0 --cpu 1 --memory 1 --disk 1

```

# File Structure

Generate file structure for AI editor using bun generate-structure.ts [fileStructure.ts](fileStructure.ts)

Then copy the result to [vite-shadcn-template.ts](../../packages/templates/vite-shadcn-template.ts)