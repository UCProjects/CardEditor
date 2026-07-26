import { validate, version } from 'https://ga.jspm.io/npm:uuid@13.0.0/dist/index.js';
export { v4 as uuidV4, v6 as uuidV6, v7 as uuidV7, validate as uuidValidate, version as uuidVersion } from 'https://ga.jspm.io/npm:uuid@13.0.0/dist/index.js';

export function uuidValidateV4(uuid) {
  return uuidValidate(uuid, 4);
}

export function uuidValidateV6(uuid) {
  return uuidValidate(uuid, 6);
}

export function uuidValidateV7(uuid) {
  return uuidValidate(uuid, 7);
}

function uuidValidate(uuid, ver) {
  return validate(uuid) && version(uuid) === ver;
}
