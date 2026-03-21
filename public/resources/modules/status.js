export const effects = [];

const container = document.getElementById('effects');

export async function load() {
  const res = await fetch(`/resources/data/status.json`);
  const data = await res.json();

  effects.push(...data);

  data.forEach((effect) => {
    const img = document.createElement('img');
    img.src = `/resources/images/effects/${effect}.png`;
    img.classList.add('selectable', 'smallIcon');
    img.dataset.value = effect;
    img.draggable = false;
    container.append(img);
  });
}