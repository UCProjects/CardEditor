import { describe, expect, it } from 'vitest';
import { imageRefs } from './imageRefs.js';

describe('imageRefs', () => {
  it('lists every image a card can reference', () => {
    const refs = imageRefs({
      image: 'avatar',
      rarity: 'rarity',
      tribes: ['tribe-a', 'tribe-b'],
      effects: ['effect-a', ['effect-b', 'extra']],
    });
    expect(refs).toEqual(['avatar', 'rarity', 'tribe-a', 'tribe-b', 'effect-a', 'effect-b']);
  });

  it('finds a custom rarity or tribe image', () => {
    expect(imageRefs({ rarity: 'mine' })).toContain('mine');
    expect(imageRefs({ tribes: ['mine'] })).toContain('mine');
  });

  it('copes with elements that have none of them', () => {
    expect(imageRefs({}).filter(Boolean)).toEqual([]);
  });
});
