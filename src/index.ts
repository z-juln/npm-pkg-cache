import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import spawn from 'cross-spawn';
import semver from 'semver';
import { getLatestVersion } from '@juln/npm-pkg-version';

const exec = (...args: Parameters<typeof spawn>) => {
  return new Promise((resolve, reject) => {
    spawn(...args)
      .on('close', resolve)
      .on('error', reject);
  });
};

const defaultCacheDir = path.resolve(os.homedir(), '.npm-pkg-cache');

class NPMPkgCache<PkgName extends string> {
  constructor(public cacheDir = defaultCacheDir, public opts?: {
    registryUrl?: string;
    npmTag?: string;
  }) {
    this.opts = Object.assign({
      registryUrl: 'https://registry.npmjs.org/',
      npmTag: 'latest',
    }, opts);
    fs.ensureDirSync(cacheDir);
  }

  async clear() {
    await fs.rm(this.cacheDir, { recursive: true });
  }

  async cache(pkgName: PkgName, opts?: {
    registryUrl?: string;
    npmTag?: string;
  }) {
    const { registryUrl, npmTag } = Object.assign({
      registryUrl: 'https://registry.npmjs.org/',
      npmTag: 'latest',
    }, this.opts, opts);

    if (!await this.checkUpdate(pkgName, { registryUrl, npmTag })) return;

    if (!fs.existsSync(path.resolve(this.cacheDir, 'package.json'))) {
      await exec('npm', ['init', '-y'], { stdio: 'inherit', cwd: this.cacheDir });
    }
    await exec('npm', ['i', `${pkgName}@${npmTag}`, `--registry=${registryUrl}`], { stdio: 'inherit', cwd: this.cacheDir });
  }

  getPkgPath(pkgName: PkgName) {
    const pkgPath = path.resolve(this.cacheDir, 'node_modules', pkgName);
    if (!fs.existsSync(pkgPath)) return null;
    return pkgPath;
  }

  getPackageJSON(pkgName: PkgName) {
    const pkgPath = this.getPkgPath(pkgName);
    if (pkgPath === null) return null;
    const packageJSONPath = path.resolve(pkgPath, 'package.json');
    const packageJSON = fs.readJSONSync(packageJSONPath);
    return packageJSON as Record<string, any>;
  }

  checkUpdate = async (pkgName: PkgName, opts?: {
    registryUrl?: string;
    npmTag?: string;
  }) => {
    const { registryUrl, npmTag } = Object.assign({
      registryUrl: 'https://registry.npmjs.org/',
      npmTag: 'latest',
    }, this.opts, opts);

    const packageJSON = this.getPackageJSON(pkgName);
    if (packageJSON === null) return true;
    const { version: currentVersion } = packageJSON;
    const latestVersion = await getLatestVersion(pkgName, { registryUrl, npmTag });
    return !!latestVersion && semver.lt(currentVersion, latestVersion);
  };
}

export default NPMPkgCache;

// (async function test() {
//   const pkgs = ['fs-extra', 'cross-spawn'] as const;
//   const cacher = new NPMPkgCache<typeof pkgs[number]>(path.resolve(__dirname, '../test-dist'));
//   await cacher.cache('fs-extra');
//   const pkgPath = cacher.getPkgPath('fs-extra');
//   const packageJSON = cacher.getPackageJSON('fs-extra');
//   const canUpdate = await cacher.checkUpdate('fs-extra');
//   console.log({
//     pkgPath,
//     canUpdate,
//     packageJSON: packageJSON ? {
//       name: packageJSON.name,
//       version: packageJSON.version,
//     } : null,
//   });
//   await cacher.clear();
// })();
