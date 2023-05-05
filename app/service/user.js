'use strict';

const MyError = require('./myError');
const BaseService = require('./baseService');

class UserService extends BaseService {
  get document() {
    return this.ctx.model.User;
  }

  async queryUserPage(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };
    const sort = { ...params.sort };
    if (!Object.keys(sort).length) {
      params.sort = { updateDate: -1 };
    }

    return this.queryPage(params);
  }

  async login() {
    const { app, ctx } = this;

    const params = ctx.request.body || {};

    if (!params.username) {
      return Promise.reject(new MyError('用户名未传', 400));
    }

    if (!params.password) {
      return Promise.reject(new MyError('密码未传', 400));
    }

    const userInfo = await this.document.findOne({ username: params.username }, { _id: 0 });

    if (!userInfo) {
      return Promise.reject(new MyError('该用户不存在', 400));
    }

    if (userInfo.password !== params.password) {
      return Promise.reject(new MyError('密码不正确', 400));
    }

    // 前端不需要password
    const userInfo2 = JSON.parse(JSON.stringify(userInfo));
    userInfo2.password = undefined;
    delete userInfo2.password;

    const token = app.jwt.sign(
      { userId: userInfo2.userId },
      app.config.jwt.secret
    );

    // 以用户名存好，并设置好过期时间
    await ctx.service.cache.redis.set(userInfo2.userId, userInfo2, app.config.session.maxAge);

    // 如果用户勾选了 `记住我`，设置 30 天的过期时间
    if (params.rememberMe) {
      await ctx.service.cache.redis.set(userInfo2.userId, userInfo2, 1000 * 60 * 60 * 24 * 30);
    }

    return {
      token,
      userInfo: userInfo2,
    };
  }

  async register() {
    const { app, ctx } = this;

    const params = ctx.request.body || {};

    if (!params.username) {
      return Promise.reject(new MyError('用户名未传', 400));
    }

    if (params.username.length < 6 || params.username.length > 16) {
      return Promise.reject(new MyError('用户名必须在6~16个字符之间', 400));
    }

    if (!params.password) {
      return Promise.reject(new MyError('密码未传', 400));
    }

    if (params.password.length < 6 || params.password.length > 16) {
      return Promise.reject(new MyError('密码必须在6~16个字符之间', 400));
    }

    const isHas = await this.document.findOne({ username: params.username });

    if (isHas) {
      return Promise.reject(new MyError('用户名已存在，换个用户名吧', 400));
    }

    const userInfo = await this.document.create({
      username: params.username,
      password: params.password,
      nickname: params.username,
    });

    const token = app.jwt.sign(
      { userId: userInfo.userId },
      app.config.jwt.secret
    );

    // 前端不需要_id和password
    const userInfo2 = JSON.parse(JSON.stringify(userInfo));
    userInfo2.password = undefined;
    userInfo2._id = undefined;
    delete userInfo2.password;
    delete userInfo2._id;

    // 以用户名存好，并设置好过期时间
    await ctx.service.cache.redis.set(userInfo2.userId, userInfo2, app.config.session.maxAge);

    return {
      token,
      userInfo: userInfo2,
    };
  }

  async logOut() {
    const { ctx } = this;

    const userInfo = await ctx.getCurrentUserInfo();

    await ctx.service.cache.redis.del(userInfo.userId);

    return '已退出登录';
  }

  async updateCurrent(defaultParams) {
    const { ctx } = this;
    const params = { ...defaultParams, ...ctx.request.body, updateDate: new Date() };

    if (!Object.keys(params).length) {
      return {};
    }

    if (params.nickname) {
      if (/^\s*$/.test(params.nickname)) {
        return Promise.reject(new MyError('昵称不能全是空格', 400));
      }

      if (ctx.getStrLen(params.nickname) > 20) {
        return Promise.reject(new MyError('昵称不能大于20个字符', 400));
      }
    }

    if (params.signature) {
      if (/^\s*$/.test(params.signature)) {
        return Promise.reject(new MyError('签名不能全是空格', 400));
      }

      if (ctx.getStrLen(params.signature) > 40) {
        return Promise.reject(new MyError('签名不能大于40个字符', 400));
      }
    }

    if (Array.isArray(params.tags) && params.tags.some(item => ctx.getStrLen(item) > 20)) {
      return Promise.reject(new MyError('单个标签长度不能大于20', 400));
    }

    const userInfo = await ctx.getCurrentUserInfo();

    const filterArr = [ '_id', 'access', 'username', 'password', 'userId', 'createdDate', 'notifyCount', 'unreadCount' ];

    const updateData = {};
    for (const key in params) {
      if (Object.hasOwnProperty.call(params, key) && !filterArr.includes(key)) {
        updateData[key] = params[key];
      }
    }

    updateData.updateDate = new Date();

    await this.document.updateOne({ userId: userInfo.userId }, { $set: updateData });

    if (updateData.nickname !== userInfo.nickname || updateData.signature !== userInfo.signature) {
      // 改动了昵称或签名，那么，相关博客里面的创建人昵称也要改
      await ctx.model.Blog.updateMany({ createdId: userInfo.userId }, { $set: {
        createdName: updateData.nickname,
        createdSignature: updateData.signature,
      } });
    }
    await ctx.service.cache.redis.set(userInfo.userId, { ...userInfo, ...updateData });

    return '修改成功';
  }

  async updateCurrentPassword(defaultParams) {
    const { ctx } = this;
    const { password, userId } = { ...defaultParams, ...ctx.request.body };

    if (!userId) {
      return Promise.reject(new MyError('请传入用户ID', 400));
    }

    if (!password) {
      return Promise.reject(new MyError('请传入要更改的密码', 400));
    }

    if (password.length < 6 || password.length > 16) {
      return Promise.reject(new MyError('密码必须在6~16个字符之间', 400));
    }

    // 其实 userId 传不传无所谓，本来就能根据 token 拿到当前用户的详情
    const userInfo = await ctx.getCurrentUserInfo();

    const date = new Date();

    await this.document.updateOne({ userId }, { $set: { password, updateDate: date } });

    await ctx.service.cache.redis.set(userId, { ...userInfo, updateDate: date });

    return '修改成功';
  }

  async updateSomeoneAccess(defaultParams) {
    const { ctx } = this;
    const params = {
      ...defaultParams,
      ...this.ctx.request.body,
      updateDate: new Date(),
    };

    if (!params.userId) {
      return Promise.reject(new MyError('请传入用户ID', 400));
    }

    if (!params.access) {
      return Promise.reject(new MyError('请传入权限值', 400));
    }

    await this.document.updateOne({ userId: params.userId }, { $set: {
      access: params.access,
      updateDate: params.updateDate,
    } });

    // 更新缓存
    const userInfo = await this.service.cache.redis.get(params.userId);
    if (userInfo) {
      await ctx.service.cache.redis.set(params.userId, {
        ...userInfo,
        access: params.access,
        updateDate: params.updateDate,
      });
    }

    return '修改成功';
  }

  async deleteUser(defaultParams) {
    const { ctx } = this;
    const params = { ...defaultParams, ...this.ctx.request.body };

    if (!params.userId) {
      return Promise.reject(new MyError('请传入用户ID', 400));
    }

    // 顺带把头像的图也删了
    const userInfo = await this.someoneInfoByParams({ userId: params.userId });
    const avatarUrl = new URL(userInfo.avatar).pathname;

    avatarUrl !== '/avatar/default_avatar.png' && this.deleteSomeFile(userInfo.avatar);

    await this.deleteSomeoneByParams(params);
    await ctx.service.cache.redis.del(params.userId);
    return '删除成功';
  }

  async userInfo(defaultParams) {
    const { ctx } = this;
    const params = { ...defaultParams, ...ctx.request.body };

    let userInfo = null;

    if (!Object.keys(params).length) {
      // 没传值就返回当前用户
      userInfo = await ctx.getCurrentUserInfo();
    } else {
      userInfo = await this.document.findOne(params, { password: 0, _id: 0 });
    }

    if (!userInfo) {
      return {
        success: false,
        data: null,
        errorCode: 404,
        showType: 0,
      };
    }

    return userInfo;
  }

  // 用户更换头像
  async changeAvatar() {
    const { ctx } = this;
    const userInfo = await ctx.getCurrentUserInfo();
    const preAvatar = new URL(userInfo.avatar).pathname;

    // 不等于默认头像，就要删除
    const avatarUrl = await this.uploadFile('avatar/', preAvatar !== '/avatar/default_avatar.png' ? userInfo.avatar : '');

    await this.document.updateOne({ userId: userInfo.userId }, { $set: { avatar: avatarUrl } });
    // 把相关博客的头像都改了
    await ctx.model.Blog.updateMany({ createdId: userInfo.userId }, { $set: { createdAvatar: avatarUrl } });
    // 更新缓存
    await ctx.service.cache.redis.set(userInfo.userId, { ...userInfo, avatar: avatarUrl });

    return avatarUrl;
  }
}

module.exports = UserService;
