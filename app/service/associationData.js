'use strict';

const MyError = require('./myError');
const BaseService = require('./baseService');

class AssociationDataService extends BaseService {
  get document() {
    return this.ctx.model.AssociationData;
  }

  async queryAssociationDataPage(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };
    const dto = { ...params.dto };
    const sort = { ...params.sort };
    if (!Object.keys(sort).length) {
      params.sort = { updateDate: -1 };
    }

    if (!dto.targetType) {
      dto.targetType = 'Blog';
      params.dto = { ...dto };
    }

    return this.queryPage(params);
  }

  async addAssociationData(defaultParams) {
    const params = { ...defaultParams };
    params.targetType = params.targetType || 'Blog';

    if (!params.userId) {
      return Promise.reject(new MyError('创建人ID为必传', 400));
    }

    if (!params.targetId) {
      return Promise.reject(new MyError('目标ID为必传', 400));
    }

    const data = await this.document.create(params);

    return {
      id: data.id,
      msg: '新增成功',
    };
  }

  async deleteAssociationData(defaultParams) {
    const params = { ...defaultParams };

    if (!params.id && !params.targetId) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    await this.deleteSomeone(params);
  }

  async likeAssociationData(defaultParams) {
    const { ctx } = this;
    const params = {
      ...defaultParams,
      ...ctx.request.body,
    };

    const { userId, targetId, type } = params;

    if (!targetId) {
      return Promise.reject(new MyError('请传入目标ID', 400));
    }

    if (!userId) {
      return Promise.reject(new MyError('请传入用户ID', 400));
    }

    if (!type) {
      return Promise.reject(new MyError('请传入操作类型', 400));
    }

    if (type !== 'LIKE' && type !== 'DISLIKE') {
      return Promise.reject(new MyError('操作类型不正确', 400));
    }

    const associationDataInfo = await this.someoneInfoByParams({ targetId });

    const obj = {
      status: '',
      arr: [],
    };

    if (type === 'LIKE') {
      const { likeArr } = associationDataInfo;

      if (likeArr.includes(userId)) {
        // 存在则取消点赞
        likeArr.splice(likeArr.indexOf(userId), 1);
        obj.status = 'CANCEL_LIKE';
      } else {
        // 不存在则点赞
        likeArr.push(userId);
        obj.status = 'LIKE';
      }
      obj.arr = likeArr;
      await this.document.updateOne({ targetId }, { $set: { likeArr } });
      await ctx.model.Blog.updateOne({ id: targetId }, { $set: { likes: likeArr.length } });
    } else {
      const { dislikeArr } = associationDataInfo;

      if (dislikeArr.includes(userId)) {
        // 存在则取消点踩
        dislikeArr.splice(dislikeArr.indexOf(userId), 1);
        obj.status = 'CANCEL_DISLIKE';
      } else {
        // 不存在则点踩
        dislikeArr.push(userId);
        obj.status = 'DISLIKE';
      }

      obj.arr = dislikeArr;
      await this.document.updateOne({ targetId }, { $set: { dislikeArr } });
      await ctx.model.Blog.updateOne({ id: targetId }, { $set: { dislikes: dislikeArr.length } });
    }

    return obj;
  }

  async associationDataInfo(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.query };

    if (!params.targetId) {
      return Promise.reject(new MyError('请传入目标ID', 400));
    }

    const associationDataInfo = await this.someoneInfoByParams({ targetId: params.targetId });

    return associationDataInfo;
  }
}

module.exports = AssociationDataService;
