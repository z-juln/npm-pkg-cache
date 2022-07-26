# npm-pkg-cache

npm包缓存管理

## install

`npm i npm-pkg-cache`

## use

```typescript
import NPMPkgCache from 'npm-pkg-cache';

const cacher = new NPMPkgCache('you cache dir', {
  registryUrl: 'https://registry.npmjs.org/', // 默认为'https://registry.npmjs.org/'
  npmTag: 'latest', // 默认为'latest'
}); // 默认的cacheDir为'～/.npm-pkg-cache'
// 缓存npm包
await cacher.cache('you pkg name', {
  registryUrl: 'https://registry.npmjs.org/', // 默认为NPMPkgCache构造函数的入参
  npmTag: 'latest', // 默认为NPMPkgCache构造函数的入参
});
// 获取缓存区中包的对应路径
const pkgPath = cacher.getPkgPath('you pkg name', {
  slience: false, // 默认为false, 缓存区不存在该包时函数返回null, 为true时直接返回不存在的路径
});
// 获取缓存区中包的package.json的内容
cacher.getPackageJSON('you pkg name');
// 检测缓存区中包的是否有更高版本, 缓存区不存在该包时函数返回true
const canUpdate = await cacher.checkUpdate('you pkg name', {
  registryUrl: 'https://registry.npmjs.org/', // 默认为NPMPkgCache构造函数的入参
  npmTag: 'latest', // 默认为NPMPkgCache构造函数的入参
});
// 清除缓存区
await cacher.clear();
```
