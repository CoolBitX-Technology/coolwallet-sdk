import fs from 'node:fs';
import * as babel from '@babel/core';
import esbuild from 'esbuild';
import cleanup from './ast/cleanup';
import transform from './ast/transform';
import { fetchTerraJsRepository } from './utils/git';
import { CACHE_DIR } from './resources';

(async () => {
  fs.rmSync(CACHE_DIR, { recursive: true, force: true });
  const dir = await fetchTerraJsRepository();
  const outfile = './src/terra/@terra-core.js';
  await esbuild.build({
    entryPoints: [`${dir}/src/core/SignDoc.ts`],
    bundle: true,
    target: 'esnext',
    tsconfig: './tsconfig.json',
    outfile,
    format: 'cjs',
  });

  const presets = [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 17,
        },
      },
    ],
  ];
  const cleanupResult = babel.transformFileSync(outfile, {
    plugins: [cleanup()],
    presets,
  });
  const result = babel.transformSync(cleanupResult.code, {
    plugins: [transform()],
    presets,
  });
  fs.writeFileSync(outfile, result.code);
  fs.rmSync(dir, { recursive: true, force: true });
})();
