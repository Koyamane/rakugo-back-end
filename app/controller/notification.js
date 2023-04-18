'use strict';

const Controller = require('egg').Controller;

class NotificationController extends Controller {
  async notificationList() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.notification.queryNotificationPage());
  }

  async addNotification() {
    const { ctx } = this;
    const userInfo = await ctx.getCurrentUserInfo();

    await ctx.returnService(ctx.service.notification.addNotification({
      createdAvatar: userInfo.avatar,
      createdName: userInfo.nickname,
      createdUser: userInfo.username,
      createdId: userInfo.userId,
    }));
  }

  async deleteNotification() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.notification.deleteNotification());
  }

  async updateNotification() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.notification.updateNotification());
  }

  async notificationInfo() {
    const { ctx } = this;
    await ctx.returnService(ctx.service.notification.notificationInfo());
  }
}

module.exports = NotificationController;
