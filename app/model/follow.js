'use strict';

module.exports = app => {
  const { mongoose } = app;

  const followSchema = new mongoose.Schema(
    {
      id: {
        type: String,
        unique: true,
        require: true,
        default: () => app.createUuid(17, 10), // 用函数的方法，就不会每次都是固定值了
      },
      // folderId: { type: String, require: true }, // 收藏在哪个文件夹内
      userId: { type: String, require: true },
      targetId: { type: String, require: true },
      createdDate: { type: Date, default: () => new Date() },
    },
    { versionKey: false }
  );

  return mongoose.model('Follow', followSchema);
};
