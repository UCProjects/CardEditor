const path = require('node:path');
const fs = require('node:fs/promises');
const fetch = require('node-fetch');

const base = path.join('public', 'resources');

const spacer = 0;

// https://undercards.net/images/tribes/*.png
const keywords = []; // kw- !-desc
const tribes = []; // tribe- !all
const tribeKeys = ['all'];

fetch('https://undercards.net/translation/en.json')
  .then((res) => res.json())
  .then((lang) => {
    Object.keys(lang).forEach((key) => {
      /**
       * @type {String}
       */
      const val = lang[key];
      if (key.startsWith('kw-')) {
        if (key.endsWith('-desc')) return;
        keywords.push(val);
      } else if (key.startsWith('tribe-')) {
        if (key === 'tribe-all') return;
        if (val.endsWith('}}')) {
          const sub = val.substring(val.lastIndexOf('|') + 1, val.length - 2);
          tribes.push(sub.endsWith('s') ? `${sub}?` : sub);
        } else {
          tribes.push(val.endsWith('s') ? `${val}?` : val);
        }
        tribeKeys.push(key.substring(6));
      }
    });
  })
  .then(() => Promise.all([
    downloadTribes(),
    saveData(),
  ]))
  // eslint-disable-next-line no-console
  .catch(console.error);

function downloadTribes() {
  return Promise.all(tribeKeys
    .map((tribe) => {
      const name = tribe.toUpperCase().replace('-', '_');
      const loc = `https://undercards.net/images/tribes/${name}.png`;
      return fetch(loc)
        .then((res) => res.body)
        .then((data) => fs.writeFile(path.resolve(base, 'tribes', `${name}.png`), data));
    }));
}

function saveData() {
  const file = path.resolve(base, 'data', 'effects.json');
  const data = [
    ...keywords,
    ...tribes,
  ];
  return saveExtra(file, data)
    .then(() => fs.writeFile(file, JSON.stringify(data, null, spacer)));
}

function saveExtra(file, data) {
  const extra = path.resolve(base, 'data', 'extra.json');
  return Promise.all([fs.readFile(file), fs.readFile(extra)])
    .then((res) => res.map((c) => JSON.parse(c.toString())))
    .then(([old, extras]) => {
      extras.push(...old.filter((text) => !data.includes(text)));
      return extras;
    })
    .then((value) => fs.writeFile(extra, JSON.stringify(value, null, spacer)));
}
