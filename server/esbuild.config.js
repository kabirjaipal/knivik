import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const entryPoints = fs.readdirSync('src', { recursive: true })
  .filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts'))
  .map(file => path.join('src', file));

esbuild.build({
  entryPoints,
  bundle: false,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: 'dist',
  outbase: 'src',
  sourcemap: true,
  logLevel: 'info',
}).catch(() => process.exit(1));
