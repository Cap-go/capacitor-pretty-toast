#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const appDir = resolve(repoRoot, 'example-app');
const distDir = resolve(appDir, 'dist');
const packageJsonPath = resolve(appDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

const appId = process.env.CAPGO_APP_ID;
const channel = process.env.CAPGO_CHANNEL || process.argv[2] || 'production';
const comment =
  process.env.CAPGO_COMMENT ||
  (process.env.GITHUB_RUN_NUMBER
    ? `Pretty Toast example run ${process.env.GITHUB_RUN_NUMBER}`
    : `Pretty Toast example ${packageJson.version}`);

if (!existsSync(distDir)) {
  console.error('Missing example-app/dist. Run bun run --cwd example-app build first.');
  process.exit(1);
}

const args = [
  '@capgo/cli@latest',
  'bundle',
  'upload',
  ...(appId ? [appId] : []),
  '--path',
  'dist',
  '--channel',
  channel,
  '--package-json',
  'package.json,../package.json',
  '--node-modules',
  '../node_modules,node_modules',
  '--delta',
  '--no-key',
  '--ignore-checksum-check',
  '--version-exists-ok',
  '--comment',
  comment,
];

console.log(`Deploying ${appId ?? 'Pretty Toast example'} to Capgo channel "${channel}"`);

const result = spawnSync('bunx', args, {
  cwd: appDir,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
