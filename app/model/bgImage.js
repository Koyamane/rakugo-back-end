'use strict';

module.exports = app => {
  const { mongoose } = app;

  const bgImageSchema = new mongoose.Schema(
    {
      id: {
        type: String,
        unique: true,
        require: true,
        default: () => app.createUuid(6, 10), // 用函数的方法，就不会每次都是固定值了
      },
      order: { type: Number, default: 1 },
      imgUrl: { type: String, require: true },
      createdId: { type: String, require: true },
      createdName: { type: String, default: '' },
      updateDate: { type: Date, default: () => new Date() },
      createdDate: { type: Date, default: () => new Date() },
      position: { type: String, default: '' },
      status: {
        type: String,
        validate: str => {
          // 必须全是 NOT_EXPIRED 和 EXPIRED
          return [ 'NOT_EXPIRED', 'EXPIRED' ].includes(str);
        },
        default: 'NOT_EXPIRED', // 默认没过期
      },
    },
    { versionKey: false }
  );

  return mongoose.model('BgImage', bgImageSchema);
};
