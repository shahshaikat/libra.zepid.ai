/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * sign-in.tsx
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
  Link,
} from '@react-email/components';
import type * as React from 'react';
import {
  Button,
  ContentSection,
  EmailContainer,
  InfoBox,
  OtpCode
} from '../../components';

interface SignInTemplateProps {
  otp: string;
}

/**
 * Sign-in verification email with OTP code
 */
export const SignInTemplate: React.FC<SignInTemplateProps> = ({ otp }) => {
  return (
    <EmailContainer
      title="Zepid Sign-in Verification"
      previewText={`Zepid verification code: ${otp}`}
    >
      <ContentSection>
        <Heading as="h2" className="mt-0 text-gray-800 text-xl font-semibold">
          Verify Your Sign-in
        </Heading>

        <Text className="mb-6 text-gray-600 leading-relaxed">
          Hello! We received a request to sign in to your Zepid account. Please use the following verification code to complete the sign-in process:
        </Text>

        {/* Verification Code Box - Using OtpCode component */}
        <OtpCode code={otp} />

        {/* Instructions and Security Notes */}
        <Text className="text-gray-600 mb-2 leading-relaxed">
          This verification code will expire in <strong>10 minutes</strong>.
        </Text>
        <Text className="text-gray-600 mb-6 leading-relaxed">
          If you didn't attempt to sign in, please ignore this email or contact our support team.
        </Text>

        {/*/!* Call to Action Button *!/*/}
        {/*<Section className="text-center mb-7">*/}
        {/*  <Button href="#" variant="primary">*/}
        {/*    Visit Zepid*/}
        {/*  </Button>*/}
        {/*</Section>*/}

        {/* Security Message */}
        <Section className="border-t border-gray-200 pt-5 mt-2">
          <Text className="text-sm text-gray-500 mb-0 leading-relaxed">
            <strong>Security Tip:</strong> Zepid will never ask for your password or financial information via email.
          </Text>
        </Section>
      </ContentSection>
    </EmailContainer>
  );
};

export default SignInTemplate; 