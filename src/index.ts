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

class NPMPkgCache {
  constructor(public cacheDir = defaultCacheDir) {
    fs.ensureDirSync(cacheDir);
  }

  async clear() {
    await fs.rm(this.cacheDir, { recursive: true });
  }

  async cache(pkgName: string, opts?: {
    registryUrl?: string;
    npmTag?: string;
  }) {
    const { registryUrl, npmTag } = Object.assign({
      registryUrl: 'https://registry.npmjs.org/',
      npmTag: 'latest',
    }, opts);

    if (!await this.checkUpdate(pkgName, { registryUrl, npmTag })) return;

    if (!fs.existsSync(path.resolve(this.cacheDir, 'package.json'))) {
      await exec('npm', ['init', '-y'], { stdio: 'inherit', cwd: this.cacheDir });
    }
    await exec('npm', ['i', `${pkgName}@${npmTag}`, `--registry=${registryUrl}`], { stdio: 'inherit', cwd: this.cacheDir });
  }

  getPkgPath(pkgName: string) {
    const pkgPath = path.resolve(this.cacheDir, 'node_modules', pkgName);
    if (!fs.existsSync(pkgPath)) return null;
    return pkgPath;
  }

  getPackageJSON(pkgName: string) {
    const pkgPath = this.getPkgPath(pkgName);
    if (pkgPath === null) return null;
    const packageJSONPath = path.resolve(pkgPath, 'package.json');
    const packageJSON = fs.readJSONSync(packageJSONPath);
    return packageJSON as Record<string, any>;
  }

  checkUpdate = async (pkgName: string, opts?: {
    registryUrl?: string;
    npmTag?: string;
  }) => {
    const packageJSON = this.getPackageJSON(pkgName);
    if (packageJSON === null) return true;
    const { version: currentVersion } = packageJSON;
    const latestVersion = await getLatestVersion(pkgName, opts);
    return !!latestVersion && semver.lt(currentVersion, latestVersion);
  };
}

export default NPMPkgCache;

// (async function test() {
//   const cacher = new NPMPkgCache(path.resolve(__dirname, '../test-dist'));
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
