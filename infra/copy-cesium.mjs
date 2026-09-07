import {cp,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const root=path.dirname(require.resolve('cesium/package.json'));
const target=new URL('../apps/web/public/cesium/',import.meta.url);await mkdir(target,{recursive:true});
for(const name of ['Assets','Workers','ThirdParty','Widgets'])await cp(path.join(root,'Build','Cesium',name),new URL(name,target),{recursive:true});
console.log('Cesium runtime assets copied');
