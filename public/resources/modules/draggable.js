//
import { Draggable, Sortable } from 'https://ga.jspm.io/npm:@shopify/draggable@1.2.1/build/esm/index.mjs';
import { editing } from './card.js';

const instance = new Sortable([], {
  draggable: '.element',
  classes: {
    'source:dragging': 'dragging',
  },
  // handle: '.name',
}).removePlugin(Draggable.Plugins.Focusable, Draggable.Plugins.Announcement)
  // .removeSensor(Sensors.TouchSensor)
  .on('drag:start', (e) => {
    if (editing || !e.sourceContainer.parentElement.classList.contains('sortmode')) e.cancel();
  });

export default function setup(group) {
  instance.addContainer(group.querySelector('.cards'));
  group.querySelector('.sidebar .sort').parentElement.onclick = () => {
    group.classList.toggle('sortmode');
  };
}

export function isDragging() {
  return instance?.isDragging();
}
