/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * layout.config.tsx
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

import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from 'next/image'
import { i18n } from "@/lib/i18n";

export const logo = (
  <div className='h-5'>
    <Image
      alt='Zepid logo'
      src='/logo-dark.svg'
      width={32}
      height={32}
      sizes='100px'
      className='hidden dark:block w-8 md:w-8'
      aria-label='Zepid logo'
    />
    <Image
      alt='Zepid logo'
      src='/logo.svg'
      width={32}
      height={32}
      sizes='100px'
      className='block dark:hidden w-8 md:w-8'
      aria-label='Zepid logo'
    />
  </div>
)

export function baseOptions(): BaseLayoutProps {
  return {
    i18n,
    nav: {
      title: logo,
    },
    // Add any locale-specific options here
  };
}