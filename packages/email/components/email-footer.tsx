/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * email-footer.tsx
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

import { Link, Section, Text } from '@react-email/components';
import type * as React from 'react';

export interface EmailFooterProps {
  /** Optional extra content to add to the footer */
  extraContent?: React.ReactNode;
}

/**
 * Consistent footer component for all email templates
 */
export const EmailFooter: React.FC<EmailFooterProps> = ({ extraContent }) => {
  const currentYear = new Date().getFullYear();

  return (
    <Section className="bg-muted p-5 text-center border-t border-border rounded-b-lg">
      {extraContent && (
        <div className="mb-4">{extraContent}</div>
      )}
      <Text className="m-0 text-muted-foreground text-sm mb-2">
        © {currentYear} Libra. All rights reserved.
      </Text>
      <Text className="m-0 text-muted-foreground text-sm">
        <Link href="https://zepid.dev/privacy" className="text-brand no-underline mx-2 hover:underline">
          Privacy Policy
        </Link>
        |
        <Link href="https://zepid.dev/terms" className="text-brand no-underline mx-2 hover:underline">
          Terms of Service
        </Link>
        |
        <Link href="mailto:contact@zepid.dev" className="text-brand no-underline mx-2 hover:underline">
          Contact Us
        </Link>
      </Text>
    </Section>
  );
}; 