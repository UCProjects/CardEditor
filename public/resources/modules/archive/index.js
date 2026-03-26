import style from '../../styles/archive.css' with { type: 'css' };

document.adoptedStyleSheets.push(style);

/** @type {HTMLDivElement} */
const button = document.querySelector('.archive-button');
/** @type {HTMLDivElement} */
const archive = document.querySelector('.archive');

export function isOpen() {
  return archive.matches(':popover-open');
}

archive.addEventListener('toggle', () => {
  button.classList.toggle('hidden', archive.matches(':popover-open'));
});

button.addEventListener('click', () => {
  archive.showPopover();
});

function setActive(page) {
  const el = archive.querySelector(`div[data-page="${page}"]`);
  if (el.matches('.active')) return;
  archive.querySelector('.active').classList.remove('active');
  el.classList.add('active');
}

archive.querySelectorAll('input[name="page"]').forEach((el) => {
  el.addEventListener('change', () => setActive(el.id));
});

// Get all items
// hide items being used
// add new items, hidden
// Add delete button
// Drag onto group?
// Drag into archive?