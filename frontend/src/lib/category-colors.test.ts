import { describe, expect, it } from 'vitest';
import { categoryColor } from './category-colors';

describe('categoryColor', () => {
  it('returns a distinct color for consecutive indexes within the palette', () => {
    const first = categoryColor(0);
    const second = categoryColor(1);
    expect(first.bg).not.toBe(second.bg);
  });

  it('cycles back to the same color once the index exceeds the palette size', () => {
    const first = categoryColor(0);
    const wrapped = categoryColor(6);
    expect(wrapped).toEqual(first);
  });

  it('always returns a bg and text color', () => {
    for (let i = 0; i < 10; i++) {
      const color = categoryColor(i);
      expect(color.bg).toMatch(/^#/);
      expect(color.text).toMatch(/^#/);
    }
  });
});
