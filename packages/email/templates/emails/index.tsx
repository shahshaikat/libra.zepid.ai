/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * index.tsx
 * Copyright (C) 2025 Nextify Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 */

// Export all email templates for easier imports
export { CancellationEmailTemplate } from './cancellation-email'
export { ContactTemplate } from './contact'
export { EmailVerificationTemplate } from './email-verification'
export { OrganizationInvitationTemplate } from './organization-invitation'
export { SignInTemplate } from './sign-in'
export { WelcomeEmailTemplate } from './welcomeEmail'

// Template subject mapping
export const emailSubjects = {
  'sign-in': 'Zepid - Sign-in Verification Code',
  'email-verification': 'Zepid - Email Verification Code',
  welcome: 'Welcome to Zepid!',
  cancellation: 'Zepid Subscription Cancelled',
  'organization-invitation': 'Invitation to join a team on Zepid',
}
