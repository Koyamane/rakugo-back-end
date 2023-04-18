'use strict';

// const MyError = require('./myError');
const BaseService = require('./baseService');

class CommentChildrenService extends BaseService {
  get document() {
    return this.ctx.model.CommentChildren;
  }

  async queryCommentPage(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };
    const sort = { ...params.sort };
    if (!Object.keys(sort).length) {
      params.sort = { likeArr: -1 };
    }

    return this.queryPage(params);
  }
}

module.exports = CommentChildrenService;
