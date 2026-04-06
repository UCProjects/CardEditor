export function luminance(hex6) {
  const r = parseInt(hex6.slice(0,2),16)/255;
  const g = parseInt(hex6.slice(2,4),16)/255;
  const b = parseInt(hex6.slice(4,6),16)/255;
  return 0.2126*r + 0.7152*g + 0.0722*b;
}

export function isHashHex(h) { return /^#[0-9a-fA-F]{6}$/.test(h); }

export function isFullHex(h) { return /^[0-9a-fA-F]{6}$/.test(h); }

export function getHex(color = '') {
  const index = color.indexOf('#') + 1;
  const end = color.indexOf('|') + 1 || color.length;
  const [ hex = '' ] = color.substring(index, end).match(/^[0-9a-fA-F]{0,6}/) || [];
  if (isFullHex(hex)) return hex;
  return null;
}