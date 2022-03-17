import { spawn } from 'child_process';

function exec(command: string, args: string[], cwd?: string) {
  return new Promise<void>((resolve, reject) => {
    const task = spawn(command, args, { stdio: 'inherit', cwd });
    task.on('exit', (code) => (code === 0 ? resolve() : reject()));
  });
}

export { exec };
