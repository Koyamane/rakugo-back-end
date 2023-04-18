'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
  async userList() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.user.queryUserPage());
  }

  async login() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.user.login());
  }

  async register() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.user.register());
  }

  async logOut() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.user.logOut());
  }

  async updateCurrent() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.user.updateCurrent());
  }

  async updateCurrentPassword() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.user.updateCurrentPassword());
  }

  async updateSomeoneAccess() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.user.updateSomeoneAccess());
  }

  async deleteUser() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.user.deleteUser());
  }

  async userInfo() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.user.userInfo());
  }

  // 更换头像
  async changeAvatar() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.user.changeAvatar());
  }
}

module.exports = UserController;
