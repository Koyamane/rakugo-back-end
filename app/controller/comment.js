'use strict';

const Controller = require('egg').Controller;

class CommentController extends Controller {
  async commentList() {
    const { ctx } = this;

    const params = { ...this.ctx.request.body };

    if (params.dto.parentId) {
      // 子表
      await ctx.returnService(ctx.service.commentChildren.queryCommentPage());
    } else {
      await ctx.returnService(ctx.service.comment.queryCommentPage());
    }
  }

  async commentTotal() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.comment.getCommentTotal());
  }

  async likeComment() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.comment.likeComment());
  }

  async comment() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.comment.comment());
  }

  async deleteComment() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.comment.deleteComment());
  }
}

module.exports = CommentController;
