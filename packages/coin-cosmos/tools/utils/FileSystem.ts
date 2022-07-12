import { readFileSync, readdir as readdirCB, writeFile as writeFileCB, PathLike } from 'node:fs';
import { promisify } from 'node:util';

const readdir = promisify(readdirCB);
const writeFile = promisify(writeFileCB);

enum FileType {
  FILE,
  DIRECTORY,
}

async function fetchFilesWithType(dir: PathLike, type: FileType): Promise<string[]> {
  return (await readdir(dir, { withFileTypes: true }))
    .filter((d) => (type === FileType.DIRECTORY ? d.isDirectory() : !d.isDirectory()))
    .map((d) => d.name);
}

export { readFileSync, readdir, writeFile, fetchFilesWithType, FileType };
