/**
 * Summary.
 *
 * Gen script will get all scripts in src/chain, gathering them into a single scripts.md file.
 */
import * as ts from 'typescript';
import path from 'node:path';
import isNil from 'lodash/isNil';
import { fetchFilesWithType, FileType, readFileSync, writeFile } from '../utils/FileSystem';
import GetScripts from './plugins/get-scripts';

const CHAIN_DIR = './src/chain';

const IDENTIFIER_FILE = 'scripts.ts';

const TMP_FILE = './scripts.md';

(async () => {
  const chains = await fetchFilesWithType(CHAIN_DIR, FileType.DIRECTORY);
  chains.sort(function (a, b) {
    return a.localeCompare(b);
  });
  const scripts: string[] = [];
  for (let i = 0; i < chains.length; i++) {
    const chain = chains[i];
    const chainDirPath = path.join(CHAIN_DIR, chain);
    const files = await fetchFilesWithType(chainDirPath, FileType.FILE);
    const script_file = files.find((f) => f === IDENTIFIER_FILE);
    if (isNil(script_file)) {
      throw new Error(`Cannot find ${IDENTIFIER_FILE} in ${chainDirPath}`);
    }
    const sourceFiles = ts.createSourceFile(
      IDENTIFIER_FILE,
      readFileSync(path.join(CHAIN_DIR, chain, IDENTIFIER_FILE)).toString(),
      ts.ScriptTarget.ESNext,
      /*setParentNodes=*/ true
    );
    scripts.push(...GetScripts(sourceFiles));
  }
  await writeFile(TMP_FILE, scripts.join('\n'));
  console.log('Gen signing scripts file success.');
})();
