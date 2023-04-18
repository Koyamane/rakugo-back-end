'use strict';

const Controller = require('egg').Controller;

class CollectionController extends Controller {
  async collectionList() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.collection.queryCollectionPage());
  }

  async collect() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.collection.collect());
  }
}

module.exports = CollectionController;
