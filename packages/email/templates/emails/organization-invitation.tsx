/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * organization-invitation.tsx
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
  InfoBox
} from '../../components';

interface OrganizationInvitationTemplateProps {
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
  inviteLink: string;
}

/**
 * Email sent to invite a user to join a team/organization
 */
export const OrganizationInvitationTemplate: React.FC<OrganizationInvitationTemplateProps> = ({
  invitedByUsername,
  invitedByEmail,
  teamName,
  inviteLink
}) => {
  return (
    <EmailContainer
      title="Invitation to Join a Zepid Team"
      previewText={`${invitedByUsername} has invited you to join ${teamName}`}
    >
      <ContentSection>
        <Heading as="h2" className="mt-0 text-gray-800 text-xl font-semibold">
          You've Received a Team Invitation
        </Heading>

        <Text className="mb-6 text-gray-600 leading-relaxed">
          {invitedByUsername} ({invitedByEmail}) has invited you to join the "{teamName}" team on Zepid.
        </Text>

        {/* Team Invitation Details */}
        <InfoBox title="Invitation Details" variant="info">
          <Text className="text-gray-600 m-0 leading-relaxed">
            <strong>Team Name:</strong> {teamName}
          </Text>
          <Text className="text-gray-600 m-0 leading-relaxed">
            <strong>Invited By:</strong> {invitedByUsername}
          </Text>
          <Text className="text-gray-600 m-0 leading-relaxed">
            <strong>Inviter Email:</strong> {invitedByEmail}
          </Text>
        </InfoBox>

        <Text className="text-gray-600 mb-6 leading-relaxed">
          Once you join the team, you'll have access to shared projects, resources, and collaboration features.
        </Text>

        {/* Call to Action Button */}
        <Section className="text-center mb-7">
          <Button href={inviteLink} variant="primary">
            Accept Invitation
          </Button>
        </Section>

        {/* Invitation Note */}
        <Text className="text-gray-600 mb-2 text-sm leading-relaxed">
          This invitation link is valid for 7 days. If you don't recognize the inviter, you can ignore this email.
        </Text>
      </ContentSection>
    </EmailContainer>
  );
};

export default OrganizationInvitationTemplate; 