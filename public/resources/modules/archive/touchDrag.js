import { Draggable } from 'https://ga.jspm.io/npm:@shopify/draggable@1.2.1/build/esm/index.mjs';

const HOLD_MS = 250;

/**
 * @param {HTMLElement} container
 * @param {{
 *  draggable: string;
 *  handle: string;
 *  mirrorParent: HTMLElement;
 *  start: (source: HTMLElement) => void;
 *  move: (target: Element | null) => void;
 *  stop: (target: Element | null) => void;
 * }} options stop receives null when the touch was cancelled
 */
export default function initTouchDrag(container, { draggable, handle, mirrorParent, start, move, stop }) {
  const { Plugins, Sensors } = Draggable;
  new Draggable([container], {
    draggable,
    handle,
    delay: { touch: HOLD_MS },
    mirror: { appendTo: mirrorParent, constrainDimensions: true },
    exclude: {
      plugins: [Plugins.Focusable, Plugins.Announcement],
      sensors: [Sensors.MouseSensor],
    },
  })
    .on('drag:start', ({ originalSource }) => start(originalSource))
    .on('drag:move', ({ sensorEvent }) => move(sensorEvent.target));

  container.addEventListener('drag:stop', ({ detail }) => {
    stop(detail.originalEvent?.type === 'touchcancel' ? null : detail.target);
  });
}
