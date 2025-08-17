/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * app-sidebar.tsx
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

'use client'

import { authClient } from '@libra/auth/auth-client'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@libra/ui/components/sidebar'
import {
  CreditCardIcon,
  FileIcon,
  HelpCircleIcon,
  HomeIcon,
  LayoutDashboardIcon,
  MonitorSmartphoneIcon,
  PlugIcon,
  ShieldIcon,
  UsersIcon,
} from 'lucide-react'
import type * as React from 'react'
import { useEffect, useState } from 'react'
import * as m from '@/paraglide/messages'
import { MdForum } from "react-icons/md"
import Github from '../logos/github'
import { NavMain } from './nav-main'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'
import { WorkspaceSwitcher } from './workspace-switch'

// Create a WorkspaceSkeleton component
const WorkspaceSkeleton = () => {
  return (
    <div className='p-4'>
      <div className='flex items-center space-x-2'>
        {/* Skeleton - avatar placeholder */}
        <div className='w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse' />
        <div className='flex-1'>
          {/* Skeleton - workspace name placeholder */}
          <div className='h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
          {/* Skeleton - plan name placeholder */}
          <div className='h-3 w-12 bg-gray-100 dark:bg-gray-800 rounded mt-1 animate-pulse' />
        </div>
        {/* Skeleton - dropdown button placeholder */}
        <div className='w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse' />
      </div>
    </div>
  )
}

// Define organization type based on database schema
interface Organization {
  id: string
  name: string
  slug?: string | null
  logo?: string | null
  createdAt: Date
  metadata?: string | null
}

// Update subscription data type to match API return values
interface SubscriptionData {
  id: string
  plan: string
  referenceId: string
  stripeCustomerId?: string | undefined
  stripeSubscriptionId?: string | undefined
  status: string | undefined | null
  periodStart?: Date | null
  periodEnd?: Date | null
  cancelAtPeriodEnd?: boolean | null
  seats?: number | undefined
  // Add other fields returned by API
  limits?: Record<string, number> | undefined
  priceId?: string | undefined

  // Keep other possible fields
  [key: string]: any
}

// Define the workspace data structure
interface WorkspaceData extends Organization {
  subscription: SubscriptionData | null
}

// Define user data structure
interface UserData {
  id: string
  name: string
  email: string
  image?: string | null
  activeOrganizationId?: string

  [key: string]: any
}

// Define workspace interface data structure
interface ProcessedWorkspace {
  id: string
  name: string
  logo: React.ElementType
  plan: string
  planColor: string
  planGradient: string
  planBadgeClass: string
  slug?: string
}

const getNavMainItems = (userRole?: string) => {
  const items = [
    {
      title: m['dashboard.sidebar.navigation.dashboard'](),
      url: '/dashboard',
      icon: LayoutDashboardIcon,
    },
    {
      title: m['dashboard.sidebar.navigation.teams'](),
      url: '/dashboard/teams',
      icon: UsersIcon,
    },
    {
      title: m['dashboard.sidebar.navigation.billing'](),
      url: '/dashboard/billing',
      icon: CreditCardIcon,
    },
    {
      title: m['dashboard.sidebar.navigation.session'](),
      url: '/dashboard/session',
      icon: MonitorSmartphoneIcon,
    },
    {
      title: m['dashboard.sidebar.navigation.integrations'](),
      url: '/dashboard/integrations',
      icon: PlugIcon,
    },
  ]

  // Add Admin navigation item for admin and superadmin users
  if (userRole === 'admin' || userRole === 'superadmin') {
    items.unshift({
      title: m['dashboard.sidebar.navigation.admin'](),
      url: '/dashboard/admin',
      icon: ShieldIcon,
    })
  }

  return items
}

const getNavSecondaryItems = () => [
  {
    title: m['dashboard.sidebar.navigation.docs'](),
    url: 'https://docs.zepid.dev',
    icon: FileIcon,
  },
  {
    title: m['dashboard.sidebar.navigation.github'](),
    url: 'https://github.com/nextify-limited/libra',
    icon: Github,
  },
  {
    title: m['dashboard.sidebar.navigation.support'](),
    url: 'https://forum.zepid.dev',
    icon: MdForum,
  },
  {
    title: m['dashboard.sidebar.navigation.help'](),
    url: 'https://forum.libra.dev/c/9-category/9',
    icon: HelpCircleIcon,
  },
]

