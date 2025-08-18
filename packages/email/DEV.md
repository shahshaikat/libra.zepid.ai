# Libra Email Development Guide

Libra Email is a modern email system built on top of **React Email** and **Resend**, providing a complete email template system, reusable UI component library, and type-safe email sending API. It supports various business scenarios for email communication.

## 🎯 Feature Overview

### Core Capabilities

- **React Component-based Email Templates**: Develop email templates using JSX syntax
- **Type-safe API**: Complete TypeScript support with intelligent code completion
- **Responsive Design System**: Based on OKLCH color space and Tailwind CSS
- **High Reliability Sending**: Integrated with Resend email service
- **Cross-Client Compatibility**: Supports rendering on mainstream email clients

### Business Scenarios

- User registration verification, login verification code
- Welcome emails, subscription confirmation
- Team invitations, organization collaboration
- Subscription cancellation, contact form

## 📁 Project Structure

```
packages/email/
├── components/ # Reusable email components
│ ├── button.tsx # Button component (4 variants)
│ ├── content-section.tsx # Content section wrapper
│ ├── email-container.tsx # Email base container
│ ├── email-header.tsx # Email header
│ ├── email-footer.tsx # Email footer
│ ├── info-box.tsx # Info box
│ ├── otp-code.tsx # Verification code display
│ └── index.ts # Component export
├── templates/ # Email templates
│ └── emails/
│ ├── cancellation-email.tsx # Subscription cancellation
│ ├── contact.tsx # Contact form
│ ├── email-verification.tsx # Email verification
│ ├── organization-invitation.tsx # Team invitation
│ ├── sign-in.tsx # Login verification
│ ├── welcomeEmail.tsx # Welcome email
│ └── index.tsx # Template export and theme mapping
├── utils/
│ └── email.ts # Email sending utility functions
├── env.mjs # Environment variable configuration
├── index.ts # Package main entry
├── package.json # Dependency configuration
├── tsconfig.json # TypeScript configuration
└── tsup.config.ts # Build configuration
```

## 🛠️ Installation and Configuration

### 1. Environment Configuration

```bash
# Install dependencies
bun install

# Configure environment variables (.env)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=noreply@yourdomain.com
```

### 2. Environment Variable Verification

The package uses `@t3-oss/env-nextjs` for type-safe environment variable verification:

```typescript
// env.mjs
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    RESEND_FROM: z.string().min(1).email(),
    RESEND_API_KEY: z.string().min(1),
  },
  runtimeEnv: {
    RESEND_FROM: process.env['RESEND_FROM'],
    RESEND_API_KEY: process.env['RESEND_API_KEY'],
  },
})
```

### 3. Resend Configuration

```typescript
// index.ts
import { Resend } from 'resend'
import { env } from './env.mjs'

export const resend = new Resend(env.RESEND_API_KEY)
```

## 🧩 Component System

### Container Components

#### EmailContainer

Email base container, providing unified layout and styles:

```typescript
interface EmailContainerProps {
  title: string // HTML title
  previewText: string // Email preview text
  children: React.ReactNode // Email content
  backgroundColor?: string // Background color override
}

// Example usage
<EmailContainer
  title="Welcome to Libra"
  previewText="Start your AI development journey"
/>
  {/* Email content */}
</EmailContainer>
```

#### ContentSection

Content section wrapper:

```typescript
interface ContentSectionProps {
  children: React.ReactNode
  className?: string
}
```

### Interactive Components

#### Button

Button component with 4 style variants:

```typescript
interface ButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive'
  className?: string
}

// Example usage
<Button href="https://zepid.dev" variant="primary">
  Get started
</Button>

<Button href="/docs" variant="outline">
  View documentation
</Button>
```

#### InfoBox

Info box component:

```typescript
interface InfoBoxProps {
  title?: string
  children: React.ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
}

// Example usage
<InfoBox variant="success" title="Account activated">
  Your account has been successfully activated!
</InfoBox>
```

