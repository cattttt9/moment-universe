import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { ZipArchive } from 'archiver';

const projectRoot = resolve(import.meta.dirname, '..');
const distDirectory = resolve(projectRoot, 'dist');
const artifactsDirectory = resolve(projectRoot, 'artifacts');
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'));
const archivePath = resolve(
  artifactsDirectory,
  `moment-universe-v${packageJson.version ?? '0.1.0'}.zip`,
);

if (!existsSync(distDirectory)) {
  throw new Error('找不到 dist/。请先运行 npm run build。');
}

mkdirSync(artifactsDirectory, { recursive: true });
const output = createWriteStream(archivePath);
const archive = new ZipArchive({ zlib: { level: 9 } });

const completed = new Promise((resolveCompleted, reject) => {
  output.on('close', resolveCompleted);
  output.on('error', reject);
  archive.on('error', reject);
});

archive.pipe(output);
archive.directory(distDirectory, false);
await archive.finalize();
await completed;

process.stdout.write(
  `Created ${archivePath} (${(archive.pointer() / 1024 / 1024).toFixed(2)} MiB)\n`,
);