export function AppSidebar({
  userData,
  ...props
}: {
  userData: UserData
} & React.ComponentProps<typeof Sidebar>) {
  // Get user session for admin permission check
  const { data: session } = authClient.useSession()

  // Use authClient to get organization list - add isPending state
  const { data: organizations = [], isPending: organizationsPending } =
    // @ts-ignore
    authClient.useListOrganizations()
  // @ts-ignore
  const { data: activeOrganization } = authClient.useActiveOrganization()

  // Use useState to store subscription data
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  // Add loading state tracking
  const [isLoading, setIsLoading] = useState<boolean>(true)
  // Use useEffect to asynchronously fetch subscription data
  useEffect(() => {
    // Only fetch subscriptions when organizationsPending is false and organizations has data
    const orgs = organizations || [] // Ensure orgs is always an array, prevent null
    if (!organizationsPending && orgs.length > 0) {
      const fetchAllSubscriptions = async () => {
        try {
          const subscriptionPromises = orgs.map((org: any) =>
            // @ts-ignore
            authClient.subscription.list({
              query: {
                referenceId: org.id,
              },
            })
          )
          const results = await Promise.all(subscriptionPromises)
          const allSubscriptions = results.flatMap((result: { data: any }) => result.data || [])
          setSubscriptions(allSubscriptions)
          setIsLoading(false)
        } catch (error) {
          setSubscriptions([])
          setIsLoading(false)
        }
      }
      fetchAllSubscriptions()
    } else if (!organizationsPending && orgs.length === 0) {
      // Organizations loaded but empty
      setSubscriptions([])
      setIsLoading(false)
    } else {
      // Organizations still loading, keep loading state
      setIsLoading(true)
    }
  }, [organizations, organizationsPending])

  // Extract username from email (part before the @ symbol)
  const extractUsernameFromEmail = (email: string): string => {
    if (!email || email.trim() === '') return ''
    // Get the content before the @ symbol as the username
    const username = email.split('@')[0]
    // If extraction is successful and not empty, return that username, otherwise return empty string
    return username || ''
  }

  // Process user data
  const processedUserData = {
    name: userData.name || extractUsernameFromEmail(userData.email) || 'Guest',
    email: userData.email || 'No email',
    avatar: userData.image || '/avatars/default.jpg',
    status: 'online' as const,
    notificationCount: 0,
  }

  // Process workspace data
  const workspaces: ProcessedWorkspace[] = (organizations || []).map(
    (organization: { id: string; name: any; slug: any }) => {
      // Find matching subscription data
      const subscription =
        subscriptions.find(
          (sub) => sub && sub.referenceId === organization.id && sub.status === 'active'
        ) || null

      // Choose an appropriate icon
      const logo = HomeIcon

      // Determine plan type based on subscription
      let plan = 'FREE'

      if (subscription && subscription.status === 'active') {
        const subscriptionPlan = subscription.plan
        if (subscriptionPlan === 'libra pro') {
          plan = 'PRO'
        } else if (subscriptionPlan === 'libra max') {
          plan = 'MAX'
        }
      }

      // Add plan colors and icons
      let planColor = 'text-gray-500'
      let planGradient = 'from-gray-400 to-gray-600'
      let planBadgeClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'

      switch (plan) {
        case 'PRO':
          planColor = 'text-blue-500'
          planGradient = 'from-blue-400 to-blue-600'
          planBadgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          break
        case 'MAX':
          planColor = 'text-purple-500'
          planGradient = 'from-purple-400 to-purple-600'
          planBadgeClass =
            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
          break
      }

      return {
        id: organization.id,
        name: organization.name,
        logo,
        plan,
        planColor,
        planGradient,
        planBadgeClass,
        slug: organization.slug || undefined,
      }
    }
  )

  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        {isLoading ? <WorkspaceSkeleton /> : <WorkspaceSwitcher teams={workspaces} />}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={getNavMainItems(session?.user?.role ?? undefined)} />
        <NavSecondary items={getNavSecondaryItems()} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={processedUserData} />
      </SidebarFooter>
    </Sidebar>
  )
}
