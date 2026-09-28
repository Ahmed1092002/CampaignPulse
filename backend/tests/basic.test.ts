import { describe, it, expect } from 'vitest';

describe('Basic Tests', () => {
  it('should pass basic math', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    expect('CampaignPulse'.toLowerCase()).toBe('campaignpulse');
  });
});

describe('Utils', () => {
  it('should format date', () => {
    const date = new Date('2024-01-15');
    expect(date.getFullYear()).toBe(2024);
  });
});