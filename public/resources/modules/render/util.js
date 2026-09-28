import { keywords, specials } from '../keywords.js';
import Builder from '../utils/builder.js';
import { hasKey } from '../utils/funcs.js';

const underlineRegex = new Builder(() => new RegExp(`(?<!\\\\)(${keywords.join('|')})(?![^{]*})|_([^_]+)_`, 'g'));
const specialRegex = new RegExp(`(?<!{|"|>|\\w|\\\\)(${specials.join('|')})(?![\\w}])`, 'g');
const colorRegex = /(?<!{){(?!{)([^;|}]*)[^}]*[;|]([^}]*)}/g; // /\{color:([^}]+)}(.*){\/color}/g;
const highlightRegex = /(?<!{){(?!{)([^|}]+)}/g;
const commandRegex = /{{([^}]*)}}/g;

const commands = {
  // image() {},
  stats(args) {
    return ['COST', 'attack', 'health']
      .slice(Math.max(0, 3 - args.length))
      .map((clazz, i) => {
        const text = args[i];
        if (text.trim()) return text.replace(/\d+/, `<span class="${clazz}">$&</span>`);
        return '';
      })
      .filter(_ => _)
      .join('/');
  },
  switch([text, direction = 'left']) {
    if (!text) return '';
    return `<span class="switch${direction.startsWith('r') ? 'Right' : 'Left'}">${text}</span>`;
  }
};

const classes = {
  ATK: 'attack',
  DMG: 'damage',
  G: 'gold',
  HP: 'health',
  KR: 'poison',
  cost: 'COST',
};

export function getHTMLDescription(description = '') {
  return description
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replace(commandRegex, (_, $1) => process($1))
    .replace(underlineRegex.value, (_, $1, $2) => `<span class="underline">${$2 || $1}</span>`)
    .replace(colorRegex, (_, $1, $2) => `<span style="color:${$1}">${$2}</span>`)
    .replace(specialRegex, (_, $1) => `<span class="${getClass($1)}">${$1}</span>`)
    .replace(highlightRegex, (_, $1) => `<span class="cardName">${$1}</span>`)
    .replaceAll('\\', '');
}

function process(text = '') {
  const [first = '', ...args] = text.split('|');
  const [command, ...rest] = first.split(':');
  if (rest.length) {
    const add = rest.join(':');
    if (add) args.unshift(add);
  }
  const key = command.toLowerCase();
  const handler = hasKey(commands, key) && commands[key];
  if (typeof handler !== 'function') return '';
  return handler(args);
}

function getClass(keyword) {
  return hasKey(classes, keyword) ? classes[keyword] : keyword;
}
