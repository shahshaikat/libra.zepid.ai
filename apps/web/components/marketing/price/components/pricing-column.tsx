/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * pricing-column.tsx
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

import { Button } from '@/components/ui/button'
import * as m from '@/paraglide/messages'
import { cn } from '@libra/ui/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'
import { ArrowRight, CircleCheckBig } from 'lucide-react'
import Link from 'next/link'
import type React from 'react'
import type { ReactNode } from 'react'

const pricingColumnVariants = cva(
  'max-w-container relative flex flex-col gap-6 overflow-hidden rounded-2xl p-8 shadow-xl',
  {
    variants: {
      variant: {
        default: 'glass-1 to-transparent dark:glass-3',
        glow: "glass-2 to-transparent dark:glass-3 after:content-[''] after:absolute after:-top-[128px] after:left-1/2 after:h-[128px] after:w-[100%] after:max-w-[960px] after:-translate-x-1/2 after:rounded-[50%] dark:after:bg-foreground/30 after:blur-[72px]",
        'glow-brand':
          "glass-3 from-card/100 to-card/100 dark:glass-4 after:content-[''] after:absolute after:-top-[128px] after:left-1/2 after:h-[128px] after:w-[100%] after:max-w-[960px] after:-translate-x-1/2 after:rounded-[50%] after:bg-brand-foreground/70 after:blur-[72px]",
        enterprise:
          'glass-2 border-2 border-brand/30 dark:glass-4 dark:border-brand/20 to-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// Add horizontal enterprise card variant
const enterpriseHorizontalVariants = cva(
  'w-full relative flex overflow-hidden rounded-2xl shadow-xl',
  {
    variants: {
      variant: {
        enterprise:
          'glass-2 border-2 border-brand/30 dark:glass-4 dark:border-brand/20 to-transparent',
      },
    },
    defaultVariants: {
      variant: 'enterprise',
    },
  }
)

export interface PricingColumnProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pricingColumnVariants> {
  name: string
  icon?: ReactNode
  description: string
  price: number
  isYearly: boolean
  monthlyPrice: number
  yearlyPrice: number
  cta: {
    variant: 'glow' | 'default'
    label: string
    href?: string
    onClick?: () => Promise<void>
  }
  features?: string[]
  marketingFeatures: string[]
  isEnterprise?: boolean
  isCurrentPlan?: boolean
}

interface EnterpriseHorizontalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enterpriseHorizontalVariants> {
  name: string
  icon?: ReactNode
  description: string
  cta: {
    variant: 'glow' | 'default'
    label: string
    href?: string
    onClick?: () => Promise<void>
  }
  features?: string[]
  marketingFeatures?: string[]
}

export function PricingColumn({
  name,
  icon,
  description,
  price,
  isYearly,
  monthlyPrice,
  yearlyPrice,
  cta,
  features,
  marketingFeatures,
  variant,
  className,
  isEnterprise = false,
  isCurrentPlan = false,
  ...props
}: PricingColumnProps) {
  return (
    <div className={cn(pricingColumnVariants({ variant, className }))} {...props}>
      <hr
        className={cn(
          'via-foreground/60 absolute top-0 left-[10%] h-[1px] w-[80%] border-0 bg-linear-to-r from-transparent to-transparent',
          variant === 'glow-brand' && 'via-brand',
          variant === 'enterprise' && 'via-brand/70'
        )}
      />
      <div className='flex flex-col gap-7'>
        <div className='flex flex-col gap-2'>
          <h2 className='flex items-center gap-2 font-bold'>
            {icon && <div className='text-muted-foreground flex items-center gap-2'>{icon}</div>}
            {name}
            {isEnterprise && (
              <span className='ml-2 text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand'>
                Enterprise Only
              </span>
            )}
            {isCurrentPlan && (
              <span className='ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'>
                Your current plan
              </span>
            )}
          </h2>
          <p className='text-muted-foreground max-w-[220px] text-sm'>{description}</p>
        </div>
        {!isEnterprise ? (
          <>
            <div className='flex items-center gap-3 lg:flex-col lg:items-start xl:flex-row xl:items-center'>
              <div className='flex items-baseline gap-1'>
                <span className='text-muted-foreground text-2xl font-bold'>$</span>
                <span className='text-6xl font-bold'>{price}</span>
              </div>
              <div className='flex min-h-[40px] flex-col'>
                {price > 0 && (
                  <>
                    <span className='text-sm'>per month</span>
                    <span className='text-muted-foreground text-sm'>no plus local taxes</span>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className='flex flex-col gap-2 py-4'>
            <p className='text-lg font-medium'>Customized Services & Solutions</p>
          </div>
        )}
        {cta.onClick ? (
          <Button
            variant={cta.variant}
            size='lg'
            onClick={cta.onClick}
            className='cursor-pointer'
            data-attr='upgrade'
          >
            {cta.label}
          </Button>
        ) : (
          <Button variant={cta.variant} size='lg' asChild className='cursor-pointer'>
            <Link href={cta.href || '#'} data-attr='upgrade'>
              {cta.label}
            </Link>
          </Button>
        )}
        <p className='text-muted-foreground min-h-[40px] max-w-[220px] text-sm'>
          {monthlyPrice === 0
            ? m['pricing.forever_free']()
            : `${isYearly ? m['pricing.yearly']() : m['pricing.monthly']()} (${isYearly ? `$${yearlyPrice}/year` : `¥${monthlyPrice}/month`})`}
        </p>
        <hr className='border-input' />
      </div>
      <div>
        {features && features.length > 0 && (
          <ul className='flex flex-col gap-2 mb-4'>
            {features.map((feature) => (
              <li key={feature} className='flex items-center gap-2 text-sm'>
                <CircleCheckBig className='text-muted-foreground size-4 shrink-0' />
                {feature}
              </li>
            ))}
          </ul>
        )}
        {features && features.length > 0 && marketingFeatures && marketingFeatures.length > 0 && (
          <hr className='border-input mb-4' />
        )}
        {marketingFeatures && marketingFeatures.length > 0 && (
          <ul className='flex flex-col gap-2'>
            {marketingFeatures.map((feature) => (
              <li key={feature} className='flex items-center gap-2 text-sm'>
                <CircleCheckBig className='text-brand size-4 shrink-0' />
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// New horizontal enterprise card component
export function EnterpriseHorizontal({
  name,
  icon,
  description,
  cta,
  features,
  marketingFeatures,
  variant,
  className,
  ...props
}: EnterpriseHorizontalProps) {
  return (
    <div className={cn(enterpriseHorizontalVariants({ variant, className }))} {...props}>
      <hr className='via-brand/70 absolute top-0 left-[10%] h-[1px] w-[80%] border-0 bg-linear-to-r from-transparent to-transparent' />
      <div className='flex flex-col md:flex-row w-full p-8'>
        {/* Left content - Main info */}
        <div className='flex flex-col gap-4 md:w-2/5 md:pr-6'>
          <div className='flex items-center gap-2'>
            {icon && <div className='text-muted-foreground flex items-center gap-2'>{icon}</div>}
            <h2 className='font-bold text-xl'>{name}</h2>
            <span className='ml-2 text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand'>
              Enterprise Only
            </span>
          </div>
          <p className='text-muted-foreground text-sm'>{description}</p>
          <div className='mt-2'>
            {cta.onClick ? (
              <Button
                variant={cta.variant}
                size='lg'
                onClick={cta.onClick}
                className='flex items-center gap-2 cursor-pointer'
              >
                {cta.label}
                <ArrowRight className='size-4' />
              </Button>
            ) : (
              <Button
                variant={cta.variant}
                size='lg'
                asChild
                className='flex items-center gap-2 cursor-pointer'
              >
                <Link href={cta.href || '#'} data-attr='upgrade'>
                  {cta.label}
                  <ArrowRight className='size-4' />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Divider for mobile */}
        <div className='my-6 border-t border-input md:hidden' />

        {/* Vertical divider for desktop */}
        <div className='hidden md:block border-l border-input mx-2' />

        {/* Right content - Features */}
        <div className='flex-1 md:pl-6'>
          <h3 className='text-lg font-medium mb-4'>Enterprise Features</h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2'>
            {features?.map((feature) => (
              <div key={feature} className='flex items-center gap-2 text-sm'>
                <CircleCheckBig className='text-brand size-4 shrink-0' />
                <span>{feature}</span>
              </div>
            ))}
            {marketingFeatures?.map((feature) => (
              <div key={feature} className='flex items-center gap-2 text-sm'>
                <CircleCheckBig className='text-brand size-4 shrink-0' />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
