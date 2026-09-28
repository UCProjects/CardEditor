import { GlobalRegistrator } from '@happy-dom/global-registrator';
import fs from 'node:fs';
import path from 'node:path';

GlobalRegistrator.register({
  settings: {
    handleDisabledFileLoadingAsSuccess: true,
  },
});

const file = path.resolve(__dirname, '../public/index.html');
const content = fs.readFileSync(file, 'utf8');
document.body.innerHTML = content;
