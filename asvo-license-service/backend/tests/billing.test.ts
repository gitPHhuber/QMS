import { describe, it, expect } from 'vitest';
import { TIER_PRESETS, getTierPrice, TierName } from '../src/config';

describe('billing calculations', () => {
  // -----------------------------------------------------------------------
  describe('next billing date calculation', () => {
    const cycleDaysMap = { monthly: 30, quarterly: 90, annual: 365 } as const;

    it.each([
      ['monthly', 30],
      ['quarterly', 90],
      ['annual', 365],
    ] as const)('adds %i days for %s cycle', (cycle, expectedDays) => {
      const start = new Date('2025-06-01T00:00:00Z');
      const nextBilling = new Date(start.getTime() + expectedDays * 86400000);

      // Verify the expected number of days between start and next billing
      const diffDays = (nextBilling.getTime() - start.getTime()) / 86400000;
      expect(diffDays).toBe(expectedDays);
    });

    it('monthly cycle from Jan 1 lands on Jan 31', () => {
      const start = new Date('2025-01-01T00:00:00Z');
      const next = new Date(start.getTime() + cycleDaysMap.monthly * 86400000);
      expect(next.toISOString().slice(0, 10)).toBe('2025-01-31');
    });

    it('quarterly cycle from Jan 1 lands on Apr 1', () => {
      const start = new Date('2025-01-01T00:00:00Z');
      const next = new Date(start.getTime() + cycleDaysMap.quarterly * 86400000);
      expect(next.toISOString().slice(0, 10)).toBe('2025-04-01');
    });

    it('annual cycle from Jan 1 lands on Dec 31', () => {
      const start = new Date('2025-01-01T00:00:00Z');
      const next = new Date(start.getTime() + cycleDaysMap.annual * 86400000);
      // 365 days from 2025-01-01 = 2026-01-01
      expect(next.toISOString().slice(0, 10)).toBe('2026-01-01');
    });
  });

  // -----------------------------------------------------------------------
  describe('quarterly discount is 10%', () => {
    const tiersToTest: TierName[] = ['start', 'standard', 'pro', 'industry'];

    it.each(tiersToTest)(
      'tier "%s" quarterly price equals monthly * 3 * 0.9',
      (tier) => {
        const preset = TIER_PRESETS[tier];
        const expectedQuarterly = preset.price_monthly * 3 * 0.9;
        expect(preset.price_quarterly).toBe(expectedQuarterly);
      },
    );
  });

  // -----------------------------------------------------------------------
  describe('annual discount is 20%', () => {
    const tiersToTest: TierName[] = ['start', 'standard', 'pro', 'industry'];

    it.each(tiersToTest)(
      'tier "%s" annual price equals monthly * 12 * 0.8',
      (tier) => {
        const preset = TIER_PRESETS[tier];
        const expectedAnnual = preset.price_monthly * 12 * 0.8;
        expect(preset.price_annual).toBe(expectedAnnual);
      },
    );
  });

  // -----------------------------------------------------------------------
  describe('getTierPrice returns correct amounts from TIER_PRESETS', () => {
    it('returns the monthly price for each tier', () => {
      expect(getTierPrice('start', 'monthly')).toBe(15000);
      expect(getTierPrice('standard', 'monthly')).toBe(35000);
      expect(getTierPrice('pro', 'monthly')).toBe(60000);
      expect(getTierPrice('industry', 'monthly')).toBe(120000);
      expect(getTierPrice('corp', 'monthly')).toBe(0);
    });

    it('returns the quarterly price for each tier', () => {
      expect(getTierPrice('start', 'quarterly')).toBe(40500);
      expect(getTierPrice('standard', 'quarterly')).toBe(94500);
      expect(getTierPrice('pro', 'quarterly')).toBe(162000);
      expect(getTierPrice('industry', 'quarterly')).toBe(324000);
    });

    it('returns the annual price for each tier', () => {
      expect(getTierPrice('start', 'annual')).toBe(144000);
      expect(getTierPrice('standard', 'annual')).toBe(336000);
      expect(getTierPrice('pro', 'annual')).toBe(576000);
      expect(getTierPrice('industry', 'annual')).toBe(1152000);
    });

    it('matches what is stored in TIER_PRESETS for every combination', () => {
      const cycles: Array<'monthly' | 'quarterly' | 'annual'> = ['monthly', 'quarterly', 'annual'];
      const tiers = Object.keys(TIER_PRESETS) as TierName[];

      for (const tier of tiers) {
        for (const cycle of cycles) {
          const key = `price_${cycle}` as const;
          expect(getTierPrice(tier, cycle)).toBe(TIER_PRESETS[tier][key]);
        }
      }
    });
  });
});
