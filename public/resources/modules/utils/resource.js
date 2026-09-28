/**
 * @param {string} name
 * @returns {Promise<any>}
 */
export default async function loadResource(name) {
  const res = await fetch(`/resources/data/${name}.json`);
  if (!res.ok) throw new Error(`Failed to load ${name}.json (${res.status})`);
  return res.json();
}
