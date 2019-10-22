/*
 * @Author: qiansc
 * @Date: 2019-05-09 13:04:45
 * @Last Modified by: qiansc
 * @Last Modified time: 2019-05-09 19:13:40
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import {sync} from 'glob';
import { File } from 'gulp-util';
import { dirname, resolve } from 'path';
import stream = require('readable-stream');
import { include } from './filter';
import { Restrictor } from './restrictor';
const Transform = stream.Transform;
export function httpPush(options: IDeployOption[]) {
  const restrictor = new Restrictor();
  const fileOptions: FileOption = {};
  const cachePath = resolve(process.cwd(), options[0].cachePath ? options[0].cachePath : '.http-push-cache/');
  // removeCache(cachePath);
  options.forEach((item) => {
    if (item.match) {
      sync(item.match, {realpath: true}).forEach((file) => {
        fileOptions[file] = {
          host: item.host,
          to: item.to};
      });
    }
  });
  return new Transform({
    objectMode: true,
    transform: (file: File, enc, callback) => {
      if (!file.isDirectory()) {
        if (file && !fs.existsSync(cachePath + getMd5(file.path + file.stat.mtimeMs))) {
            const option = fileOptions[file.path];
            restrictor.add({
              host: option.host,
              retry: 2,
              to: option.to}, {
              contents: file.contents,
              relative: '/' + file.relative,
            });
            fs.writeFileSync(cachePath + getMd5(file.path + file.stat.mtimeMs), 'info');
          }
        }
      callback();
    },
  });
}
function getMd5(str: string) {
    const md5sum = crypto.createHash('md5');
    md5sum.update(str, 'utf8');
    return md5sum.digest('hex').substring(0, 32);
}
// function removeCache(cachePath) {
//   const toDay = +new Date();
//   sync(cachePath + '*').forEach((item) => {
//     console.log(item);
//     fs.stat(item, (err, stats) => {
//         if (stats.ctimeMs < toDay) {
//           fs.unlinkSync(item);
//         }
//     });
//   });
// }

interface IDeployOption {
  /** 要部署的机器HOST */
  host: string;
  /** 符合条件的文件的glob */
  match?: string;
  /** 要部署的basePath */
  to: string;
  /** 缓存存放地址 */
  cachePath?: string;
}
interface FileOption {
  [propName: string]: IDeployOption;
}
