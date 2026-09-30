import { expect } from 'vitest';
import { DefaultSkin, FrameSkins, Shiny, frameId, frameLayout, frameURL, parseFrame } from './frames.js';

describe('frames', () => {
  it('defaults to the base skin', () => {
    expect(parseFrame()).toEqual({ skin: DefaultSkin, shiny: Shiny.None });
    expect(parseFrame('')).toEqual({ skin: DefaultSkin, shiny: Shiny.None });
  });

  it('falls back on unknown values', () => {
    expect(parseFrame('Nonsense')).toEqual({ skin: DefaultSkin, shiny: Shiny.None });
    expect(parseFrame('Golden_sparkly')).toEqual({ skin: DefaultSkin, shiny: Shiny.None });
    expect(parseFrame('_shiny')).toEqual({ skin: DefaultSkin, shiny: Shiny.None });
  });

  it('round trips every skin and shiny variant', () => {
    for (const { id } of FrameSkins) {
      for (const shiny of Object.values(Shiny)) {
        expect(parseFrame(frameId(id, shiny))).toEqual({ skin: id, shiny });
      }
    }
  });

  it('handles skins containing underscores', () => {
    expect(parseFrame('Time_to_get_serious_shiny_animated')).toEqual({
      skin: 'Time_to_get_serious',
      shiny: Shiny.Animated,
    });
    expect(parseFrame('Spider_Party')).toEqual({ skin: 'Spider_Party', shiny: Shiny.None });
  });

  it('lays out the base skin', () => {
    expect(frameLayout('Undertale')).toEqual({
      backgroundHeight: 230,
      descTop: 129,
      nameLeft: 8,
      nameTop: 9,
      rarityTop: 213,
      statsTop: 213,
    });
  });

  it('overrides only what a skin changes', () => {
    expect(frameLayout('Deltarune')).toMatchObject({ descTop: 130, rarityTop: 214, statsTop: 214, nameLeft: 8 });
    expect(frameLayout('Spider_Party')).toMatchObject({ descTop: 131, statsTop: 214, nameLeft: 11 });
    expect(frameLayout('Halloween2020')).toMatchObject({
      backgroundHeight: 236,
      descTop: 129,
      nameLeft: 11,
      rarityTop: 219,
      statsTop: 213,
    });
  });

  it('lays out unknown skins like the base skin', () => {
    expect(frameLayout('Nonsense')).toEqual(frameLayout(DefaultSkin));
  });

  it('builds image paths', () => {
    expect(frameURL('Golden', 'monster')).toBe('/resources/images/frames/Golden/frame_monster.png');
    expect(frameURL('Golden', Shiny.Animated)).toBe('/resources/images/frames/Golden/frame_shiny_animated.png');
  });
});
