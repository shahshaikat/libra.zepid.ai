# Email Preview Application

This application provides email template previews for the Zepid platform.

## Getting Started

1. Start the preview server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to the provided URL (usually http://localhost:3001 or http://localhost:3002)

## Available Email Templates

### Welcome Email Templates

The welcome email template has been optimized to show personalized content based on the user's subscription plan:

#### 📧 **welcomeEmailFree.tsx**
- **Plan**: zepid free ($0/month)
- **Features**: 
  - Up to 1 project
  - 10 AI messages per month
  - Core features access
  - Community support
  - Self-hosting capabilities

#### 📧 **welcomeEmailPro.tsx**
- **Plan**: zepid pro ($15/month)
- **Features**:
  - Up to 3 projects
  - 100 AI messages per month
  - Private projects
  - Remove the Zepid badge
  - Custom domains
  - Website hosting included
  - Email support

#### 📧 **welcomeEmailMax.tsx**
- **Plan**: zepid max ($30/month)
- **Features**:
  - Up to 6 projects
  - 250 AI messages per month
  - Everything in Pro, plus:
  - Early access to features
  - More projects and AI messages
  - Discord support
  - Priority customer support

### Other Email Templates

- **signIn.tsx** - Sign-in verification email
- **emailVerification.tsx** - Email verification email
- **organizationInvitation.tsx** - Team invitation email
- **contact.tsx** - Contact form email
- **cancellationEmail.tsx** - Subscription cancellation email

## Customization

To modify the email content:

1. Edit the plan configuration in `packages/email/config/plan-config.ts`
2. Update the email template in `packages/email/templates/emails/welcomeEmail.tsx`
3. Modify test data in `test-data/index.ts` if needed

## Testing

The email templates use test data defined in `test-data/index.ts`. Each plan has its own test data configuration to ensure accurate previews.