#### OtpCode

Verification code display component:

```typescript
interface OtpCodeProps {
  code: string
  className?: string
}

// Example usage
<OtpCode code="123456" />
```

## 📧 Pre-built Templates

### 1. Welcome Email (WelcomeEmailTemplate)

```typescript
interface WelcomeEmailTemplateProps {
  planName: string
}

// Features
- Dynamic plan name display
- Product feature introduction
- Call-to-action button
- Help center link
```

### 2. Login Verification (SignInTemplate)

```typescript
interface SignInTemplateProps {
  otp: string
}

// Security features
- Verification code highlighted display
- 10-minute expiration reminder
- Security tips
```

### 3. Email Verification (EmailVerificationTemplate)

```typescript
interface EmailVerificationTemplateProps {
  otp: string
}

// Verification process
- 6-digit verification code
- Expiration instructions
- Resend guide
```

### 4. Team Invitation (OrganizationInvitationTemplate)

```typescript
interface OrganizationInvitationTemplateProps {
  invitedByUsername: string
  invitedByEmail: string
  teamName: string
  inviteLink: string
}

// Collaboration features
- Inviter information display
- Team details introduction
- One-click accept invitation
- 7-day expiration reminder
```

### 5. Subscription Cancellation (CancellationEmailTemplate)

```typescript
interface CancellationEmailTemplateProps {}
// Customer care
- Cancellation confirmation notification
- Feedback collection link
- Resubscription options
- Contact support channel
```

### 6. Contact Form (ContactTemplate)

```typescript
interface ContactTemplateProps {
  name: string
  email: string
  message: string
}

// Customer service
- Message content formatting
- Auto-response confirmation
- Response time instructions
```

## 🔧 API Reference

### Email Sending Utilities

#### sendWelcomeEmail

Send welcome email:

```typescript
await sendWelcomeEmail(userEmail: string, planName: string)
// Internal implementation
await resend.emails.send({
  from: env.RESEND_FROM,
  to: [userEmail],
  subject: `Welcome to the Libra ${planName} Plan`,
  react: React.createElement(WelcomeEmailTemplate, { planName }),
})
```

#### sendCancellationEmail

Send subscription cancellation confirmation:

```typescript
await sendCancellationEmail(userEmail: string)
// Implementation details
- Use predefined subject: "Libra Subscription Cancelled"
- Automatic error handling and logging
```

#### sendOrganizationInvitation

Send team invitation:

```typescript
await sendOrganizationInvitation({
  email: string
  invitedByUsername: string
  invitedByEmail: string
  teamName: string
  inviteLink: string
})
// Invitation process
- Personalized invitation content
- Secure invitation link
- Inviter information verification
```

### Custom Email Sending

```typescript
import { resend } from '@libra/email'
import { render } from '@react-email/render'
import React from 'react'

// Method 1: Use React components (recommended)
await resend.emails.send({
  from: env.RESEND_FROM,
  to: ['user@example.com'],
  subject: 'Subject',
  react: React.createElement(YourTemplate, props) as React.ReactElement,
})

// Method 2: Use rendered HTML
const html = render(<YourTemplate {...props} />)
await resend.emails.send({
  from: env.RESEND_FROM,
  to: ['user@example.com'],
  subject: 'Subject',
  html,
})
```

## 🎨 Design System

### OKLCH Color Definitions

```css
/* Core color variables */
:root {
  --brand: oklch(65.01% 0.162 33.16); /* Brand color */
  --background: oklch(98% 0.005 0); /* Background color */
  --foreground: oklch(25% 0.01 0); /* Foreground color */
  --muted: oklch(95% 0.01 0); /* Secondary background */
  --muted-foreground: oklch(50% 0.01 0); /* Secondary foreground */
  --border: oklch(90% 0.01 0); /* Border color */
}
```

### Responsive Design

