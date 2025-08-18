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

// import { Resend } from 'resend'
// import {
//   welcomeEmailTemplate,
//   cancellationEmailTemplate,
//   organizationInvitationTemplate
// } from '../templates/emails'
// import { getDbAsync } from '@libra/db'
// import { user } from '@libra/db/schema/auth-schema'
// import { eq } from 'drizzle-orm'
//
// /**
//  * EmailService class for handling all email sending operations
//  */
// export class EmailService {
//   private resend: Resend
//   private from: string
//
//   /**
//    * Initialize EmailService with API key and sender
//    */
//   constructor() {
//     this.resend = new Resend(process.env.RESEND_API_KEY)
//     this.from = process.env.RESEND_FROM || 'Libra <hi@zepid.dev>'
//   }
//
//   /**
//    * Send email with provided template and subject
//    * @param to - recipient email address
//    * @param subject - email subject
//    * @param htmlContent - HTML content template
//    * @returns Promise with send result
//    */
//   async sendEmail(to: string, subject: string, htmlContent: string) {
//     console.log(`Sending email: ${subject} to ${to}`)
//    
//     try {
//       const result = await this.resend.emails.send({
//         from: this.from,
//         to: [to],
//         subject,
//         html: htmlContent,
//       })
//      
//       console.log(`Email sent successfully to ${to}`)
//       return result
//     } catch (error) {
//       console.error(`Failed to send email to ${to}:`, error)
//       throw error
//     }
//   }
//
//   /**
//    * Send welcome email when subscription is created
//    * @param userEmail - user's email address
//    * @param planName - subscription plan name
//    */
//   async sendWelcomeEmail(userEmail: string, planName: string) {
//     const subject = `Welcome to Libra ${planName} Plan!`
//     const htmlContent = welcomeEmailTemplate(planName)
//     return this.sendEmail(userEmail, subject, htmlContent)
//   }
//
//   /**
//    * Send cancellation email when subscription is cancelled
//    * @param userEmail - user's email address
//    */
//   async sendCancellationEmail(userEmail: string) {
//     const subject = 'Libra Subscription Cancelled'
//     const htmlContent = cancellationEmailTemplate()
//     return this.sendEmail(userEmail, subject, htmlContent)
//   }
// }
//
// // Create a singleton instance of EmailService
// export const emailService = new EmailService()
//
// /**
//  * Get user email by user ID
//  * @param userId - user ID
//  * @returns user email address
//  */
// async function getUserEmail(userId: string): Promise<string> {
//   // Query user by ID
//   const db = await getDbAsync(); // Get database instance
//   const userRecord = await db.query.user.findFirst({
//     where: eq(user.id, userId),
//   })
//  
//   if (!userRecord || !userRecord.email) {
//     throw new Error(`User not found or email missing for user ID: ${userId}`)
//   }
//  
//   return userRecord.email
// }
//
// /**
//  * Send welcome email to user when subscription is created
//  * @param stripeCustomerId - Stripe customer ID
//  * @param planName - subscription plan name
//  */
// export async function sendWelcomeEmail(stripeCustomerId: string, planName: string) {
//   try {
//     const db = await getDbAsync(); // Get database instance
//     const userRecord = await db.query.user.findFirst({
//       where: eq(user.stripeCustomerId, stripeCustomerId),
//     });
//
//     if (!userRecord) {
//       // Log an error message if the user is not found
//       console.error(`User not found with Stripe Customer ID: ${stripeCustomerId}`);
//       throw new Error(`User not found with Stripe Customer ID: ${stripeCustomerId}`);
//     }
//     const userId = userRecord.id;
//     // Get user email
//     const userEmail = await getUserEmail(userId)
//    
//     // Send welcome email
//     // Log a message indicating that a welcome email is being sent
//     console.log(`Sending welcome email for ${planName} plan to user: ${userId}`)
//     return emailService.sendWelcomeEmail(userEmail, planName)
//   } catch (error) {
//     // Log an error message if sending the welcome email fails
//     console.error(`Failed to send welcome email for Stripe Customer ID ${stripeCustomerId}:`, error)
//     throw error
//   }
// }
//
// /**
//  * Send cancellation email when subscription is cancelled
//  * @param userId - user ID
//  */
// export async function sendCancellationEmail(userId: string) {
//   try {
//     // Get user email
//     const userEmail = await getUserEmail(userId)
//    
//     // Send cancellation email
//     console.log(`Sending cancellation email to user: ${userId}`)
//     return emailService.sendCancellationEmail(userEmail)
//   } catch (error) {
//     console.error(`Failed to send cancellation email to user ${userId}:`, error)
//     throw error
//   }
// }
//
// /**
//  * Send organization invitation email
//  * @param options - object containing invite details
//  * @returns Promise with send result
//  */
// export async function sendOrganizationInvitation({
//   email,
//   invitedByUsername,
//   invitedByEmail,
//   teamName,
//   inviteLink
// }: {
//   email: string;
//   invitedByUsername: string;
//   invitedByEmail: string;
//   teamName: string;
//   inviteLink: string;
// }) {
//   try {
//     // Log sending invitation email
//     console.log(`Sending organization invitation to ${email} for team ${teamName}`)
//    
//     // Generate email content from template
//     const subject = 'Invitation to join a team on Libra'
//     const htmlContent = organizationInvitationTemplate(
//       invitedByUsername,
//       invitedByEmail,
//       teamName,
//       inviteLink
//     )
//    
//     // Use emailService to send the invitation
//     return emailService.sendEmail(email, subject, htmlContent)
//   } catch (error) {
//     // Log error if sending fails
//     console.error(`Failed to send organization invitation to ${email}:`, error)
//     throw error
//   }
// }