import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../src');

const listModules = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listModules(fullPath);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') ? [path.relative(SRC, fullPath)] : [];
  });

// Many core modules import from the package entry ('..' / '../../index'), so most of core sits in one import cycle.
// That is only safe while no module in the cycle reads another one's exports at load time; otherwise the result
// depends on which module an app happens to load first (e.g. bundlers that inline requires, or deep imports such
// as '@coolwallet/core/lib/coin/config/types'). Loading every module first, in a fresh registry, catches that.
describe('module load order', () => {
  it.each(listModules(SRC))('loads %s first without breaking the package entry', (modulePath) => {
    jest.isolateModules(() => {
      expect(() => require(path.join(SRC, modulePath))).not.toThrow();

      const core = require(path.join(SRC, 'index'));
      expect(core.coin.SignCurve.SECP256K1).toBe('01');
      expect(typeof core.coin.signData).toBe('function');
      expect(typeof core.coin.ECDSACoin).toBe('function');
    });
  });
});
