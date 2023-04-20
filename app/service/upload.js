'use strict';

const fs = require('fs');
const MyError = require('./myError');
const BaseService = require('./baseService');
const cosConfig = require('../../config/cos.config');

const COS = require('cos-nodejs-sdk-v5');
// 创建实例
const cos = new COS(cosConfig);

class UploadService extends BaseService {
  get document() {
    return this.ctx.model.User;
  }

  /**
   * @description 上传多个文件，返回请求参数及文件 url
   * @param {String | Array} filePrefixs 文件存储前缀，单个字符时，所有文件都存在这个路径下，例如：avatar/avatar_，avatar目录下的文件，
   * 数组时，请务必一一对应，分别存在对应的目录下
   * @return { requestBody: any, fileUrl: strng }
   */
  async uploadMultipleFile(filePrefixs) {
    const { ctx } = this;

    const files = ctx.request.files;

    if (!files.length) return '';

    let filePrefixArr = [];
    filePrefixs = JSON.parse(filePrefixs);

    if (Array.isArray(filePrefixs)) {
      filePrefixArr = filePrefixs;
    } else {
      filePrefixArr = Array.from({ length: files.length }, () => filePrefixs);
    }

    const uploadArr = [];

    files.forEach((item, index) => {
      const filename = (filePrefixArr[index] || 'other/') + (Date.now() + index) + '_' + item.filename.toLowerCase();
      uploadArr.push({
        Bucket: 'rakugo-1258339807',
        Region: 'ap-guangzhou',
        Key: filename,
        FilePath: item.filepath, // 上传文件的本地地址
      });
    });

    // 上传
    const res = await cos.uploadFiles({
      files: uploadArr,

      // 设置大于10MB采用分块上传
      SliceSize: 1024 * 1024 * 10,
    });

    const arr = res.files.map(item => 'https://' + item.data.Location);

    return arr;
  }

  /**
   * @description 上传单个文件，返回请求参数及文件 url
   * @param {String} filePrefix 文件存储前缀，例如：avatar/avatar_，avatar目录下的文件
   * @return { requestBody: any, fileUrl: strng }
   */
  async uploadFile(filePrefix) {
    const { ctx } = this;

    const file = ctx.request.files[0];

    if (!file) return '';

    // 文件类型
    // const fileType = file.mime.split('/')[1];

    const filename = filePrefix + Date.now() + '_' + file.filename.toLowerCase();

    // 上传
    const res = await cos.putObject({
      Bucket: 'rakugo-1258339807',
      Region: 'ap-guangzhou',
      Key: filename,
      Body: fs.createReadStream(file.filepath), // 上传文件对象
    });

    const fileUrl = 'https://' + res.Location;

    return fileUrl;
  }

  /**
   * @description 更新文件，其实就是上传，然后删除之前的，返回请求参数及文件 url
   * @param {String} filePrefix 文件存储前缀，例如：avatar/，avatar目录下的文件
   * @param {String} delFile  删除的文件地址，例如：https://rakugo-1258339807.cos.ap-guangzhou.myqcloud.com/avatar/default_avatar.png
   * @return { requestBody: any, fileUrl: strng }
   */
  async updateFile(filePrefix, delFile) {
    if (!delFile) {
      return Promise.reject(new MyError('删除文件地址为必传', 400));
    }

    const fileUrl = await this.uploadFile(filePrefix);

    // 异步删除，不占用时间
    this.deleteFile(delFile);

    return fileUrl;
  }

  /**
   * @description 删除文件
   * @param {String[]} delFile  删除的文件地址，例如：https://rakugo-1258339807.cos.ap-guangzhou.myqcloud.com/avatar/default_avatar.png
   */
  async deleteFile(delFile) {
    if (delFile.length <= 0) {
      return Promise.reject(new MyError('删除文件地址为必传', 400));
    }

    if (!(delFile instanceof Array)) {
      return Promise.reject(new MyError('删除文件地址必需为数组', 400));
    }

    // deleteObject 接口是只接收 /avatar/default_avatar.png
    // deleteMultipleObject 接口是只接收 avatar/default_avatar.png
    // { Key: 'avatar/default_avatar.png' }
    const arr = delFile.map(item => ({
      Key: new URL(item).pathname.substring(1),
    }));

    await cos.deleteMultipleObject({
      Bucket: 'rakugo-1258339807',
      Region: 'ap-guangzhou',
      Quiet: true,
      Objects: arr,
    });
  }
}

module.exports = UploadService;
