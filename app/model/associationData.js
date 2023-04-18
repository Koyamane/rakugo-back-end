'use strict';

/**
 * 存放的是博文的查看、收藏、点赞等相关数据
 */

module.exports = app => {
  const { mongoose } = app;

  const associationDataSchema = new mongoose.Schema(
    {
      id: {
        type: String,
        unique: true,
        require: true,
        default: () => app.createUuid(12, 10), // 用函数的方法，就不会每次都是固定值了
      },
      targetId: { type: String, unique: true, require: true },
      targetType: { // 内容类型，可能是博客，也可能是别的
        type: String,
        validate: str => {
          return [ 'Blog', 'Comment', 'Music', 'Audio' ].includes(str);
        },
        default: 'Blog',
      },
      userId: { type: String, require: true },
      username: { type: String, default: '' },
      createdDate: { type: Date, default: () => new Date() },
      updateDate: { type: Date, default: () => new Date() },
      readArr: { // 保存的是用户 id
        type: Array,
        validate: arr => {
          // 必须全是 number
          return arr.every(item => typeof item === 'number');
        },
        default: [],
      },
      likeArr: { // 保存的是用户 id
        type: Array,
        validate: arr => {
          // 必须全是 number
          return arr.every(item => typeof item === 'number');
        },
        default: [],
      },
      dislikeArr: { // 保存的是用户 id
        type: Array,
        validate: arr => {
          // 必须全是 number
          return arr.every(item => typeof item === 'number');
        },
        default: [],
      },
      collectionArr: { // 保存的是用户 id
        type: Array,
        validate: arr => {
          // 必须全是 number
          return arr.every(item => typeof item === 'number');
        },
        default: [],
      },
    },
    { versionKey: false }
  );

  return mongoose.model('AssociationData', associationDataSchema);
};
