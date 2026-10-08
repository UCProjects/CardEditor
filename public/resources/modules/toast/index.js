import style from '../../styles/toast.css' with { type: 'css' };
import { adoptStyle } from '../utils/funcs.js';

adoptStyle(style);

export function toast({
  body = '',
  classes = [],
  footer = '',
  onClose,
  signal,
  title = '',
}) {
  return window.SimpleToast({
    className: classes,
    footer,
    onClose,
    signal,
    text: body,
    title,
  });
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
    if (message) {
      const body = typeof message === 'function' ? message() : message;
      error({ body });
    }
  }
  return undefined;
}

export function tryOrErrorSync(callback, message = '') {
  try {
    return callback();
  } catch (err) {
    console.error(err);
    if (message) {
      const body = typeof message === 'function' ? message() : message;
      if (body) error({ body });
    }
  }
  return undefined;
}
