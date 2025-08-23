/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * email-header.tsx
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

import { Heading, Section } from '@react-email/components';
import * as React from 'react';

export interface EmailHeaderProps {
  /** Optional custom logo URL */
  logoUrl?: string;
}

/**
 * Consistent header component for all email templates
 */
export const EmailHeader: React.FC<EmailHeaderProps> = ({ logoUrl }) => {
  return (
    <Section className="bg-brand p-5 text-center rounded-t-lg">
      {logoUrl ? (
        <img src={logoUrl} alt="Zepid" className="h-8 mx-auto" />
      ) : (
        <Heading as="h1" className="text-white m-0 text-2xl font-bold">
          Zepid AI
        </Heading>
      )}
    </Section>
  );
}; 