/**
 * 根据模板 npm 包名初始化项目
 */
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const uuid = require('uuid/v1');
const rimraf = require('rimraf');
const inquirer = require('inquirer');

const log = require('../utils/log');
const download = require('./download');

module.exports = ({ scaffold, projectDir }) => {
  return checkEmpty(projectDir).then((canGoOn) => {
    if (!canGoOn) {
      log.error('用户取消退出！');
      process.exit(1);
    } else {
      return download({
        npmName: scaffold,
        projectDir
      });
    }
  }).then(() => {
    try {
      // 删除 build/
      rimraf.sync(path.join(projectDir, 'build'));

      // 修正 package.json
      modifyPkg(path.join(projectDir, 'package.json'));
    } catch(err) {
      log.warn('修正项目文件失败', err);
    }
  });

}

function modifyPkg(pkgPath) {
  log.verbose('modifyPkg', pkgPath)

  const pkgData = fse.readJsonSync(pkgPath);

  delete pkgData.files;
  delete pkgData.publishConfig;
  delete pkgData.buildConfig.output;
  delete pkgData.scaffoldConfig;
  delete pkgData.homepage;
  delete pkgData.scripts.screenshot;
  delete pkgData.scripts.prepublishOnly;

  pkgData.name += uuid();

  fse.writeJSONSync(pkgPath, pkgData, {
    spaces: 2
  });
  return;
}


function checkEmpty(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, function(err, files) {
      if (files && files.length) {
        // 有文件
        return inquirer.prompt({
          type: 'confirm',
          name: 'goOn',
          message: '当前文件夹下存在其他文件，继续生成可能会覆盖，确认继续吗？',
          default: false
        }).then((answer) => {
          return resolve(answer.goOn);
        }).catch((err) => {
          return resolve(false);
        });
      } else {
        return resolve(true)
      }
    });
  });
}
