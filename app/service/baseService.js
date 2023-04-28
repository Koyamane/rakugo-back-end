'use strict';

const Service = require('egg').Service;
const fs = require('mz/fs');
const MyError = require('./myError');
const cosConfig = require('../../config/cos.config');

const COS = require('cos-nodejs-sdk-v5');
// 创建实例
const cos = new COS(cosConfig);

class BaseService extends Service {
  /**
   * @description 子类要重写为当前的model，否则直接报错
   * @example
   * ``` js
   * get document () {
   *  return this.ctx.model.Blog;
   * }
   * ```
   */
  get document() {
    Promise.reject(new MyError('BaseService 需要重写 document 属性！', 500));
  }

  /**
   * @description 分页返回数据
   * @param {{
   *  dto?: {[key: String]: String}
   *  searchMap?: {[key: String]: { opt: 'LIKE' | 'IN' | 'NOT_IN', value: String }}
   *  betweenMap?: {[key: String]: String[]}
   *  orMap?: {[key: String]: String}
   *  norMap?: {[key: String]: String}
   *  current?: Number
   *  pageSize?: Number
   *  sort?: {[key: String]: 1 | -1}
   *  filter?: {[key: String]: 1 | 0}
   * }} defaultParams 非前端的，接口默认参数，
   * dto: 精确查找
   * searchMap: 精确查找，LIKE 模糊查询，IN 查询多个，NOT_IN 排除多个，多个用逗号分隔
   * betweenMap: 查询日期 YYYY-MM-DD HH:mm:ss
   * orMap: 多字段或
   * norMap: 多字段非或
   * current: 第几页
   * current: 第几页
   * pageSize: 一页多少条
   * sort: 排序 1升序 -1降序
   * filter: 过滤，为空返回全部字段，1显示，0不显示
   * @param {list => list} cb 回调函数
   */
  async queryPage(defaultParams = {}, cb) {
    const { body = {} } = this.ctx.request;

    const dto = { ...defaultParams.dto, ...body.dto };
    const searchMap = { ...defaultParams.searchMap, ...body.searchMap };
    const betweenMap = { ...defaultParams.betweenMap, ...body.betweenMap };
    const orMap = { ...defaultParams.orMap, ...body.orMap };
    const norMap = { ...defaultParams.norMap, ...body.norMap };
    const current = body.current || defaultParams.current || 1;
    const pageSize = body.pageSize || defaultParams.pageSize || 10;
    const sort = { ...defaultParams.sort, ...body.sort };
    const filter = { ...defaultParams.filter, ...body.filter, _id: 0 };

    for (const key in searchMap) {
      if (Object.hasOwnProperty.call(searchMap, key)) {
        const str = searchMap[key];
        if (str.opt && str.opt.toUpperCase() === 'LIKE') {
          dto[key] = new RegExp(str.value);
        }

        if (str.opt && str.opt.toUpperCase() === 'IN') {
          const strArr = str.value.split(',').map(item => new RegExp(item));
          dto[key] = { $in: strArr };
        }

        if (str.opt && str.opt.toUpperCase() === 'NOT_IN') {
          const strArr = str.value.split(',');
          const regStr = strArr.reduce(
            (pre, next) => (pre ? `${pre}|${next}` : `${next}`),
            ''
          );
          dto[key] = { $not: new RegExp(`(${regStr})`) };
        }
      }
    }

    for (const key in betweenMap) {
      if (Object.hasOwnProperty.call(betweenMap, key)) {
        const dateArr = betweenMap[key];
        if (Array.isArray(dateArr) && dateArr.length > 0) {
          dto[key] = {
            $gte: new Date(dateArr[0] || null),
            $lte: new Date(dateArr[1] || null),
          };
        }
      }
    }

    const orArr = [];
    for (const key in orMap) {
      if (Object.hasOwnProperty.call(orMap, key)) {
        orArr.push({ [key]: new RegExp(orMap[key]) });
      }
    }

    if (orArr.length) {
      dto.$or = orArr;
    }

    const $nor = [];
    for (const key in norMap) {
      if (Object.hasOwnProperty.call(norMap, key)) {
        $nor.push({ key: new RegExp(norMap[key]) });
      }
    }

    if ($nor.length) {
      dto.$nor = $nor;
    }

    // 总数
    const total = await this.document.find(dto, filter).count();

    let list = await this.document.find(dto, filter).sort(sort).skip((current - 1) * pageSize)
      .limit(pageSize);

    if (cb) {
      list = cb(list);
    }

    return {
      list,
      current,
      pageSize,
      total,
    };
  }

