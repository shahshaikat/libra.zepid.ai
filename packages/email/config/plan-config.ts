/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * plan-config.ts
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

import { PLAN_TYPES, type PlanConfigMap } from '../types/plan-types';

/**
 * Plan configuration for email templates
 * Contains marketing information, features, and pricing for each plan
 */
export const PLAN_EMAIL_CONFIG: PlanConfigMap = {
  [PLAN_TYPES.FREE]: {
    benefits: {
      features: [
        'Up to 1 project',
        '10 AI messages per month',
        'Core features access',
        'Community support',
        'Self-hosting capabilities'
      ],
      description: 'Perfect for everyone starting out on a website for their big idea. Get started with essential features to bring your vision to life.',
      ctaText: 'Start Building Your Project',
      welcomeMessage: 'Welcome to Zepid! You\'re all set to start building amazing projects with our AI-powered platform. Your free plan gives you everything you need to get started.'
    },
    pricing: {
      monthly: 0,
      yearly: 0,
      currency: 'USD'
    },
    limits: {
      projects: 1,
      aiMessages: 10,
      seats: 1
    }
  },

  [PLAN_TYPES.PRO]: {
    benefits: {
      features: [
        'Up to 3 projects',
        '100 AI messages per month',
        'Private projects',
        'Remove the Zepid badge',
        'Custom domains',
        'Website hosting included',
        'Email support'
      ],
      description: 'Perfect for small teams and growing businesses. Scale your development with advanced features and professional support.',
      ctaText: 'Explore Pro Features',
      welcomeMessage: 'Welcome to Zepid Pro! You now have access to powerful features designed for professional development and team collaboration.'
    },
    pricing: {
      monthly: 20,
      yearly: 240,
      currency: 'USD'
    },
    limits: {
      projects: 3,
      aiMessages: 100,
      seats: 5
    }
  },

  [PLAN_TYPES.MAX]: {
    benefits: {
      features: [
        'Up to 6 projects',
        '250 AI messages per month',
        'Everything in Pro, plus:',
        'Early access to features',
        'More projects and AI messages',
        'Community forum support',
        'Priority customer support'
      ],
      description: 'For larger teams with advanced needs. Get maximum power and priority support for your most ambitious projects.',
      ctaText: 'Unlock Maximum Potential',
      welcomeMessage: 'Welcome to Zepid Max! You\'re now part of our premium tier with access to the most advanced features and priority support.'
    },
    pricing: {
      monthly: 40,
      yearly: 480,
      currency: 'USD'
    },
    limits: {
      projects: 6,
      aiMessages: 250,
      seats: 20
    }
  }
};
