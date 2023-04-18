'use strict';

const MyError = require('./myError');
const BaseService = require('./baseService');

class FollowService extends BaseService {
  get document() {
    return this.ctx.model.Follow;
  }

  async getFollowList(type, defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };
    const sort = { ...params.sort };
    if (!Object.keys(sort).length) {
      params.sort = { createdDate: -1 };
    }

    const dto = { ...params.dto };

    if (!dto.userId && !dto.targetId) {
      return Promise.reject(new MyError('用户ID为必传', 400));
    }

    const filterArr = [ '_id', 'access', 'password', 'createdDate' ];

    return this.multitableQueryPage(params, {
      from: 'users',
      localField: type === 'watcher' ? 'targetId' : 'userId',
      foreignField: 'userId',
      as: 'targetArr',
    }, arr => {
      if (arr.length <= 0) return [];

      const list = arr.map(item => {
        const target = item.targetArr[0];
        const data = {};
        for (const key in target) {
          if (Object.hasOwnProperty.call(target, key) && !filterArr.includes(key)) {
            data[key] = target[key];
          }
        }
        return data;
      });

      return list;
    });
  }

  async follow(defaultParams) {
    const { ctx } = this;
    const userInfo = await ctx.getCurrentUserInfo();
    const params = {
      ...defaultParams,
      userId: userInfo.userId,
      ...this.ctx.request.body,
    };

    const { userId, targetId } = params;

    if (!targetId) {
      return Promise.reject(new MyError('目标ID为必传', 400));
    }

    if (targetId === userId) {
      return {
        status: 'CANT_SELF',
        isFollowed: false,
        num: userInfo.watchers,
      };
    }

    let obj = {};
    const followData = await this.someoneInfoByParams({ userId, targetId });

    if (followData) {
      // 那么说明是取消关注
      userInfo.watchers--;
      await this.deleteSomeone({ id: followData.id });
      await ctx.model.User.updateOne({ userId: targetId }, { $inc: { followers: -1 } });
      obj = {
        status: 'UNFOLLOWED',
        isFollowed: false,
        num: userInfo.watchers,
      };
    } else {
      // 说明是关注了
      userInfo.watchers++;
      await this.document.create(params);
      await ctx.model.User.updateOne({ userId: targetId }, { $inc: { followers: 1 } });
      obj = {
        status: 'FOLLOWED',
        isFollowed: true,
        num: userInfo.watchers,
      };
    }

    // 同时更新用户的收藏数量
    await ctx.service.cache.redis.set(userInfo.userId, userInfo);
    await ctx.model.User.updateOne({ userId }, { $set: { watchers: userInfo.watchers } });

    return obj;
  }

  async getUserFollowStatus(defaultParams) {
    const { ctx } = this;
    const params = {
      ...defaultParams,
      ...this.ctx.request.query,
    };

    const userInfo = await ctx.getCurrentUserInfo();

    if (!userInfo && !params.userId) {
      // 说明没登录，直接返回 false
      return {
        isFollowed: false,
      };
    }

    const { targetId } = params;
    const userId = params.userId || userInfo.userId;

    if (!targetId) {
      return Promise.reject(new MyError('目标ID为必传', 400));
    }

    const flag = await this.someoneInfoByParams({ userId, targetId });

    return {
      isFollowed: !!flag,
    };
  }
}

module.exports = FollowService;