  /**
   * @description 多表联查，分页返回数据
   * @param {{
    *  dto?: {[key: String]: String}
    *  searchMap?: {[key: String]: { opt: 'LIKE' | 'IN' | 'NOT_IN', value: String }}
    *  betweenMap?: {[key: String]: String[]}
    *  orMap?: {[key: String]: String}
    *  norMap?: {[key: String]: String}
    *  current?: Number
    *  pageSize?: Number
    *  sort?: {[key: String]: 1 | -1}
    *  filter?: {[key: String]: 1 | 0}
    * }} defaultParams 非前端的，接口默认参数，
    * dto: 精确查找
    * searchMap: 精确查找，LIKE 模糊查询，IN 查询多个，NOT_IN 排除多个，多个用逗号分隔
    * betweenMap: 查询日期 YYYY-MM-DD HH:mm:ss
    * orMap: 多字段或
    * norMap: 多字段非或
    * current: 第几页
    * pageSize: 一页多少条
    * sort: 排序 1升序 -1降序
    * filter: 过滤，为空返回全部字段，1显示，0不显示
    * @param {{
    *   from: String
    *   localField: String
    *   foreignField: 'String
    *   as?: String
    * }} lookup 回调函数
    * from: 需关联的表
    * localField: 当前表的关联字段
    * foreignField: 关联表的关联字段
    * as: 作为新参数加入查询数据，作为新字段返回，不填则不返回
    * @param {list => list} cb 回调函数
    */
  async multitableQueryPage(defaultParams = {}, lookup, cb) {
    if (!lookup) {
      return {
        list: [],
        current: 0,
        pageSize: 0,
        total: 0,
      };
    }

    const { body = {} } = this.ctx.request;

    const dto = { ...defaultParams.dto, ...body.dto };
    const searchMap = { ...defaultParams.searchMap, ...body.searchMap };
    const betweenMap = { ...defaultParams.betweenMap, ...body.betweenMap };
    const orMap = { ...defaultParams.orMap, ...body.orMap };
    const norMap = { ...defaultParams.norMap, ...body.norMap };
    const current = body.current || defaultParams.current || 1;
    const pageSize = body.pageSize || defaultParams.pageSize || 10;
    const sort = { ...defaultParams.sort, ...body.sort };
    const filter = { ...defaultParams.filter, ...body.filter, _id: 0 };

    for (const key in searchMap) {
      if (Object.hasOwnProperty.call(searchMap, key)) {
        const str = searchMap[key];
        if (str.opt && str.opt.toUpperCase() === 'LIKE') {
          dto[key] = new RegExp(str.value);
        }

        if (str.opt && str.opt.toUpperCase() === 'IN') {
          const strArr = str.value.split(',').map(item => new RegExp(item));
          dto[key] = { $in: strArr };
        }

        if (str.opt && str.opt.toUpperCase() === 'NOT_IN') {
          const strArr = str.value.split(',');
          const regStr = strArr.reduce(
            (pre, next) => (pre ? `${pre}|${next}` : `${next}`),
            ''
          );
          dto[key] = { $not: new RegExp(`(${regStr})`) };
        }
      }
    }

    for (const key in betweenMap) {
      if (Object.hasOwnProperty.call(betweenMap, key)) {
        const dateArr = betweenMap[key];
        if (Array.isArray(dateArr) && dateArr.length > 0) {
          dto[key] = {
            $gte: new Date(dateArr[0] || null),
            $lte: new Date(dateArr[1] || null),
          };
        }
      }
    }

    const orArr = [];
    for (const key in orMap) {
      if (Object.hasOwnProperty.call(orMap, key)) {
        orArr.push({ [key]: new RegExp(orMap[key]) });
      }
    }

    if (orArr.length) {
      dto.$or = orArr;
    }

    const $nor = [];
    for (const key in norMap) {
      if (Object.hasOwnProperty.call(norMap, key)) {
        $nor.push({ key: new RegExp(norMap[key]) });
      }
    }

    if ($nor.length) {
      dto.$nor = $nor;
    }

    // 总数
    const total = await this.document.find(dto, filter).count();

    let list = await this.document.aggregate([
      { $lookup: lookup },
      { $match: dto },
      { $project: filter },
      { $sort: sort },
      { $skip: (current - 1) * pageSize },
      { $limit: pageSize },
    ]);

    if (cb) {
      list = cb(list);
    }

    return {
      list,
      current,
      pageSize,
      total,
    };
  }

  async addSomeone(defaultParams) {
    const params = { ...defaultParams };

    if (!Object.keys(params).length) {
      return Promise.reject(new MyError('不能传空对象', 400));
    }

    await this.document.create(params);
    return '新增成功';
  }

  async deleteSomeone(defaultParams) {
    const { id } = { ...defaultParams };

    if (!id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    await this.document.deleteOne({ id });

    return '删除成功';
  }

  async deleteSomeoneByParams(defaultParams) {
    await this.document.deleteOne(defaultParams);
    return '删除成功';
  }

  /**
   * @description 不返回提示删除存储桶某个文件
   * @param {String} delFile  删除的文件地址，例如：https://rakugo-1258339807.cos.ap-guangzhou.myqcloud.com/avatar/default_avatar.png
   */
  async deleteSomeFile(delFile) {
    if (!delFile) return;

    // 异步删除，失败了也不要紧
    cos.deleteObject({
      Bucket: 'rakugo-1258339807',
      Region: 'ap-guangzhou',
      Key: new URL(delFile).pathname,
    });
  }

  async updateSomeone(defaultParams) {
    const params = { ...defaultParams, updateDate: new Date() };

    if (!params.id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    await this.document.updateOne(
      { id: params.id },
      { $set: params }
    );

    return '修改成功';
  }

  async someoneInfo(defaultParams) {
    const { id } = { ...defaultParams };

    if (!id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    return await this.document.findOne({ id }, { _id: 0 });
  }

  async someoneInfoByParams(defaultParams) {
    return await this.document.findOne(defaultParams, { _id: 0 });
  }

  /**
   * @description 上传单个文件，返回请求参数及文件 url
   * @param {String} filePrefix 文件存储前缀，例如：avatar/，avatar目录下的文件
   * @param {String} delFile  删除的文件地址，例如：https://rakugo-1258339807.cos.ap-guangzhou.myqcloud.com/avatar/default_avatar.png
   * @return { requestBody: any, fileUrl: strng }
   */
  async uploadFile(filePrefix, delFile) {
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

    // 需要删除临时文件
    await fs.unlink(file.filepath);

    const fileUrl = 'https://' + res.Location;

    if (delFile) {
      // 异步删除，失败了也不要紧
      cos.deleteObject({
        Bucket: 'rakugo-1258339807',
        Region: 'ap-guangzhou',
        Key: new URL(delFile).pathname,
      });
    }

    return fileUrl;
  }
}

module.exports = BaseService;
