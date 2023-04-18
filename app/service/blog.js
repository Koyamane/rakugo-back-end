'use strict';

const MyError = require('./myError');
const BaseService = require('./baseService');

class BlogService extends BaseService {
  get document() {
    return this.ctx.model.Blog;
  }

  async queryBlogSimplePage(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };
    const sort = { ...params.sort };
    if (!Object.keys(sort).length) {
      params.sort = { createdDate: -1 };
    }

    return this.queryPage(params);
  }

  async queryBlogPage(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };
    const sort = { ...params.sort };
    if (!Object.keys(sort).length) {
      params.sort = { createdDate: -1 };
    }

    return this.multitableQueryPage(params, {
      from: 'associationdatas',
      localField: 'id',
      foreignField: 'targetId',
      as: 'blogDataArr',
    });
  }

  async addBlog(defaultParams) {
    const { ctx } = this;
    const params = { ...defaultParams, ...this.ctx.request.body };

    if (!params.title) {
      return Promise.reject(new MyError('标题为必传', 400));
    }

    if (/^\s*$/.test(params.title)) {
      return Promise.reject(new MyError('标题不能全是空格', 400));
    }

    if (Array.isArray(params.tags) && params.tags.some(item => ctx.getStrLen(item) > 20)) {
      return Promise.reject(new MyError('单个标签长度不能大于20', 400));
    }

    params.cover = await this.uploadFile('blog/cover/');

    // tags是数组，但是在formData中会自动用转成字符串并且用都好隔开，要手动转
    params.tags = params.tags ? params.tags.split(',') : [];

    const data = await this.document.create(params);

    // 新增相关博文数据
    this.ctx.service.associationData.addAssociationData({
      userId: params.createdId,
      username: params.createdUser,
      targetId: data.id,
    });

    // 同时更新博客数量
    const userInfo = await ctx.getCurrentUserInfo();
    userInfo.blogs++;
    await ctx.service.cache.redis.set(userInfo.userId, userInfo);
    await ctx.model.User.updateOne({ userId: userInfo.userId }, { $inc: { blogs: 1 } });

    return {
      id: data.id,
      msg: '新增成功',
    };
  }

  async deleteBlog(defaultParams) {
    const { ctx } = this;
    const params = { ...defaultParams, ...this.ctx.request.body };

    if (!params.id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    // 顺带把封面的图也删了
    const blogInfo = await this.someoneInfo({ id: params.id });
    blogInfo.cover && this.deleteSomeFile(blogInfo.cover);

    // 删除对应的 associationData 数据
    await ctx.service.associationData.deleteSomeoneByParams({ targetId: blogInfo.id });

    // 更新数据库的 blogs 数量
    await ctx.model.User.updateOne({ userId: blogInfo.createdId }, { $inc: { blogs: -1 } });

    // 把用户收藏的全变为失效
    await ctx.model.Collection.updateMany({ targetId: blogInfo.id, targetType: 'Blog' }, { $set: { status: 'DELETED' } });

    // 删除评论单
    await ctx.model.Comment.deleteMany({ targetId: blogInfo.id, targetType: 'Blog' });
    await ctx.model.CommentChildren.deleteMany({ targetId: blogInfo.id, targetType: 'Blog' });

    // 更新本地缓存的 blogs 数量
    const userInfo = await this.service.cache.redis.get(blogInfo.createdId);
    if (userInfo) {
      userInfo.blogs--;
      await ctx.service.cache.redis.set(userInfo.userId, userInfo);
    }

    await this.deleteSomeone(params);
  }

  async updateBlog(defaultParams) {
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

    if (Array.isArray(params.tags) && params.tags.some(item => this.ctx.getStrLen(item) > 20)) {
      return Promise.reject(new MyError('单个标签长度不能大于20', 400));
    }

    const blogInfo = await this.someoneInfo({ id: params.id });
    const userInfo = await this.ctx.getCurrentUserInfo();

    if (userInfo.userId !== blogInfo.createdId) {
      return Promise.reject(new MyError('你不能操作其他人的博客', 400));
    }

    // tags是数组，但是在formData中会自动用转成字符串并且用都好隔开，要手动转
    params.tags = params.tags ? params.tags.split(',') : [];

    // string 说明没传或者是已有的链接地址，undefined 说明是新 file
    if (typeof params.cover === 'undefined') {
      // 存在就说明是字符串，不是 file
      const blogInfo = await this.someoneInfo({ id: params.id });
      params.cover = await this.uploadFile('blog/cover/', blogInfo.cover);
    }

    await this.document.updateOne({ id: params.id }, { $set: params });

    return '修改成功';
  }

  async updateBlogStatus(defaultParams) {
    const params = {
      ...defaultParams,
      ...this.ctx.request.body,
      approvedDate: new Date(),
    };

    if (!params.id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    await this.document.updateOne({ id: params.id }, { $set: params });

    return '状态修改成功';
  }

  async blogInfo(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.query };

    if (!params.id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    const blogInfoArr = await this.document.aggregate([
      { $match: { id: params.id } },
      { $limit: 1 },
      { $lookup: {
        from: 'associationdatas',
        localField: 'id',
        foreignField: 'targetId',
        as: 'blogDataArr',
      } },
      { $project: { _id: 0 } },
    ]);

    const blogInfo = blogInfoArr[0];

    if (!blogInfo) {
      return {
        success: false,
        data: null,
        errorCode: 404,
        showType: 0,
      };
    }

    // 游客或者未通过审核的，直接返回
    if (!params.userId || blogInfo.status !== 'APPROVED') return blogInfo;

    const { ctx } = this;
    const { userId, id: targetId } = params;

    const blogDataInfo = await ctx.model.AssociationData.findOne({ targetId, targetType: 'Blog' });

    if (blogDataInfo) {
      if (userId !== blogDataInfo.userId && !blogDataInfo.readArr.includes(userId)) {
        blogInfo.reads++;

        // 不是自己看自己且自己从没看过
        blogDataInfo.readArr.push(userId);
        await ctx.model.AssociationData.updateOne(
          { id: blogDataInfo.id },
          { $set: { readArr: blogDataInfo.readArr, updateDate: new Date() } }
        );
        await this.document.updateOne(
          { id: blogInfo.id },
          { $set: { reads: blogDataInfo.readArr.length } }
        );
      }
    }

    return blogInfo;
  }

  async somebodyBlogList(defaultParams) {
    const { userId } = { ...this.ctx.params };

    if (!userId) {
      return Promise.reject(new MyError('未找到用户', 400));
    }

    return this.multitableQueryPage({ ...defaultParams, dto: { createdId: userId } }, {
      from: 'associationdatas',
      localField: 'id',
      foreignField: 'targetId',
      as: 'blogDataArr',
    });
  }
}

module.exports = BlogService;
