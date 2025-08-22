/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * index.tsx
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


import * as m from '@/paraglide/messages'
import { Section } from '@libra/ui/components/section'
import { cn } from '@libra/ui/lib/utils'
import type { PricingProps } from './types'
import { PricingContent } from './components/pricing-content'

export default function Pricing({
  yearlyDiscount = 33,
  plans: propPlans,
  className,
  showEnterprise = true,
  title = m['pricing.title_default'](),
  description = m['pricing.description_default'](),
}: PricingProps) {
  return (
    <Section className={cn(className)} id="price">
      <div className='mx-auto flex max-w-6xl flex-col items-center gap-8 sm:gap-10 md:gap-12 px-4 sm:px-6 lg:px-8'>
        <PricingContent
          title={title}
          description={description}
          yearlyDiscount={yearlyDiscount}
          propPlans={propPlans}
          showEnterprise={showEnterprise}
        />
      </div>
    </Section>
  )
}
