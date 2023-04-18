'use strict';

const MyError = require('./myError');
const BaseService = require('./baseService');

class CollectionService extends BaseService {
  get document() {
    return this.ctx.model.Collection;
  }

  async queryCollectionPage(defaultParams) {
    const { type } = { ...this.ctx.params };

    if (!type) {
      return Promise.reject(new MyError('不存在的地址', 404));
    }

    // 这里是数据库的表名
    let coll = 'blogs';

    switch (type) {
      case 'blog':
        coll = 'blogs';
        break;
      default:
        break;
    }

    const params = { ...defaultParams, ...this.ctx.request.body };
    const sort = { ...params.sort };
    if (!Object.keys(sort).length) {
      params.sort = { createdDate: -1 };
    }

    const dto = { ...params.dto };

    if (!dto.userId) {
      return Promise.reject(new MyError('用户ID为必传', 400));
    }

    return this.multitableQueryPage(params, {
      from: coll,
      localField: 'targetId',
      foreignField: 'id',
      as: 'targetArr',
    }, arr => {
      if (arr.length <= 0) return [];

      const list = arr.map(item => item.targetArr[0] || item);

      return list;
    });
  }

  async collect(defaultParams) {
    const { ctx } = this;
    const userInfo = await ctx.getCurrentUserInfo();
    const params = {
      ...defaultParams,
      username: userInfo.nickname,
      userId: userInfo.userId,
      ...this.ctx.request.body,
    };

    const { targetType = 'Blog', userId, targetId } = params;

    if (!targetId) {
      return Promise.reject(new MyError('目标ID为必传', 400));
    }

    let status = '';
    const collectionData = await this.someoneInfoByParams({ userId, targetId, targetType });

    // 有可能不存在的，因为博客删除后，相关的东西也会删掉
    const associationData = await ctx.model.AssociationData.findOne({ targetId });
    const collectionArr = associationData ? associationData.collectionArr : '';

    if (collectionData) {
      // 那么说明是取消收藏
      status = 'CANCEL_COLLECT';
      await this.deleteSomeone({ id: collectionData.id });
      userInfo.collections--;
      if (collectionArr) {
        // 更新目标的收藏数
        collectionArr.splice(collectionArr.indexOf(userId), 1);
        await ctx.model[targetType].updateOne({ id: targetId }, { $inc: { collections: -1 } });
      }
    } else {
      // 说明是收藏
      status = 'COLLECT';
      await this.document.create(params);
      userInfo.collections++;
      if (collectionArr) {
        // 更新目标的收藏数
        collectionArr && collectionArr.push(userId);
        await ctx.model[targetType].updateOne({ id: targetId }, { $inc: { collections: 1 } });
      }
      // 更新目标的收藏数
    }

    // 更新目标数据详情单的收藏数组
    collectionArr && await ctx.model.AssociationData.updateOne({ targetId }, { $set: { collectionArr } });

    // 同时更新用户的收藏数量
    await ctx.service.cache.redis.set(userId, userInfo);
    await ctx.model.User.updateOne({ userId }, { $set: { collections: userInfo.collections } });

    return {
      status,
      arr: collectionArr || [],
    };
  }
}

module.exports = CollectionService;
