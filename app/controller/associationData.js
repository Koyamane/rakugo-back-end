'use strict';

const Controller = require('egg').Controller;

class AssociationDataController extends Controller {
  async associationDataList() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.associationData.queryAssociationDataPage());
  }

  async likeAssociationData() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.associationData.likeAssociationData());
  }

  async associationDataInfo() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.associationData.associationDataInfo());
  }
}

module.exports = AssociationDataController;
