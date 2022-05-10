import path from 'node:path';
import { execSync } from 'node:child_process';
import simpleGit from 'simple-git';
import { TERRA_JS_PATH, TERRA_JS_VERSION, CACHE_DIR } from '../resources';

async function fetchTerraJsRepository(): Promise<string> {
  let git = simpleGit();
  await git.clone(TERRA_JS_PATH, CACHE_DIR);
  git = simpleGit(CACHE_DIR);
  await git.checkout(TERRA_JS_VERSION);
  execSync('npm i', { cwd: path.join(process.cwd(), CACHE_DIR) });
  return CACHE_DIR;
}

export { fetchTerraJsRepository };
