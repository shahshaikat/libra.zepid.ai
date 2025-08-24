/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * index.ts
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

/**
 * Standardized email template test data set
 * Used to ensure consistent data structure between preview and actual sending
 */

// Welcome email test data - Free plan
export const welcomeEmailFreeTestData = {
  planName: "zepid free"
};

// Welcome email test data - Pro plan
export const welcomeEmailProTestData = {
  planName: "zepid pro"
};

// Welcome email test data - Max plan
export const welcomeEmailMaxTestData = {
  planName: "zepid max"
};

// Backward compatible default test data
export const welcomeEmailTestData = welcomeEmailProTestData;

// Sign-in verification email test data
export const signInTestData = {
  otp: "123456"
};

// Email verification test data
export const emailVerificationTestData = {
  otp: "654321"
};

// Organization invitation email test data
export const organizationInvitationTestData = {
  invitedByUsername: "张三",
  invitedByEmail: "zhangsan@example.com",
  teamName: "示例科技团队",
  inviteLink: "https://zapid.dev/accept-invitation?token=abc123def456"
};

// Contact form email test data
export const contactTestData = {
  name: "李四",
  email: "lisi@example.com",
  message: "您好，我对 Zepid 平台很感兴趣，希望了解更多关于企业版的功能和定价信息。请联系我安排一次演示。\n\n谢谢！"
};

// Unsubscribe email test data (no additional parameters needed)
export const cancellationEmailTestData = {};

// Unified test data export
export const testData = {
  welcomeEmail: welcomeEmailTestData,
  welcomeEmailFree: welcomeEmailFreeTestData,
  welcomeEmailPro: welcomeEmailProTestData,
  welcomeEmailMax: welcomeEmailMaxTestData,
  signIn: signInTestData,
  emailVerification: emailVerificationTestData,
  organizationInvitation: organizationInvitationTestData,
  contact: contactTestData,
  cancellationEmail: cancellationEmailTestData
};

// Type definitions to ensure type safety of data structures
export interface TestDataTypes {
  welcomeEmail: typeof welcomeEmailTestData;
  welcomeEmailFree: typeof welcomeEmailFreeTestData;
  welcomeEmailPro: typeof welcomeEmailProTestData;
  welcomeEmailMax: typeof welcomeEmailMaxTestData;
  signIn: typeof signInTestData;
  emailVerification: typeof emailVerificationTestData;
  organizationInvitation: typeof organizationInvitationTestData;
  contact: typeof contactTestData;
  cancellationEmail: typeof cancellationEmailTestData;
}

// Default export
export default testData;
