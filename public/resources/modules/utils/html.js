export function img(src) {
  const ret = document.createElement('img');
  ret.src = src;
  return ret;
}

export function span(text) {
  const ret = document.createElement('span');
  ret.textContent = text;
  return ret;
}

export function li(...content) {
  const ret = document.createElement('li');
  ret.append(...content);
  return ret;
}
