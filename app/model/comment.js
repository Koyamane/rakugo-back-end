'use strict';

/**
 * 存放的是博文的查看、收藏、点赞等相关数据
 */

module.exports = app => {
  const { mongoose } = app;

  const commentSchema = new mongoose.Schema(
    {
      id: {
        type: String,
        unique: true,
        require: true,
        default: () => app.createUuid(15, 10), // 用函数的方法，就不会每次都是固定值了
      },
      userId: { type: String, require: true }, // 评论人 id
      username: { type: String, require: true }, // 评论人昵称
      userAvatar: { type: String, require: true }, // 评论人头像
      comment: { type: String, require: true }, // 评论类容
      targetId: { type: String, require: true }, // 评论哪个博客内容
      targetType: { // 收藏的内容类型，可能是博客，也可能是别的
        type: String,
        validate: str => {
          return [ 'Blog', 'Music', 'Audio' ].includes(str);
        },
        default: 'Blog',
      },
      status: {
        type: String,
        validate: str => {
          return [ 'READ', 'UNREAD' ].includes(str);
        },
        default: 'UNREAD',
      },
      level: { type: Number, default: 1 },
      createdDate: { type: Date, default: () => new Date() },
      likeArr: {
        type: Array,
        validate: arr => {
          // 必须全是 number
          return arr.every(item => typeof item === 'number');
        },
        default: [],
      },
      dislikeArr: {
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

  return mongoose.model('Comment', commentSchema);
};
