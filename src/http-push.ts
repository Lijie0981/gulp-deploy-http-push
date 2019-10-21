/*
 * @Author: qiansc
 * @Date: 2019-05-09 13:04:45
 * @Last Modified by: qiansc
 * @Last Modified time: 2019-05-09 19:13:40
 */

import {sync} from 'glob';
import { File } from 'gulp-util';
import {Transform} from './cacheTransform';
import { include } from './filter';
import { Restrictor } from './restrictor';

export function httpPush(options: IDeployOption[]) {
  const restrictor = new Restrictor();
  const fileOptions: fileOption = {};
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
        const option = fileOptions[file.path];
        restrictor.add({
          host: option.host,
          retry: 2,
          to: option.to,

        }, {
          contents: file.contents,
          relative: '/' + file.relative,
        });
      }
      callback();
    },
  });
}

interface IDeployOption {
  /** 要部署的机器HOST */
  host: string;
  /** 符合条件的文件的glob */
  match?: string;
  /** 要部署的basePath */
  to: string;
}
interface fileOption {
  [propName: string]: IDeployOption
}
