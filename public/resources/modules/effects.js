export const effects = [
  // Keywords
  'Armor', 'Candy', 'Charge', 'Disarmed', 'Dodge', 'Dust', 'Fatigue', 'Future', 'Haste', 'Invulnerable', 'Magic', 'Paralyze', 'Ranged', 'Silence', 'Support', 'Taunt', 'Transparency', 'Turbo', 'Turn end', 'Turn start', 'Thorns',
  'Synergy', 'Shock', 'Delay',
  // Tribes
  'Amalgamates?', 'Bombs?', 'Dogs?', 'Froggits?', 'G Followers?', 'Lost Souls?', 'Molds?', 'Plants?', 'Royal Guards?', 'Snails?', 'Spiders?', 'Temmies?', 'Chaos Weapons?',
  'Arachnids?', 'Pieces?', 'Royal Inventions?',
  // Other
  `Gerson's Artifact`, 'Genocide', 'Outbreak',
];
export const specials = ['ATK', 'DMG', 'HP', 'KR', 'cost', 'G', 'GENERATED', 'BASE', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'DT'];

const div = document.querySelector('#descriptionTip div');
function addType(type) {
    const el = document.createElement('span');
    el.innerText = type.replace('s?', '');
    div.append(el, ' ');
}
effects.forEach(addType);
specials.forEach(addType);
