import { describe, expect, it } from 'vitest';
import { listingToPlant } from './listing-adapter';
import type { Listing } from './api';

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'listing-1',
    title: 'Монстера Делициоза',
    latinName: 'Monstera deliciosa',
    description: 'Крупное тропическое растение',
    price: 2500,
    quantity: 3,
    images: ['https://example.com/a.webp'],
    lightRequirements: 'Яркий рассеянный свет',
    waterRequirements: 'Раз в неделю',
    careInstructions: [],
    status: 'PUBLISHED',
    rejectionReason: null,
    views: 12,
    categoryId: 'cat-1',
    sellerId: 'seller-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    category: { id: 'cat-1', name: 'Комнатные', slug: 'indoor', icon: '🏠', parentId: null, createdAt: '', updatedAt: '' },
    seller: { id: 'seller-1', name: 'Питомник Зелёный Дом' },
    ...overrides,
  } as Listing;
}

describe('listingToPlant', () => {
  it('maps the core listing fields onto the Plant shape', () => {
    const plant = listingToPlant(makeListing());

    expect(plant.id).toBe('listing-1');
    expect(plant.name).toBe('Монстера Делициоза');
    expect(plant.category).toBe('indoor');
    expect(plant.sellerName).toBe('Питомник Зелёный Дом');
    expect(plant.createdAt).toBeInstanceOf(Date);
  });

  it('derives inStock from a positive quantity', () => {
    expect(listingToPlant(makeListing({ quantity: 5 })).inStock).toBe(true);
    expect(listingToPlant(makeListing({ quantity: 0 })).inStock).toBe(false);
  });

  it('falls back to an empty latin name when the listing has none', () => {
    expect(listingToPlant(makeListing({ latinName: null })).latinName).toBe('');
  });

  it('converts null light/water requirements to undefined rather than null', () => {
    const plant = listingToPlant(makeListing({ lightRequirements: null, waterRequirements: null }));
    expect(plant.lightRequirements).toBeUndefined();
    expect(plant.waterRequirements).toBeUndefined();
  });
});
