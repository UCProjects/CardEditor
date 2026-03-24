import mirror from 'https://ga.jspm.io/npm:textarea-caret@3.1.0/index.js';

/** @type {HTMLDivElement} */
const picker = document.getElementById('picker');
const fill = picker.querySelector('.picker-preview-fill');
const native = picker.querySelector('.picker-native');
const input = picker.querySelector('.picker-input');
const recent = picker.querySelector('.picker-recent');
const confirm = picker.querySelector('.confirm');
const cancel = picker.querySelector('.cancel');

let editing = false;
let original = null;
let position = -1;

function isOpen() {
  return picker.matches(':popover-open');
}

function open(index, hex = null) {
  editing = hex !== null;
  original = hex;
  position = index;
  // setPosition();
}

function apply(color, live = true) {}
