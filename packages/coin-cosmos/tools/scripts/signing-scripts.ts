/**
 * Summary.
 *
 * Signing scripts will retrieve scripts from scripts-signed.md and input them into src/chain.
 */
import * as ts from 'typescript';
import * as prettier from 'prettier';
import path from 'node:path';
import isNil from 'lodash/isNil';
import { fetchFilesWithType, FileType, readFileSync, writeFile } from '../utils/FileSystem';
import { Signer, applySignatures } from './plugins/apply-signatures';

const CHAIN_DIR = './src/chain';

const IDENTIFIER_FILE = 'scripts.ts';

const SIGNED_FILE = './scripts-signed.md';

(async () => {
  const chains = await fetchFilesWithType(CHAIN_DIR, FileType.DIRECTORY);
  const signatures = readFileSync(SIGNED_FILE).toString().split('\n');
  const signer = new Signer(signatures);
  chains.sort(function (a, b) {
    return a.localeCompare(b);
  });
  for (let i = 0; i < chains.length; i++) {
    const chain = chains[i];
    const chainDirPath = path.join(CHAIN_DIR, chain);
    const files = await fetchFilesWithType(chainDirPath, FileType.FILE);
    const script_file = files.find((f) => f === IDENTIFIER_FILE);
    if (isNil(script_file)) {
      throw new Error(`Cannot find ${IDENTIFIER_FILE} in ${chainDirPath}`);
    }
    const filePath = path.join(CHAIN_DIR, chain, IDENTIFIER_FILE);
    const sourceFiles = ts.createSourceFile(
      IDENTIFIER_FILE,
      readFileSync(filePath).toString(),
      ts.ScriptTarget.ESNext,
      /*setParentNodes=*/ true
    );
    const transformationResult = ts.transform(sourceFiles, [applySignatures(signer)]);
    const transformedSourceFile = transformationResult.transformed[0];
    const printer = ts.createPrinter();
    const code = printer.printNode(ts.EmitHint.Unspecified, transformedSourceFile, sourceFiles);
    const formatted = prettier.format(code, { parser: 'babel-ts' });
    await writeFile(filePath, formatted);
  }
  console.log('Apply signatures to scripts file success.');
})();
