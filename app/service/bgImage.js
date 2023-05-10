'use strict';

const MyError = require('./myError');
const BaseService = require('./baseService');

class BgImageService extends BaseService {
  get document() {
    return this.ctx.model.BgImage;
  }

  async queryBgImagePage(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };
    const sort = { ...params.sort };
    if (!Object.keys(sort).length) {
      params.sort = { position: 1, order: 1 };
    }

    return this.queryPage(params);
  }

  async addBgImage(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };

    if (!params.position) {
      return Promise.reject(new MyError('请传入图片所处位置', 400));
    }

    params.imgUrl = await this.uploadFile('bgImage/');

    await this.document.create(params);

    return '新增成功';
  }

  async deleteBgImage(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };

    if (!params.id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    // 顺带把存储桶的图也删了
    const bgImageInfo = await this.someoneInfo({ id: params.id });
    bgImageInfo.imgUrl && this.deleteSomeFile(bgImageInfo.imgUrl);

    await this.deleteSomeone(params);

    return '删除成功';
  }

  async updateBgImage(defaultParams) {
    const params = {
      ...defaultParams,
      ...this.ctx.request.body,
      updateDate: new Date(),
    };

    if (!params.id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    if (!params.position) {
      return Promise.reject(new MyError('请传入图片所处位置', 400));
    }

    const bgImageInfo = await this.someoneInfo({ id: params.id });

    // string 说明没传或者是已有的链接地址，undefined 说明是新 file
    if (typeof params.imgUrl === 'undefined') {
      // 存在就说明是字符串，不是 file
      params.imgUrl = await this.uploadFile('bgImage/', bgImageInfo.imgUrl);
    }

    await this.document.updateOne({ id: params.id }, { $set: params });

    return '修改成功';
  }

  async bgImageInfo(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.query };
    if (!params.id || !params.order) {
      // 没传这两个，就算便返回一张图
      const bgImageArr = await this.document.aggregate([
        { $match: { status: 'NOT_EXPIRED', ...params } },
        { $project: { _id: 0 } },
        { $sample: { size: 1 } },
      ]);

      return bgImageArr[0];
    }

    return await this.someoneInfoByParams(params);
  }
}

module.exports = BgImageService;
