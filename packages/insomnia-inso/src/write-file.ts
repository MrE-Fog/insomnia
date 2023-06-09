import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';

import { InsoError } from './errors';

export async function writeFileWithCliOptions(
  output: string,
  contents: string,
  workingDir?: string,
): Promise<string> {
  const outputPath = path.isAbsolute(output) ? output : path.join(workingDir || process.cwd(), output);

  try {
    await mkdirp.sync(path.dirname(outputPath));
    await fs.promises.writeFile(outputPath, contents);
    return outputPath;
  } catch (error) {
    throw new InsoError(`Failed to write to "${outputPath}"`, error);
  }
}
