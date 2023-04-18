'use strict';

/**
 * 存放的是博文的查看、收藏、点赞等相关数据
 */

module.exports = app => {
  const { mongoose } = app;

  const collectionSchema = new mongoose.Schema(
    {
      id: {
        type: String,
        unique: true,
        require: true,
        default: () => app.createUuid(14, 10), // 用函数的方法，就不会每次都是固定值了
      },
      // folderId: { type: String, require: true }, // 收藏在哪个文件夹内
      userId: { type: String, require: true },
      username: { type: String, require: true },
      status: {
        type: String,
        validate: str => {
          return [ 'ALIVE', 'DELETED' ].includes(str);
        },
        default: 'ALIVE',
      },
      targetId: { type: String, require: true },
      targetType: { // 收藏的内容类型，可能是博客，也可能是别的
        type: String,
        validate: str => {
          return [ 'Blog', 'Music', 'Audio' ].includes(str);
        },
        default: 'Blog',
      },
      createdDate: { type: Date, default: () => new Date() },
    },
    { versionKey: false }
  );

  return mongoose.model('Collection', collectionSchema);
};
