import { spawn } from 'node:child_process';

const run = (cmd, args = []) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });

const main = async () => {
  await run('npx', ['playwright', 'test']);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
