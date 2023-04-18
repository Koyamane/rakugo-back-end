'use strict';

const Controller = require('egg').Controller;

class DataDictionaryController extends Controller {
  async page() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.dataDictionary.page());
  }

  async add() {
    const { ctx } = this;
    const userInfo = await ctx.getCurrentUserInfo();

    await ctx.returnService(
      ctx.service.dataDictionary.add({
        createdName: userInfo.nickname,
        createdId: userInfo.userId,
      })
    );
  }

  async delete() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.dataDictionary.delete());
  }

  async update() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.dataDictionary.update());
  }

  async info() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.dataDictionary.info());
  }
}

module.exports = DataDictionaryController;
