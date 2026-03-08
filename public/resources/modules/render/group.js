import style from './group.css' with { type: 'css' };
import Renderer from './base.js';
// import { Elements } from '../elements/types.js';

document.adoptedStyleSheets.push(style);

export default class Group extends Renderer {
  /** @type {import('../elements/group.js').default} */
  get element() {
    return super.element;
  }

  /** Must be manually called */
  content() {
    // TODO Get content and render them all
  }
}
