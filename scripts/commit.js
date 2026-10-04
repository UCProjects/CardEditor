const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
}

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function run() {
  const [message] = process.argv.slice(2);
  if (!message) throw new Error('Usage: node scripts/commit.js <message>');
  if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Refusing to commit and push outside of GitHub Actions');

  git('config', 'user.name', 'github-actions[bot]');
  git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');
  git('add', '-A');

  if (!git('diff', '--cached', '--name-only').trim()) {
    console.log('Nothing to commit');
    setOutput('pushed', false);
    return;
  }

  const runNumber = process.env.GITHUB_RUN_NUMBER;
  git('commit', '-m', runNumber ? `${message} (${runNumber})` : message);
  git('push');
  setOutput('pushed', true);
}

try {
  run();
} catch (e) {
  console.error(e.message || e);
  process.exitCode = 1;
}
