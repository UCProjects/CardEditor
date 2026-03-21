import { keywords, specials } from '../keywords.js';
import Builder from '../utils/builder.js';

const underlineRegex = new Builder(() => new RegExp(`(?<!\\\\)(${keywords.join('|')})(?![^{]*})|_([^_]+)_`, 'g'));
const specialRegex = new RegExp(`(?<!{|>|\\w|\\\\)(${specials.join('|')})(?![\\w}])`, 'g');
const colorRegex = /\{([^;|}]*)[^}]*[;|]([^}]+)}/g; // /\{color:([^}]+)}(.*){\/color}/g;
const highlightRegex = /\{([^}]+)}/g;

export function getHTMLDescription(description = '') {
  return description
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replace(underlineRegex.value, (_, $1, $2) => `<span class="underline">${$2 || $1}</span>`)
    .replace(colorRegex, (_, $1, $2) => `<span style="color:${$1}">${$2}</span>`)
    .replace(specialRegex, (_, $1) => `<span class="${getClass($1)}">${$1}</span>`)
    .replace(highlightRegex, (_, $1) => `<span class="cardName">${$1}</span>`)
    .replaceAll('\\', '');
}

function getClass(keyword) {
  switch (keyword) {
    case 'ATK': return 'attack';
    case 'HP': return 'health';
    case 'DMG': return 'damage';
    case 'KR': return 'poison';
    case 'G': return 'gold';
    case 'cost': return 'COST';
    case 'DT':
    case 'LEGENDARY':
    case 'EPIC':
    case 'RARE':
    case 'COMMON':
    case 'BASE':
    case 'TOKEN':
    case 'GENERATED': return keyword;
    default: throw new Error(`Unknown Keyword: ${keyword}`);
  }
}