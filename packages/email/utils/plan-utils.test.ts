/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * plan-utils.test.ts
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

import { describe, it, expect } from 'vitest';
import {
  normalizePlanName,
  getPlanConfig,
  getPlanBenefits,
  isFreePlan,
  isProPlan,
  isMaxPlan
} from './plan-utils';
import { PLAN_TYPES } from '../types/plan-types';

describe('Plan Utils', () => {
  describe('normalizePlanName', () => {
    it('should normalize free plan names', () => {
      expect(normalizePlanName('zepid free')).toBe(PLAN_TYPES.FREE);
      expect(normalizePlanName('Zepid Free')).toBe(PLAN_TYPES.FREE);
      expect(normalizePlanName('ZEPID FREE')).toBe(PLAN_TYPES.FREE);
      expect(normalizePlanName('free')).toBe(PLAN_TYPES.FREE);
      expect(normalizePlanName('Free Plan')).toBe(PLAN_TYPES.FREE);
    });

    it('should normalize pro plan names', () => {
      expect(normalizePlanName('zepid pro')).toBe(PLAN_TYPES.PRO);
      expect(normalizePlanName('Zepid Pro')).toBe(PLAN_TYPES.PRO);
      expect(normalizePlanName('ZEPID PRO')).toBe(PLAN_TYPES.PRO);
      expect(normalizePlanName('pro')).toBe(PLAN_TYPES.PRO);
      expect(normalizePlanName('Pro Plan')).toBe(PLAN_TYPES.PRO);
    });

    it('should normalize max plan names', () => {
      expect(normalizePlanName('zepid max')).toBe(PLAN_TYPES.MAX);
      expect(normalizePlanName('Zepid Max')).toBe(PLAN_TYPES.MAX);
      expect(normalizePlanName('ZEPID MAX')).toBe(PLAN_TYPES.MAX);
      expect(normalizePlanName('max')).toBe(PLAN_TYPES.MAX);
      expect(normalizePlanName('Max Plan')).toBe(PLAN_TYPES.MAX);
    });

    it('should default to free plan for unknown names', () => {
      expect(normalizePlanName('unknown')).toBe(PLAN_TYPES.FREE);
      expect(normalizePlanName('')).toBe(PLAN_TYPES.FREE);
    });
  });

  describe('getPlanConfig', () => {
    it('should return the correct plan configuration', () => {
      const freeConfig = getPlanConfig('zepid free');
      const proConfig = getPlanConfig('zepid pro');
      const maxConfig = getPlanConfig('zepid max');

      expect(freeConfig.pricing.monthly).toBe(0);
      expect(proConfig.pricing.monthly).toBe(20);
      expect(maxConfig.pricing.monthly).toBe(40);
    });
  });

  describe('getPlanBenefits', () => {
    it('should return the correct plan benefits', () => {
      const freeBenefits = getPlanBenefits('zepid free');
      const proBenefits = getPlanBenefits('zepid pro');
      const maxBenefits = getPlanBenefits('zepid max');

      expect(freeBenefits.features).toContain('Up to 1 project');
      expect(proBenefits.features).toContain('Up to 3 projects');
      expect(maxBenefits.features).toContain('Up to 6 projects');
    });
  });

  describe('plan type checks', () => {
    it('should correctly identify free plans', () => {
      expect(isFreePlan('zepid free')).toBe(true);
      expect(isFreePlan('Zepid Free')).toBe(true);
      expect(isFreePlan('zepid pro')).toBe(false);
      expect(isFreePlan('zepid max')).toBe(false);
    });

    it('should correctly identify pro plans', () => {
      expect(isProPlan('zepid pro')).toBe(true);
      expect(isProPlan('Zepid Pro')).toBe(true);
      expect(isProPlan('zepid free')).toBe(false);
      expect(isProPlan('zepid max')).toBe(false);
    });

    it('should correctly identify max plans', () => {
      expect(isMaxPlan('zepid max')).toBe(true);
      expect(isMaxPlan('Zepid Max')).toBe(true);
      expect(isMaxPlan('zepid free')).toBe(false);
      expect(isMaxPlan('zepid pro')).toBe(false);
    });
  });
});
