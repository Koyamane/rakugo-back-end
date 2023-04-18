'use strict';

const Controller = require('egg').Controller;

class FollowController extends Controller {
  async getWatcherList() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.follow.getFollowList('watcher'));
  }

  async follow() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.follow.follow());
  }

  async getUserFollowStatus() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.follow.getUserFollowStatus());
  }
}

module.exports = FollowController;
