/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * email.ts
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

import { resend } from '../index';
import React from 'react';
import { env } from '../env.mjs';
import {
  WelcomeEmailTemplate,
  CancellationEmailTemplate,
  OrganizationInvitationTemplate,
  SignInTemplate,
  EmailVerificationTemplate,
  ContactTemplate
} from '../templates';

/**
 * Send a welcome email to a specific email address.
 */
export async function sendWelcomeEmail(userEmail: string, planName: string) {
  try {
    // Send the email using Resend with React email template
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: [userEmail],
      subject: `Welcome to the Zepid ${planName} Plan`,
      react: React.createElement(WelcomeEmailTemplate, { planName }) as any,
    });
  } catch (error) {
    console.error(`[Email] Failed to send welcome email to ${userEmail}:`, error);
    throw error;
  }
}

/**
 * Send a cancellation email to a specific email address.
 */
export async function sendCancellationEmail(userEmail: string) {
  try {
    // Send the email using Resend with React email template
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: [userEmail],
      subject: 'Zepid Subscription Cancelled',
      react: React.createElement(CancellationEmailTemplate, {}) as any,
    });
  } catch (error) {
    console.error(`[Email] Failed to send cancellation email to ${userEmail}:`, error);
    throw error;
  }
}

/**
 * Send an organization invitation email.
 */
export async function sendOrganizationInvitation(options: {
  email: string;
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
  inviteLink: string;
}) {
  const { email, invitedByUsername, invitedByEmail, teamName, inviteLink } = options;
  try {
    // Send the email using Resend with React email template
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: [email],
      subject: 'Invitation to join a team on Zepid',
      react: React.createElement(OrganizationInvitationTemplate, { invitedByUsername, invitedByEmail, teamName, inviteLink }) as any,
    });
  } catch (error) {
    console.error(`[Email] Failed to send organization invitation to ${email}:`, error);
    throw error;
  }
}

/**
 * Send a sign-in verification email with OTP code.
 */
export async function sendSignInEmail(userEmail: string, otp: string) {
  try {
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: [userEmail],
      subject: 'Zepid - Sign-in Verification Code',
      react: React.createElement(SignInTemplate, { otp }) as any,
    });
  } catch (error) {
    console.error(`[Email] Failed to send sign-in email to ${userEmail}:`, error);
    throw error;
  }
}

/**
 * Send an email verification code.
 */
export async function sendEmailVerification(userEmail: string, otp: string) {
  try {
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: [userEmail],
      subject: 'Zepid - Email Verification Code',
      react: React.createElement(EmailVerificationTemplate, { otp }) as any,
    });
  } catch (error) {
    console.error(`[Email] Failed to send email verification to ${userEmail}:`, error);
    throw error;
  }
}

/**
 * Send a contact form submission notification.
 */
export async function sendContactFormNotification(options: {
  name: string;
  email: string;
  message: string;
  recipientEmail: string;
}) {
  const { name, email, message, recipientEmail } = options;
  try {
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: [recipientEmail],
      subject: 'Zepid Contact Form Submission',
      react: React.createElement(ContactTemplate, { name, email, message }) as any,
    });
  } catch (error) {
    console.error(`[Email] Failed to send contact form notification to ${recipientEmail}:`, error);
    throw error;
  }
}