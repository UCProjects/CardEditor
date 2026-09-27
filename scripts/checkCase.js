const { execSync } = require('node:child_process');

const files = execSync('git ls-files --cached --others --exclude-standard', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const seen = new Map();
const collisions = [];

for (const file of files) {
  const key = file.toLowerCase();
  const first = seen.get(key);
  if (first) collisions.push([first, file]);
  else seen.set(key, file);
}

if (collisions.length) {
  console.error(`${collisions.length} path(s) differ only by case:`);
  collisions.forEach(([a, b]) => console.error(`  ${a}\n  ${b}`));
  process.exitCode = 1;
} else {
  console.log(`No case collisions in ${files.length} files`);
}
