'use strict';

const MyError = require('./myError');
const BaseService = require('./baseService');

class DataDictionaryInfoService extends BaseService {
  get document() {
    return this.ctx.model.DataDictionary;
  }

  async page(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };
    const sort = { ...params.sort };
    if (!Object.keys(sort).length) {
      params.sort = { createdDate: -1 };
    }
    return this.queryPage(params);
  }

  async add(defaultParams) {
    const params = { datas: [], ...defaultParams, ...this.ctx.request.body };

    if (!params.title) {
      return Promise.reject(new MyError('标题为必传', 400));
    }

    if (/^\s*$/.test(params.title)) {
      return Promise.reject(new MyError('标题不能全是空格', 400));
    }

    if (!params.key) {
      return Promise.reject(new MyError('key为必传', 400));
    }

    if (/^\s*$/.test(params.key)) {
      return Promise.reject(new MyError('key不能全是空格', 400));
    }

    const dataDictionaryInfo = await this.document.create(params);

    return {
      id: dataDictionaryInfo.id,
      msg: '新增成功',
    };
  }

  async delete(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };

    if (!params.id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    await this.deleteSomeone(params);
  }

  async update(defaultParams) {
    const params = {
      ...defaultParams,
      ...this.ctx.request.body,
      updateDate: new Date(),
    };

    if (!params.id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    if (!params.title) {
      return Promise.reject(new MyError('标题为必传', 400));
    }

    if (/^\s*$/.test(params.title)) {
      return Promise.reject(new MyError('标题不能全是空格', 400));
    }

    if (!params.key) {
      return Promise.reject(new MyError('key为必传', 400));
    }

    if (/^\s*$/.test(params.key)) {
      return Promise.reject(new MyError('key不能全是空格', 400));
    }

    await this.document.updateOne({ id: params.id }, { $set: params });

    return '修改成功';
  }

  async info(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.query };

    if (!params.key) {
      return Promise.reject(new MyError('请传入key', 400));
    }

    const dataDictionaryInfo = await this.document.someoneInfoByParams(params);

    if (!dataDictionaryInfo) {
      return {
        success: false,
        data: null,
        showType: 0,
      };
    }

    return dataDictionaryInfo;
  }
}

module.exports = DataDictionaryInfoService;