All components support the following breakpoints:

- **Desktop**: Maximum width 600px
- **Mobile**: Adaptive width, optimized for touch operation
- **Email clients**: Compatible with Outlook, Gmail, Apple Mail

### Font System

```css
font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

## 🚀 Development Workflow

### Local Development

```bash
# Start development environment
bun dev

# Run type checking
bun typecheck

# Execute build
bun build

# Run tests
bun test
```

### Template Preview

Use a standalone email preview application:

```bash
# Start preview service
cd ../../apps/email
bun dev

# Access preview interface to view all templates
```

### Create Custom Templates

1. **Create template file**

```typescript
// templates/emails/custom-notification.tsx
import React from 'react'
import { EmailContainer, ContentSection, Button, InfoBox } from '../../components'

interface CustomNotificationProps {
  userName: string
  actionUrl: string
  urgencyLevel: 'low' | 'medium' | 'high'
}

export const CustomNotificationTemplate: React.FC<CustomNotificationProps> = ({
  userName,
  actionUrl,
  urgencyLevel,
}) => {
  // ...
}
```

2. **Add to export list**

```typescript
// templates/emails/index.tsx
export { CustomNotificationTemplate } from './custom-notification'
export const emailSubjects = {
  'custom-notification': 'System Notification - Requires Your Attention',
  // ...
}
```

3. **Create sending function**

```typescript
// utils/custom-email.ts
import { resend } from '../index'
import { env } from '../env.mjs'
import { CustomNotificationTemplate } from '../templates/emails/custom-notification'
import React from 'react'

export async function sendCustomNotification(
  userEmail: string,
  userName: string,
  actionUrl: string,
  urgencyLevel: 'low' | 'medium' | 'high' = 'medium',
) {
  // ...
}
```

### Test Templates

```typescript
// Test in preview application
import { CustomNotificationTemplate } from '@libra/email/templates/emails/custom-notification'

export default function TestCustomNotification() {
  return (
    <CustomNotificationTemplate
      userName="John Doe"
      actionUrl="https://zepid.dev/dashboard/alerts"
      urgencyLevel="high"
    />
  )
}
```

## 🔍 Debugging Guide

### Common Issues

1. **Email not sent**

```bash
# Check environment variables
echo $RESEND_API_KEY
echo $RESEND_FROM

# Verify Resend API key
curl -X GET "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

2. **Style display issues**

- Check OKLCH color value format
- Verify Tailwind class name spelling
- Test rendering on different email clients

3. **TypeScript type errors**

```bash
# Regenerate type definitions
bun run typecheck

# Check component interface definitions
```

### Logging

All email sending functions include error logging:

```typescript
// Log format
console.error(`[Email] Failed to send welcome email to ${userEmail}:`, error)
```

### Performance Monitoring

```typescript
// Monitor email sending performance
const startTime = Date.now()
await sendWelcomeEmail(email, plan)
// ...
const duration = Date.now() - startTime
console.log(`[Email] Welcome email sent in ${duration}ms`)
```

## 📋 Best Practices

### Email Design

- **Concise and clear**: Highlight key information, avoid excessive decoration
- **Mobile-first**: Prioritize mobile display effects
- **Brand consistency**: Use unified color and font systems
- **Accessibility**: Ensure sufficient contrast and readability

### Code Organization

- **Component reuse**: Prioritize existing components
- **Type safety**: Define TypeScript interfaces for all props
- **Error handling**: Include complete error capture and logging
- **Performance optimization**: Avoid large email content and images

### Security Considerations

- **Sensitive information**: Avoid including sensitive data in emails
- **Link verification**: Ensure all links point to secure domains
- **Permission control**: Verify sending permissions and recipient validity

## 🔗 Related Resources

- **React Email documentation**: https://react.email/docs
- **Resend API documentation**: https://resend.com/docs/api-reference

---

**Libra Email** - Modern, type-safe email solution