'use strict';

const Controller = require('egg').Controller;

class FileController extends Controller {
  async uploadFile() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.upload.uploadFile(ctx.request.body.filePrefix || 'other/'));
  }

  async updateFile() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.upload.updateFile(ctx.request.body.filePrefix || 'other/', ctx.request.body.delFileUrl || ''));
  }

  async deleteFile() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.upload.deleteFile(ctx.request.body));
  }

  // async fileUrl() {
  //   const { ctx } = this;
  //   await ctx.returnService(ctx.service.upload.blogInfo());
  // }
}

module.exports = FileController;
