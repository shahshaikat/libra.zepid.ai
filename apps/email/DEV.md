# @libra/email Application Development Documentation

> React Email Template Preview and Development Tool

Version: 1.0.0 - 2025-07-30

Last Updated: 2025-07-30

## Overview

`apps/email` is a mail template preview development tool for the Zepid project, built on top of React Email. It provides developers with a visual interface to preview, test, and develop various mail templates used in the project.

**Important Note**: This is a development-time preview tool, and the actual email sending functionality is provided by the `@libra/email` package.

## Core Features

- **Email Template Preview**: Real-time preview of various email templates' rendering effects

- **Development Mode**: Hot reloading development environment, supporting real-time editing and preview

- **Template Management**: Unified management and preview of all email templates in the system

- **Responsive Design**: Support for previewing on different devices and email clients

- **Browser Testing**: Testing email template compatibility in the browser

## Technology Stack

- **Framework**: React Email v4.1.0

- **Development Server**: @react-email/preview-server

- **Type Checking**: TypeScript

- **Package Management**: Bun/Yarn Workspaces

- **Build Tool**: React Email CLI

## Directory Structure

```text
apps/email/
├── emails/ # Email template preview files
│ ├── welcome-email.tsx # Welcome email template preview
│ ├── sign-in.tsx # Login verification email preview
│ ├── email-verification.tsx # Email verification template preview
│ ├── organization-invitation.tsx # Organization invitation template preview
│ └── cancellation-email.tsx # Unsubscribe template preview
├── package.json # Project configuration and scripts
├── tsconfig.json # TypeScript configuration
└── README.md # Project documentation
```

### Template Preview File Structure

Each template preview file has the following structure:

```typescript
import { TemplateComponent } from '@libra/email/templates/emails/template-name'

// Example data for preview
const ExampleTemplate = () => (
  <TemplateComponent
    prop1="example value 1"
    prop2="example value 2"
  />
)

export default ExampleTemplate
```

## Environment Requirements

- **Node.js**: 18.0.0 or higher

- **Bun**: 1.0.0 or higher (recommended)

- **TypeScript**: 5.0.0 or higher

## Installation and Configuration

### 1. Environment Preparation

Ensure you are in the project root directory and have installed all dependencies:

```bash
# Install project dependencies
bun install
```

### 2. Start Development Server

```bash
# Enter email app directory
cd apps/email

# Start development server
bun dev
```

The development server will start at `http://localhost:3001`.

### 3. Access Preview Interface

Open a browser and visit `http://localhost:3001`, you will see:

- A list of all available email templates
- Real-time preview functionality
- Responsive preview on different devices
- Source code viewer

## Development Guide

### Create a New Email Template Preview

1. Create a new `.tsx` file in the `emails/` directory
2. Import the corresponding template component from the `@libra/email` package
3. Set up real example data for preview

#### Login Verification Email Example (emails/sign-in.tsx)

```tsx
import { SignInTemplate } from '@libra/email/templates/emails/sign-in'

/**
 * Login verification email preview
 * Show the verification code email received by the user during login
 */
const SignInEmailPreview = () => (
  <SignInTemplate
    otp="123456"
    userEmail="user@example.com"
    expiresAt={new Date(Date.now() + 15 * 60 * 1000)} // Expires in 15 minutes
  />
)

export default SignInEmailPreview
```

#### Welcome Email Example (emails/welcome-email.tsx)

```tsx
import { WelcomeTemplate } from '@libra/email/templates/emails/welcome'

/**
 * Welcome email preview
 * Show the welcome email received by new users after registration
 */
const WelcomeEmailPreview = () => (
  <WelcomeTemplate
    userName="John Doe"
    userEmail="john.doe@example.com"
    loginUrl="https://zapid.dev/auth/sign-in"
    dashboardUrl="https://zapid.dev/dashboard"
  />
)

export default WelcomeEmailPreview
```

#### Organization Invitation Email Example (emails/organization-invitation.tsx)

