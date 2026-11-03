import { loadStyle } from '../utils/funcs.js';
import { formatSize, preview } from '../utils/bundlePreview.js';
import { AUTO_HIDE_MS, error, toast, tryOrError } from '../toast/index.js';
import { Action, inspect, unpack } from '../transfer.js';

loadStyle('/resources/styles/dialog.css', '/resources/styles/importDialog.css');

const NAMES_SHOWN = 5;

/** @type {HTMLDialogElement} */
const dialog = document.querySelector('#import');

/** @param {number} count */
function elements(count) {
  return `${count} element${count === 1 ? '' : 's'}`;
}

/** @param {import('../transfer.js').BundleItem[]} items */
function overwriteNotice(items) {
  if (!items.length) return '';
  const names = items.slice(0, NAMES_SHOWN).map(({ name }) => name).join(', ');
  const more = items.length > NAMES_SHOWN ? ` and ${items.length - NAMES_SHOWN} more` : '';
  return `${elements(items.length)} will be overwritten: ${names}${more}`;
}

/** @param {import('../transfer.js').BundleItem} item */
function actionOptions({ exists, trashed }) {
  if (exists) return [[Action.Copy, 'Duplicate'], [Action.Replace, 'Overwrite'], [Action.Skip, 'Ignore']];
  if (trashed) return [[Action.Copy, 'Duplicate'], [Action.Skip, 'Ignore']];
  return [[Action.Copy, 'Import'], [Action.Skip, 'Ignore']];
}

/** @param {import('../transfer.js').BundleItem[]} items */
function bulkChoices(items) {
  const taken = items.some(({ exists, trashed }) => exists || trashed);
  return [
    [Action.Copy, taken ? 'Duplicate' : 'Import'],
    ...items.some(({ exists }) => exists) ? [[Action.Replace, 'Overwrite']] : [],
    [Action.Skip, 'Ignore'],
  ];
}

function showArchive() {
  const archive = document.querySelector('.archive');
  if (!archive.matches(':popover-open')) archive.showPopover();
}

/**
 * @param {import('../transfer.js').BundleItem} item
 * @param {boolean} nested
 * @param {(action: string) => void} onChange
 */
function buildRow(item, nested, onChange) {
  const li = document.createElement('li');
  li.classList.toggle('child', nested);

  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = item.name;
  name.title = item.type;
  li.append(name);

  const status = item.exists ? 'exists' : item.trashed && 'in trash';
  if (status) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = status;
    li.append(tag);
  }

  const select = document.createElement('select');
  select.name = 'action';
  select.autocomplete = 'off';
  select.ariaLabel = `Action for ${item.name}`;
  actionOptions(item).forEach(([value, label]) => select.add(new Option(label, value)));
  select.addEventListener('change', () => onChange(select.value));
  li.append(select);

  return { li, select };
}

/** @param {import('../transfer.js').Bundle} bundle */
export function openImport(bundle) {
  let info;
  try {
    info = inspect(bundle);
  } catch (err) {
    error({ body: err.message });
    return;
  }

  /** @type {HTMLInputElement} */
  const ignore = dialog.querySelector('input[name="ignore"]');
  /** @type {HTMLSelectElement} */
  const bulk = dialog.querySelector('select.bulk');
  /** @type {HTMLButtonElement} */
  const accept = dialog.querySelector('.accept');
  const list = dialog.querySelector('.rows');
  const warning = dialog.querySelector('.notice');
  const size = dialog.querySelector('.size');
  const output = dialog.querySelector('textarea');

  const { items } = info;
  const choosable = items.length > 1 || items.some(({ exists, trashed }) => exists || trashed);
  const inBundle = new Set(items.map(({ id }) => id));
  /** @type {Record<string, string>} */
  const actions = Object.fromEntries(items.map(({ id }) => [id, Action.Copy]));
  const selects = new Map();

  function importing() {
    return items.filter(({ id }) => actions[id] !== Action.Skip);
  }

  function render() {
    const kept = new Set(importing().map(({ id }) => id));
    const shown = {
      ...bundle,
      assets: ignore.checked ? {} : bundle.assets,
      elements: bundle.elements.filter(({ id }) => kept.has(id)),
    };
    output.value = preview(shown);
    size.textContent = formatSize(new Blob([JSON.stringify(shown)]).size);

    const message = overwriteNotice(items.filter(({ id }) => actions[id] === Action.Replace));
    warning.textContent = message;
    warning.classList.toggle('hidden', !message);
    accept.disabled = !kept.size;
  }

  list.replaceChildren(...items.map((item) => {
    const { li, select } = buildRow(item, inBundle.has(item.parent), (action) => {
      actions[item.id] = action;
      render();
    });
    selects.set(item.id, select);
    return li;
  }));
  list.classList.toggle('hidden', !choosable);
  bulk.classList.toggle('hidden', !choosable);
  const bulkOptions = bulkChoices(items);
  bulk.replaceChildren(new Option('Set all to…', ''), ...bulkOptions.map(([value, label]) => new Option(label, value)));
  bulk.value = '';
  ignore.checked = false;
  dialog.querySelector('.images').classList.toggle('hidden', !info.assets);
  render();

  const controller = new AbortController();
  const options = { signal: controller.signal };
  dialog.addEventListener('close', () => controller.abort(), { once: true });

  ignore.addEventListener('change', render, options);

  bulk.addEventListener('change', () => {
    if (!bulk.value) return;
    items.forEach(({ id, exists }) => {
      const action = bulk.value === Action.Replace && !exists ? Action.Copy : bulk.value;
      actions[id] = action;
      selects.get(id).value = action;
    });
    bulk.value = '';
    render();
  }, options);

  accept.addEventListener('click', async () => {
    const imported = await tryOrError(async () => {
      await unpack(bundle, { assets: !ignore.checked, actions });
      return true;
    }, 'Failed to import');
    if (!imported) return;
    toast({ body: `Imported ${elements(importing().length)}`, signal: AbortSignal.timeout(AUTO_HIDE_MS) });
    dialog.close();
    showArchive();
  }, options);

  dialog.showModal();
}
