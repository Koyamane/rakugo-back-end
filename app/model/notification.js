'use strict';

module.exports = app => {
  const { mongoose } = app;

  const notificationSchema = new mongoose.Schema(
    {
      id: {
        type: String,
        unique: true,
        require: true,
        default: () => app.createUuid(13, 10), // 用函数的方法，就不会每次都是固定值了
      },
      createdUser: { type: String, default: '' },
      createdName: { type: String, default: '' },
      createdId: { type: String, default: '' },
      createdAvatar: { type: String, default: '' },
      createdDate: { type: Date, default: () => new Date() },
      updateDate: { type: Date, default: () => new Date() },
      // expirationDate: {
      //   type: Array,
      //   validate: arr => {
      //     if (arr.lenght !== 2) return false;

      //     // 必须全是 date 且日期正确
      //     const flag = arr[0] instanceof Date && arr[1] instanceof Date && arr[0].getTime() < arr[1].getTime();

      //     return flag;
      //   },
      //   default: () => ([ new Date(), new Date() ]),
      // },
      title: { type: String, default: '' },
      title_zh: { type: String, default: '' },
      title_en: { type: String, default: '' },
      title_ja: { type: String, default: '' },
      order: { type: Number, default: 1 },
      status: {
        type: String,
        validate: str => {
          // 必须全是 NOT_EXPIRED 和 EXPIRED
          return [ 'NOT_EXPIRED', 'EXPIRED' ].includes(str);
        },
        default: 'NOT_EXPIRED', // 默认没过期
      },
      access: {
        type: String,
        validate: str => {
          // 必须全是 admin、user
          return [ 'admin', 'user', 'all' ].includes(str);
        },
        default: 'all',
      },
    },
    { versionKey: false }
  );

  return mongoose.model('Notification', notificationSchema);
};
