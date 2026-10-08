import loadResource from './utils/resource.js';

export const keywords = [];
export const specials = ['ATK', 'DMG', 'HP', 'KR', 'cost', 'G', 'TOKEN', 'BASE', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'DT'];

const tribeBlacklist = ['Tem', 'Frog'];

const div = document.querySelector('#descriptionTip div');
function addType(type) {
  const el = document.createElement('span');
  el.innerText = type.replace('s?', '');
  div.append(el, ' ');
}

function addTribes() {
  const container = document.createElement('div');
  container.innerHTML = document.querySelector('#selectTribe').innerHTML;
  keywords.forEach((effect) => {
    if (!effect.endsWith('?')) return;
    const name = effect.substring(0, effect.length - 2);
    if (tribeBlacklist.includes(name)) return;
    container.append(getTribe(name));
  });
  document.querySelector('#selectTribe').innerHTML = container.innerHTML;
}

function getTribe(name) {
  const img = document.createElement('img');
  img.src = `/resources/tribes/${name.toUpperCase().replaceAll(' ', '_')}.png`;
  img.classList.add('selectable', 'smallIcon');
  img.alt = name;
  img.dataset.tip = name;
  img.dataset.tribe = name.toLowerCase();
  img.draggable = false;
  return img;
}

const resources = ['keywords', 'extra'];

export const ready = Promise.all(resources.map(loadResource))
  .then((res) => {
    // Populate effects array
    res.forEach((data) => keywords.push(...data));

    keywords.forEach(addType);
    specials.forEach(addType);
  })
  .then(addTribes);
