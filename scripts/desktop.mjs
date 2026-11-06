import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, cpSync, mkdtempSync, symlinkSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
const root = resolve(import.meta.dirname, '..');
const localCargo = join(root, '.desktop-tools/cargo');
const env = { ...process.env };
if (existsSync(join(localCargo, 'bin/cargo'))) {
  env.CARGO_HOME = localCargo;
  env.RUSTUP_HOME = join(root, '.desktop-tools/rustup');
  env.PATH = `${localCargo}/bin:${env.PATH}`;
}
const args = process.argv.slice(2);
const result = spawnSync(join(root, 'node_modules/.bin/tauri'), args, { cwd: root, env, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
if (result.status !== 0) process.exit(result.status ?? 1);
if (args[0] === 'build') {
  const bundle = join(root, 'src-tauri/target/release/bundle');
  const output = join(root, 'release/macos');
  mkdirSync(output, { recursive: true });
  const app = join(bundle, 'macos/速度工具箱.app');
  if (existsSync(app)) cpSync(app, join(output, '速度工具箱.app'), { recursive: true });
  // A plain read-only DMG avoids Finder/AppleScript automation permissions.
  // The Applications link still supports drag-to-install.
  const staging = mkdtempSync(join(tmpdir(), 'sudubox-dmg-'));
  try {
    cpSync(app, join(staging, '速度工具箱.app'), { recursive: true });
    symlinkSync('/Applications', join(staging, 'Applications'));
    const image = spawnSync('/usr/bin/hdiutil', ['create', '-volname', '速度工具箱', '-srcfolder', staging, '-ov', '-format', 'UDZO', join(output, '速度工具箱.dmg')], { stdio: 'inherit' });
    if (image.status !== 0) process.exitCode = image.status ?? 1;
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
  console.log(`桌面构建产物：${output}`);
}
