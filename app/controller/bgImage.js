'use strict';

const Controller = require('egg').Controller;

class BgImageController extends Controller {
  async bgImageList() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.bgImage.queryBgImagePage());
  }

  async addBgImage() {
    const { ctx } = this;
    const userInfo = await ctx.getCurrentUserInfo();

    await ctx.returnService(ctx.service.bgImage.addBgImage({
      createdId: userInfo.userId,
      createdName: userInfo.nickname,
    }));
  }

  async deleteBgImage() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.bgImage.deleteBgImage());
  }

  async updateBgImage() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.bgImage.updateBgImage());
  }

  async bgImageInfo() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.bgImage.bgImageInfo());
  }
}

module.exports = BgImageController;
