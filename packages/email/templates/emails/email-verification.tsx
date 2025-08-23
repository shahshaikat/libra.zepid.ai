/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * email-verification.tsx
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

import {
  Heading,
  Text,
  Section,
} from '@react-email/components';
import type * as React from 'react';
import {
  Button,
  ContentSection,
  EmailContainer,
  OtpCode
} from '../../components';

interface EmailVerificationTemplateProps {
  otp: string;
}

/**
 * Email verification template with OTP code
 */
export const EmailVerificationTemplate: React.FC<EmailVerificationTemplateProps> = ({ otp }) => {
  return (
    <EmailContainer
      title="Zepid Email Verification"
      previewText={`Zepid email verification code: ${otp}`}
    >
      <ContentSection>
        <Heading as="h2" className="mt-0 text-gray-800 text-xl font-semibold">
          Verify Your Email Address
        </Heading>

        <Text className="mb-6 text-gray-600 leading-relaxed">
          Hello! Thank you for signing up with Zepid. Please use the following verification code to confirm your email address:
        </Text>

        {/* Verification Code Box - Using OtpCode component */}
        <OtpCode code={otp} />

        {/* Instructions and Security Notes */}
        <Text className="text-gray-600 mb-2 leading-relaxed">
          This verification code will expire in <strong>10 minutes</strong>.
        </Text>
        <Text className="text-gray-600 mb-6 leading-relaxed">
          If you didn't create an account with us, please ignore this email.
        </Text>

        {/*/!* Call to Action Button *!/*/}
        {/*<Section className="text-center mb-7">*/}
        {/*  <Button href="https://zepid.dev" variant="primary">*/}
        {/*    Complete Verification*/}
        {/*  </Button>*/}
        {/*</Section>*/}

        {/* Help Section */}
        <Section className="border-t border-gray-200 pt-5 mt-2">
          <Text className="text-sm text-gray-500 mb-0 leading-relaxed">
            Need help? Contact our support team or visit our help center.
          </Text>
        </Section>
      </ContentSection>
    </EmailContainer>
  );
};

export default EmailVerificationTemplate;