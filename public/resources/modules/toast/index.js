import style from '../../styles/toast.css' with { type: 'css' };
import EventEmitter from '../eventManager.js';

document.adoptedStyleSheets.push(style);

const breadbox = document.querySelector('#breadbox');
const template = document.querySelector('template#toast').innerHTML;

export function toast({
  body = '',
  classes = [],
  footer = '',
  signal,
  title = '',
}) {
  const el = document.createElement('article');
  const events = new EventEmitter();

  function close() {
    el.remove();
    events.emit('close');
  }

  el.classList.add('toast', ...classes);

  el.innerHTML = template;
  el.querySelector('header').innerHTML = title;
  el.querySelector('div').innerHTML = body;
  el.querySelector('footer').innerHTML = footer;

  el.onclick = close;
  signal?.addEventListener('abort', close);

  breadbox.append(el);

  Object.defineProperty(events, 'isOpen', {
    get: () => el.isConnected,
  });

  return events;
}

export function error({
  classes = [],
  ...rest
}) {
  return toast({
    classes: [
      'error',
      ...classes,
    ],
    ...rest,
  });
}

export async function tryOrError(callback, message = '') {
  try {
    return await callback();
  } catch (err) {
    console.error(err);
    if (message) error({ body: message });
  }
  return undefined;
}

export function tryOrErrorSync(callback, message = '') {
  try {
    return callback();
  } catch (err) {
    console.error(err);
    if (message) error({ body: message });
  }
  return undefined;
}
