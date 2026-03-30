import style from '../../styles/tip.css' with { type: 'css' };
import editor from '../editor/editor.js';
import { contains } from '../utils/array.js';
import { adoptStyle, isElementInViewport } from '../utils/funcs.js';

adoptStyle(style);

const tip = document.createElement('div');
tip.popover = 'hint';
tip.classList.add('tooltip');

document.body.append(tip);

function show(event) {
  const source = event.target;
  if (!source.dataset) return;
  const editorText = editor.isOpen && (source.dataset.editableFor || source.dataset.editable);
  const text = source.dataset.tip;
  if (!text && !editorText) return;
  tip.textContent = text || `Edit ${editorText}`;
  tip.hidePopover();
  tip.classList.remove('flip');
  tip.showPopover({ source });
  tip.classList.toggle('flip', !isElementInViewport(tip));
}

/** @param {MouseEvent} event  */
function hide(event) {
  const keys = ['tip', editor.isOpen && 'editable'];
  if (
    !tip.matches(':popover-open') ||
    event.target.contains(event.toElement || event.relatedTarget) ||
    !event.target.dataset ||
    !contains(keys, Object.keys(event.target.dataset))
  ) return;
  tip.hidePopover();
}

export function close() {
  tip.hidePopover();
}

document.addEventListener('mouseover', show);
document.addEventListener('focus', show);
document.addEventListener('mouseout', hide);
document.addEventListener('blur', hide);
