#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const appDir = resolve(repoRoot, 'example-app');
const distDir = resolve(appDir, 'dist');
const rootPackageJsonPath = resolve(repoRoot, 'package.json');
const examplePackageJsonPath = resolve(appDir, 'package.json');
const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf8'));
const examplePackageJson = JSON.parse(readFileSync(examplePackageJsonPath, 'utf8'));

const toTitleCase = (value) =>
  value
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');

const packageBaseName = rootPackageJson.name.split('/').pop() ?? examplePackageJson.name;
const exampleName = `${toTitleCase(packageBaseName.replace(/^capacitor-/, ''))} example`;

const appId = process.env.CAPGO_APP_ID;
const channel = process.env.CAPGO_CHANNEL || process.argv[2] || 'production';
const bundle = process.env.CAPGO_BUNDLE || rootPackageJson.version || examplePackageJson.version;
const comment =
  process.env.CAPGO_COMMENT ||
  (process.env.GITHUB_RUN_NUMBER
    ? `${exampleName} run ${process.env.GITHUB_RUN_NUMBER}`
    : `${exampleName} ${bundle}`);

if (!existsSync(distDir)) {
  console.error('Missing example-app/dist. Run bun run --cwd example-app build first.');
  process.exit(1);
}

const args = [
  '@capgo/cli@latest',
  'bundle',
  'upload',
  ...(appId ? [appId] : []),
  '--bundle',
  bundle,
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

console.log(`Deploying ${appId ?? exampleName} to Capgo channel "${channel}"`);

const result = spawnSync('bunx', args, {
  cwd: appDir,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
