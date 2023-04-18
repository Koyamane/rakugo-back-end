'use strict';

const MyError = require('./myError');
const BaseService = require('./baseService');

class CommentService extends BaseService {
  get document() {
    return this.ctx.model.Comment;
  }

  async queryCommentPage(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };
    const sort = { ...params.sort };
    if (!Object.keys(sort).length) {
      params.sort = { likeArr: -1 };
    }

    const resData = await this.multitableQueryPage(params,
      {
        from: 'commentchildrens',
        localField: 'id',
        foreignField: 'parentId',
        as: 'children',
      }, list => {
        const parentList = JSON.parse(JSON.stringify(list));

        parentList.forEach(item => {
          item.childrenTotal = item.children.length;
          if (item.children.length > 0) {
            const arr = [];
            const info = JSON.parse(JSON.stringify(item.children[0]));
            delete info._id;

            arr.push(info);

            if (item.children[1]) {
              const info2 = JSON.parse(JSON.stringify(item.children[1]));
              delete info2._id;
              arr.push(info2);
            }
            item.children = arr;
          }
        });

        return parentList;
      }
    );

    const dto = { ...params.dto };

    if (!dto.targetId) return resData;

    const childrenTotal = await this.ctx.model.CommentChildren.find({ targetId: dto.targetId }).count();

    return {
      ...resData,
      targetTotal: resData.total + childrenTotal,
    };
  }

  async getCommentTotal(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.query };
    const { targetId } = params;

    if (!targetId) {
      return Promise.reject(new MyError('目标ID为必传', 400));
    }

    const total = await this.document.find({ targetId }).count();
    const childrenTotal = await this.ctx.model.CommentChildren.find({ targetId }).count();

    return total + childrenTotal;
  }

  async comment(defaultParams) {
    const { ctx } = this;
    const userInfo = await ctx.getCurrentUserInfo();
    const params = {
      targetType: 'Blog',
      level: 1,
      ...defaultParams,
      userId: userInfo.userId,
      userAvatar: userInfo.avatar,
      username: userInfo.nickname,
      ...this.ctx.request.body,
    };

    const { comment = '', level, targetType, targetId } = params;

    if (!targetId) {
      return Promise.reject(new MyError('目标ID为必传', 400));
    }

    if (!comment) {
      return Promise.reject(new MyError('评论内容为必传', 400));
    }

    if (/^\s*$/.test(comment)) {
      return Promise.reject(new MyError('评论内容不能全是空格', 400));
    }

    let commentData = {};

    if (Number(level) > 1) {
      // 说明是子表
      commentData = await ctx.model.CommentChildren.create(params);
      commentData = JSON.parse(JSON.stringify(commentData));
    } else {
      commentData = await this.document.create(params);
      commentData = JSON.parse(JSON.stringify(commentData));
      commentData.children = [];
      commentData.childrenTotal = 0;
    }

    delete commentData._id;
    await ctx.model[targetType].updateOne({ id: targetId }, { $inc: { comments: 1 } });

    return commentData;
  }

  async deleteComment(defaultParams) {
    const { ctx } = this;
    const params = {
      targetType: 'Blog',
      ...defaultParams,
      ...this.ctx.request.body,
    };

    const { id, isChildren, targetType, targetId } = params;

    if (!targetId) {
      return Promise.reject(new MyError('目标ID为必传', 400));
    }

    if (!id) {
      return Promise.reject(new MyError('评论ID为必传', 400));
    }

    if (isChildren) {
      await ctx.model.CommentChildren.deleteOne({ id });
      await ctx.model[targetType].updateOne({ id: targetId }, { $inc: { comments: -1 } });
    } else {
      await this.deleteSomeone(params);
      const res = await ctx.model.CommentChildren.deleteMany({ parentId: id });
      await ctx.model[targetType].updateOne({ id: targetId }, { $inc: { comments: -(res.deletedCount + 1) } });
    }

    return '删除成功';
  }

  async likeComment(defaultParams) {
    const { ctx } = this;
    const params = {
      ...defaultParams,
      ...ctx.request.body,
    };

    const { userId, isChildren, id, type } = params;

    if (!id) {
      return Promise.reject(new MyError('请传入评论ID', 400));
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

    let commentInfo = null;

    if (isChildren) {
      commentInfo = await ctx.model.CommentChildren.findOne({ id }, { _id: 0 });
    } else {
      commentInfo = await this.someoneInfo({ id });
    }

    const obj = {
      status: '',
      arr: [],
    };

    if (type === 'LIKE') {
      const { likeArr } = commentInfo;

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
      if (isChildren) {
        await ctx.model.CommentChildren.updateOne({ id }, { $set: { likeArr } });
      } else {
        await this.document.updateOne({ id }, { $set: { likeArr } });
      }
    } else {
      const { dislikeArr } = commentInfo;

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
      if (isChildren) {
        await ctx.model.CommentChildren.updateOne({ id }, { $set: { dislikeArr } });
      } else {
        await this.document.updateOne({ id }, { $set: { dislikeArr } });
      }
    }

    return obj;
  }
}

module.exports = CommentService;
