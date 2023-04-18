'use strict';

const MyError = require('./myError');
const BaseService = require('./baseService');

class NotificationService extends BaseService {
  get document() {
    return this.ctx.model.Notification;
  }

  async queryNotificationPage(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };
    const sort = { ...params.sort };

    if (!Object.keys(sort).length) {
      params.sort = { order: 1 };
    }

    return this.queryPage(params);
  }

  async addNotification(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };
    // let expirationDate = params.expirationDate;

    if (!params.title) {
      return Promise.reject(new MyError('标题为必传', 400));
    }

    if (/^\s*$/.test(params.title)) {
      return Promise.reject(new MyError('标题不能全是空格', 400));
    }

    // if (Array.isArray(params.tags) && params.tags.some(item => this.ctx.getStrLen(item) > 20)) {
    //   return Promise.reject(new MyError('单个标签长度不能大于20', 400));
    // }

    // 前端如果传了时间参数，则必须为 YYYY-MM-DDTHH:mm:ss
    // if (expirationDate instanceof Array && expirationDate.length === 2) {
    //   if (new Date(expirationDate[0]) >= new Date(expirationDate(1))) {
    //     return Promise.reject(new MyError('开始日期要小于结束日期', 400));
    //   }
    //   expirationDate = [ new Date(expirationDate[0]), new Date(expirationDate[1]) ];
    // } else {
    //   expirationDate = [ new Date(), new Date() ];
    // }

    const data = await this.document.create({ ...params });

    // const startId = setTimeout(async () => {
    //   clearTimeout(startId);
    //   await this.updateNotificationStatus(params.id, 'NOT_EXPIRED');
    // }, expirationDate[0].getTime() - Date.now());

    // const stopId = setTimeout(async () => {
    //   clearTimeout(stopId);
    //   await this.updateNotificationStatus(params.id, 'EXPIRED');
    // }, expirationDate[1].getTime() + 1 - expirationDate[0].getTime());

    return {
      id: data.id,
      msg: '新增成功',
    };
  }

  /**
   * @description 到期了，及时更新状态
   * @param {Number} id 对应的通知id
   * @param {'EXPIRED' | 'NOT_EXPIRED'} status 状态码
   */
  async updateNotificationStatus(id, status) {
    if (!id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    await this.document.updateOne({ id }, { $set: { status } });
  }

  async deleteNotification(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.body };

    if (!params.id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    await this.deleteSomeone(params);
  }

  async updateNotification(defaultParams) {
    const params = {
      ...defaultParams,
      ...this.ctx.request.body,
      updateDate: new Date(),
    };
    // let expirationDate = params.expirationDate;

    if (!params.id) {
      return Promise.reject(new MyError('请传入ID', 400));
    }

    if (!params.title) {
      return Promise.reject(new MyError('标题为必传', 400));
    }

    if (/^\s*$/.test(params.title)) {
      return Promise.reject(new MyError('标题不能全是空格', 400));
    }

    // if (Array.isArray(params.tags) && params.tags.some(item => this.ctx.getStrLen(item) > 20)) {
    //   return Promise.reject(new MyError('单个标签长度不能大于20', 400));
    // }

    // 前端如果传了时间参数，则必须为 YYYY-MM-DDTHH:mm:ss
    // if (expirationDate instanceof Array && expirationDate.length === 2) {
    //   if (new Date(expirationDate[0]) >= new Date(expirationDate(1))) {
    //     return Promise.reject(new MyError('开始日期要小于结束日期', 400));
    //   }
    //   expirationDate = [ new Date(expirationDate[0]), new Date(expirationDate[1]) ];
    // } else {
    //   expirationDate = [ new Date(), new Date() ];
    // }

    await this.document.updateOne({ id: params.id }, { $set: params });

    // const startId = setTimeout(async () => {
    //   clearTimeout(startId);
    //   await this.updateNotificationStatus(params.id, 'NOT_EXPIRED');
    // }, expirationDate[0].getTime() - Date.now());

    // const stopId = setTimeout(async () => {
    //   clearTimeout(stopId);
    //   await this.updateNotificationStatus(params.id, 'EXPIRED');
    // }, expirationDate[1].getTime() + 1 - expirationDate[0].getTime());

    return '修改成功';
  }

  async notificationInfo(defaultParams) {
    const params = { ...defaultParams, ...this.ctx.request.query };

    const notificationInfo = await this.someoneInfo(params);

    if (!notificationInfo) {
      return Promise.reject(new MyError('该通知不存在', 400));
    }

    return notificationInfo;
  }
}

module.exports = NotificationService;
