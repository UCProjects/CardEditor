const baseLayout = Object.freeze({
  backgroundHeight: 230,
  descTop: 129,
  nameLeft: 8,
  nameTop: 9,
  rarityTop: 213,
  statsTop: 213,
});

const lowerLayout = { descTop: 130, rarityTop: 214, statsTop: 214 };

export const FrameSkins = Object.freeze([
  { id: 'Undertale', name: 'Undertale' },
  { id: 'Deltarune', name: 'Deltarune', layout: lowerLayout },
  { id: 'Christmas2020', name: 'Christmas 2020' },
  { id: 'Golden', name: 'Golden' },
  { id: 'Halloween2020', name: 'Halloween 2020', layout: { backgroundHeight: 236, nameLeft: 11, rarityTop: 219 } },
  { id: 'Ranked2025', name: 'Ranked 2025' },
  { id: 'Spider_Party', name: 'Spider Party', layout: { ...lowerLayout, descTop: 131, nameLeft: 11 } },
  { id: 'Time_to_get_serious', name: 'Time to get serious', layout: lowerLayout },
  { id: 'Vaporwave', name: 'Vaporwave' },
]);

export const Shiny = Object.freeze({
  None: '',
  Still: 'shiny',
  Animated: 'shiny_animated',
});

export const DefaultSkin = FrameSkins[0].id;

const shinies = Object.values(Shiny).filter(Boolean);

/**
 * @param {string} [frame]
 * @returns {{ skin: string; shiny: string }}
 */
export function parseFrame(frame = '') {
  for (const { id } of FrameSkins) {
    if (frame === id) return { skin: id, shiny: Shiny.None };
    const shiny = shinies.find((kind) => frame === `${id}_${kind}`);
    if (shiny) return { skin: id, shiny };
  }
  return { skin: DefaultSkin, shiny: Shiny.None };
}

/**
 * @param {string} skin
 * @param {string} [shiny]
 */
export function frameId(skin, shiny = Shiny.None) {
  return shiny ? `${skin}_${shiny}` : skin;
}

/** @param {string} skin */
export function frameLayout(skin) {
  return { ...baseLayout, ...FrameSkins.find(({ id }) => id === skin)?.layout };
}

/**
 * @param {string} skin
 * @param {'monster' | 'spell' | 'shiny' | 'shiny_animated'} kind
 */
export function frameURL(skin, kind) {
  return `/resources/images/frames/${skin}/frame_${kind}.png`;
}
