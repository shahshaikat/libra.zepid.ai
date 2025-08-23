/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * contact.tsx
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
  ContentSection,
  EmailContainer,
  InfoBox
} from '../../components';

interface ContactTemplateProps {
  name: string;
  email: string;
  message: string;
}

/**
 * Contact form submission email template
 */
export const ContactTemplate: React.FC<ContactTemplateProps> = ({
  name,
  email,
  message
}) => {
  return (
    <EmailContainer
      title="Zepid Contact Form Submission"
      previewText={`${name} sent a message via the contact form`}
    >
      <ContentSection>
        <Heading as="h2" className="mt-0 text-gray-800 text-xl font-semibold">
          New Contact Form Submission
        </Heading>

        <Text className="mb-2 text-gray-600 leading-relaxed">
          You have received a new message from the website contact form:
        </Text>

        <InfoBox title="Contact Information" variant="info">
          <Text className="text-gray-600 m-0 leading-relaxed">
            <strong>Name:</strong> {name}
          </Text>
          <Text className="text-gray-600 m-0 leading-relaxed">
            <strong>Email:</strong> {email}
          </Text>
        </InfoBox>

        <Section className="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
          <Heading as="h3" className="mt-0 mb-2 text-gray-800 text-base font-medium">
            Message Content:
          </Heading>
          <Text className="text-gray-600 m-0 whitespace-pre-line leading-relaxed">
            {message}
          </Text>
        </Section>

        <Text className="text-gray-600 mb-0 text-sm leading-relaxed">
          Please respond to this message promptly to provide excellent customer service.
        </Text>
      </ContentSection>
    </EmailContainer>
  );
};

export default ContactTemplate; 