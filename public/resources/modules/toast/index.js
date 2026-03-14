import style from './toast.css' with { type: 'css' };

document.adoptedStyleSheets.push(style);

const breadbox = document.querySelector('#breadbox');
const toastTemplate = document.querySelector('template#toast');

export function toast({
  body = '',
  classes = [],
  footer = '',
  signal,
  title = '',
}) {
  const el = document.createElement('article');

  function close() {
    el.remove();
  }

  el.classList.add('toast', ...classes);

  el.innerHTML = toastTemplate.innerHTML;
  el.querySelector('header').innerHTML = title;
  el.querySelector('div').innerHTML = body;
  el.querySelector('footer').innerHTML = footer;

  el.onclick = close;
  signal?.addEventListener('abort', close);

  breadbox.append(el);
}

export function errorToast({
  classes = [],
  ...rest
}) {
  toast({
    classes: [
      'error',
      ...classes,
    ],
    ...rest,
  });
}

export function tryOrError(callback, message = '') {
  try {
    return callback();
  } catch (err) {
    console.error(err);
    errorToast({ body: message });
  }
  return undefined;
}
