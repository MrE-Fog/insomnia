import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';

import { getDataDirectory } from '../common/electron-helpers';

export async function createPlugin(
  moduleName: string,
  version: string,
  mainJs: string,
) {
  const pluginDir = path.join(getDataDirectory(), 'plugins', moduleName);

  if (fs.existsSync(pluginDir)) {
    throw new Error(`Plugin already exists at "${pluginDir}"`);
  }

  mkdirp.sync(pluginDir);
  // Write package.json
  fs.writeFileSync(
    path.join(pluginDir, 'package.json'),
    JSON.stringify(
      {
        name: moduleName,
        version,
        private: true,
        insomnia: {
          name: moduleName.replace(/^insomnia-plugin-/, ''),
          description: '',
        },
        main: 'main.js',
      },
      null,
      2,
    ),
  );
  // Write main JS file
  fs.writeFileSync(path.join(pluginDir, 'main.js'), mainJs);
}