```tsx
import { OrganizationInvitationTemplate } from '@libra/email/templates/emails/organization-invitation'

/**
 * Organization invitation email preview
 * Show the email received by the user when invited to join an organization
 */
const OrganizationInvitationPreview = () => (
  <OrganizationInvitationTemplate
    inviterName="Jane Doe"
    organizationName="Example Technology Company"
    inviteeEmail="invited@example.com"
    acceptUrl="https://zapid.dev/accept-invitation?token=abc123"
    role="developer"
  />
)

export default OrganizationInvitationPreview
```

### Template Development Best Practices

1. **Component Naming**: Use the `Example` prefix to name preview components
2. **Data Simulation**: Provide real example data for preview
3. **Responsive Design**: Ensure templates display correctly on different clients
4. **Accessibility**: Follow email accessibility best practices

### Supported Email Templates

| Template Name | File Name | Purpose |
| --- | --- | --- |
| Login Email | `signIn.tsx` | User login verification |
| Welcome Email | `welcomeEmail.tsx` | New user welcome |
| Email Verification | `emailVerification.tsx` | Email address verification |
| Organization Invitation | `organizationInvitation.tsx` | Team invitation |
| Unsubscribe | `cancellationEmail.tsx` | Service cancellation confirmation |

## Build and Deployment

### Local Build

```bash
# Build email templates
bun run build
```

This will generate static email template files for use in production environments.

### Integration with Email System

Email templates are used in the main application through the `@libra/email` package. The preview application helps developers verify template effects during development:

#### Using Email Templates in Main Application

```typescript
// packages/auth/src/lib/email/index.ts
import { sendEmail } from '@libra/email'
import { SignInTemplate } from '@libra/email/templates/emails/sign-in'

// Send login verification email
export async function sendSignInEmail(email: string, otp: string) {
  return await sendEmail({
    to: email,
    subject: 'Login Verification Code - Zepid AI',
    react: SignInTemplate({
      otp,
      userEmail: email,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    })
  })
}

// Send welcome email
export async function sendWelcomeEmail(userName: string, userEmail: string) {
  return await sendEmail({
    to: userEmail,
    subject: 'Welcome to Zepid AI',
    react: WelcomeTemplate({
      userName,
      userEmail,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/sign-in`,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    })
  })
}
```

#### Role of Preview Application

1. **Development-time Preview**: Real-time preview of email templates during development
2. **Design Verification**: Verification of email display effects on different email clients
3. **Content Review**: Team members can review email content and styles
4. **Test Data**: Use real example data to test template rendering

## Configuration Description

### package.json Configuration

```json
{
  "scripts": {
    "build": "email build", // Build email templates
    "dev": "email dev --port 3001" // Start development server
  },
  "dependencies": {
    "@libra/email": "*", // Core email package
    "react-email": "^4.1.0-canary.8" // React Email framework
  }
}
```

### TypeScript Configuration

Inherit the project's base TypeScript configuration:

```json
{
  "extends": "@libra/typescript-config/base.json",
  "compilerOptions": {
    "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json"
  }
}
```

## Development Workflow

### 1. Template Development

```bash
# Start development server
bun dev

# Create a new template in another terminal
touch emails/newTemplate.tsx
```

### 2. Real-time Preview

- Browser will automatically refresh after modifying template files
- Support for multi-device preview mode
- Can view email HTML source code

### 3. Testing and Verification

- Test rendering effects on different email clients
- Verify responsive design
- Check accessibility support

## Troubleshooting

### Common Issues

**Q: Development server fails to start**

```bash
# Check if port is occupied
lsof -i :3001

# Clean cache and reinstall
rm -rf node_modules/.cache
bun install
```

**Q: Template style display abnormal**

- Check if CSS meets email client compatibility requirements
- Use inline styles instead of external CSS
- Avoid using unsupported CSS properties

**Q: Hot reloading not working**

```bash
# Restart development server
bun dev
```
